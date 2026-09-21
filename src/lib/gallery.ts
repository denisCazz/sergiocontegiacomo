export function altFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Immagine gallery';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function isGalleryImageFile(name: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(name);
}
