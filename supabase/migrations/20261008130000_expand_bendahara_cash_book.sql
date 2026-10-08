alter table public.pengeluaran_kas rename to transaksi_kas;

alter index if exists public.pengeluaran_kas_tanggal_idx
  rename to transaksi_kas_tanggal_idx;

alter table public.transaksi_kas
  add column arah text not null default 'KELUAR';

alter table public.transaksi_kas
  drop constraint if exists pengeluaran_kas_kategori_check;

alter table public.transaksi_kas
  add constraint transaksi_kas_kategori_check
  check (kategori in (
    'BANTUAN_DUKA',
    'BANTUAN_PERNIKAHAN',
    'OPERASIONAL',
    'LAINNYA',
    'PEMASUKAN_LAIN',
    'SUMBANGAN',
    'PENGEMBALIAN_DANA',
    'SALDO_AWAL_KAS'
  ));

alter table public.transaksi_kas
  add constraint transaksi_kas_arah_check
  check (arah in ('MASUK', 'KELUAR', 'SALDO_AWAL'));

create unique index transaksi_kas_single_opening_balance_idx
  on public.transaksi_kas (kategori)
  where arah = 'SALDO_AWAL' and kategori = 'SALDO_AWAL_KAS';