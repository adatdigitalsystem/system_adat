export function getGoogleDriveImageUrl(rawUrl: string | null | undefined): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (['lh3.googleusercontent.com', 'lh4.googleusercontent.com'].includes(url.hostname)) return value;
    if (!['drive.google.com', 'www.drive.google.com'].includes(url.hostname)) return value;

    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
    if (!fileId) return value;
    return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1000`;
  } catch {
    return /^[A-Za-z0-9_-]{20,}$/.test(value)
      ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(value)}=w1000`
      : value;
  }
}
