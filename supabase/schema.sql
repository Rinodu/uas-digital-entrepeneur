-- Content Kanban Web (Supabase/Postgres)
-- Jalankan di Supabase SQL Editor.

-- Extensions
create extension if not exists pgcrypto;

-- Profiles table (role: admin/staff)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'staff' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

-- Helper: is_admin()
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'staff')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Contents table
create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  platform text not null check (platform in ('Reels','TikTok','YT Shorts')),
  status text not null default 'Not Started' check (status in ('Not Started','In Progress','Complete')),
  pic_email text not null,
  deadline date not null,
  brief_request text,
  link_asset text,
  link_draft text,
  final_drive_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Complete wajib final link (Drive file / Docs)
  constraint complete_requires_final_link check (
    status <> 'Complete'
    OR (
      final_drive_link is not null
      AND (
        final_drive_link like '%drive.google.com/file/d/%'
        OR final_drive_link like '%docs.google.com/%'
      )
    )
  )
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contents_set_updated_at on public.contents;
create trigger contents_set_updated_at
before update on public.contents
for each row execute function public.set_updated_at();

-- Audit logs (riwayat perubahan penting)
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  content_id uuid not null references public.contents(id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  field text not null,
  old_value text,
  new_value text
);

-- Audit trigger (log perubahan field inti)
create or replace function public.audit_contents_changes()
returns trigger
language plpgsql
security definer
as $$
begin
  if (new.status is distinct from old.status) then
    insert into public.audit_logs(content_id, changed_by, field, old_value, new_value)
    values (old.id, auth.uid(), 'status', old.status, new.status);
  end if;

  if (new.deadline is distinct from old.deadline) then
    insert into public.audit_logs(content_id, changed_by, field, old_value, new_value)
    values (old.id, auth.uid(), 'deadline', old.deadline::text, new.deadline::text);
  end if;

  if (new.pic_email is distinct from old.pic_email) then
    insert into public.audit_logs(content_id, changed_by, field, old_value, new_value)
    values (old.id, auth.uid(), 'pic_email', old.pic_email, new.pic_email);
  end if;

  if (new.final_drive_link is distinct from old.final_drive_link) then
    insert into public.audit_logs(content_id, changed_by, field, old_value, new_value)
    values (old.id, auth.uid(), 'final_drive_link', coalesce(old.final_drive_link,''), coalesce(new.final_drive_link,''));
  end if;

  return new;
end;
$$;

drop trigger if exists contents_audit_changes on public.contents;
create trigger contents_audit_changes
after update on public.contents
for each row execute function public.audit_contents_changes();

-- RLS
alter table public.profiles enable row level security;
alter table public.contents enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles policies
-- User bisa lihat profil sendiri, admin bisa lihat semua
create policy "profiles_select_own_or_admin" on public.profiles
for select using (auth.uid() = id or public.is_admin());

-- Hanya admin boleh ubah role
create policy "profiles_update_admin" on public.profiles
for update using (public.is_admin()) with check (public.is_admin());

-- Contents policies
create policy "contents_select" on public.contents
for select using (
  public.is_admin() or pic_email = (auth.jwt() ->> 'email')
);

create policy "contents_insert" on public.contents
for insert with check (
  public.is_admin() or pic_email = (auth.jwt() ->> 'email')
);

create policy "contents_update" on public.contents
for update using (
  public.is_admin() or pic_email = (auth.jwt() ->> 'email')
)
with check (
  public.is_admin() or pic_email = (auth.jwt() ->> 'email')
);

create policy "contents_delete_admin" on public.contents
for delete using (public.is_admin());

-- Audit logs policies
create policy "audit_select" on public.audit_logs
for select using (
  public.is_admin()
  or exists (
    select 1 from public.contents c
    where c.id = audit_logs.content_id
      and c.pic_email = (auth.jwt() ->> 'email')
  )
);

-- Trigger inserts should still work; allow authenticated insert for safety
create policy "audit_insert" on public.audit_logs
for insert with check (
  public.is_admin()
  or exists (
    select 1 from public.contents c
    where c.id = audit_logs.content_id
      and c.pic_email = (auth.jwt() ->> 'email')
  )
);
