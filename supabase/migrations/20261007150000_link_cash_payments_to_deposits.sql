alter table public.riwayat_pembayaran_cicilan
  add column if not exists setoran_regu_id uuid references public.setoran_regu(id) on delete set null;

create index if not exists riwayat_pembayaran_cicilan_setoran_idx
  on public.riwayat_pembayaran_cicilan (setoran_regu_id);
