import { ApiImage } from '../models/business.model';

const PLACEHOLDER_HERO    = 'https://placehold.co/800x450?text=Sin+imagen';
const PLACEHOLDER_GALLERY = 'https://placehold.co/400x300?text=Sin+imagen';
const PLACEHOLDER_PRODUCT = 'https://placehold.co/80x80?text=Sin+imagen';

/**
 * Devuelve la URL de una imagen a partir del campo `url` (absoluto) o `path` (relativo).
 * Si ninguno existe, devuelve cadena vacía.
 */
function resolveImageUrl(img: ApiImage | null | undefined): string {
  return img?.url || img?.path || '';
}

/**
 * Ordena las imágenes de un negocio con la misma prioridad que el backend:
 *  1. Imagen de tipo 'main' primero.
 *  2. Imágenes de galería ordenadas por `position` ascendente.
 *
 * Útil como defensa en profundidad cuando el endpoint no garantiza orden.
 */
export function sortedBusinessImages(images: ApiImage[]): ApiImage[] {
  return [...(images ?? [])].sort((a, b) => {
    if (a.type === 'main' && b.type !== 'main') return -1;
    if (a.type !== 'main' && b.type === 'main') return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });
}

/**
 * Selecciona la imagen principal (type === 'main') del array de imágenes.
 * Si no existe, usa la primera imagen disponible.
 * Retorna la URL lista para usar como fondo hero.
 */
export function getMainImageUrl(images: ApiImage[]): string {
  const sorted = sortedBusinessImages(images);
  const img = sorted[0] ?? null;
  return resolveImageUrl(img) || PLACEHOLDER_HERO;
}

/**
 * Devuelve la URL de una imagen de galería con fallback de placeholder.
 */
export function getGalleryImageUrl(img: ApiImage): string {
  return resolveImageUrl(img) || PLACEHOLDER_GALLERY;
}

/**
 * Devuelve la URL de la primera imagen de un producto con fallback de placeholder.
 */
export function getProductImageUrl(images: ApiImage[]): string {
  const img = images?.[0] ?? null;
  return resolveImageUrl(img) || PLACEHOLDER_PRODUCT;
}
