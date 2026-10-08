alter table public.event_adat
  add column if not exists target_status_keanggotaan text not null default 'SEMUA'
  check (target_status_keanggotaan in ('AKTIF', 'TIDAK_AKTIF', 'SEMUA'));

update public.event_adat
set target_status_keanggotaan = case
  when upper(coalesce(jenis_event, '')) = 'TAHUNAN' then 'TIDAK_AKTIF'
  else 'SEMUA'
end
where target_status_keanggotaan = 'SEMUA';
