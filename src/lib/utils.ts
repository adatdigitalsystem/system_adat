// Format Mata Uang Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format Tanggal Indonesia / Bali
export function formatTanggal(dateString: string): string {
  if (!dateString || dateString === '-') return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function labelStatusKeanggotaan(status: string | null | undefined): string {
  const normalizedStatus = status?.toUpperCase().replace(/[\s_-]/g, '');
  if (normalizedStatus === 'BELUMLENGKAPI') return 'Belum dilengkapi';
  if (!normalizedStatus || normalizedStatus === 'AKTIF') return 'Ngayah';
  if (normalizedStatus === 'TIDAKAKTIF' || normalizedStatus === 'PASIF') return 'Numbas Ayahan';
  return status || '-';
}