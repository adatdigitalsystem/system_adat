alter table public.transaksi_kas
  drop constraint if exists pengeluaran_kas_nominal_check;

alter table public.transaksi_kas
  drop constraint if exists transaksi_kas_nominal_check;

alter table public.transaksi_kas
  add constraint transaksi_kas_nominal_check
  check (nominal > 0 or (arah = 'SALDO_AWAL' and kategori = 'SALDO_AWAL_KAS' and nominal = 0));