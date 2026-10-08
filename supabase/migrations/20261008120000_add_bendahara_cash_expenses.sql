create table if not exists public.pengeluaran_kas (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  kategori text not null check (kategori in ('BANTUAN_DUKA', 'BANTUAN_PERNIKAHAN', 'OPERASIONAL', 'LAINNYA')),
  penerima text not null,
  keterangan text not null,
  nominal numeric(14, 2) not null check (nominal > 0),
  metode_pembayaran text not null default 'TUNAI',
  bukti_url text,
  created_by uuid references public.anggota(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists pengeluaran_kas_tanggal_idx
  on public.pengeluaran_kas (tanggal desc, created_at desc);

alter table public.pengeluaran_kas enable row level security;
revoke all on public.pengeluaran_kas from anon, authenticated;
grant all on public.pengeluaran_kas to service_role;