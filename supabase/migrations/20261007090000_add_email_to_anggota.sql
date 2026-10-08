alter table public.anggota
  add column if not exists email text;

update public.anggota as anggota
set email = auth_user.email
from auth.users as auth_user
where anggota.user_id = auth_user.id
  and nullif(btrim(anggota.email), '') is null;

update public.anggota
set email = regexp_replace(no_hp, '[^0-9]', '', 'g') || '@banjar.local'
where nullif(btrim(email), '') is null
  and nullif(btrim(no_hp), '') is not null;
