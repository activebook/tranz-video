/**
 * tranz-video - Color Conversion Utilities
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Converts a 3-hex or 6-hex color code to RGB components.
 * Fallback to RGB(10, 14, 22) obsidian dark on invalid input.
 */
export function hexToRgb(hex?: string): RgbColor {
  if (!hex) return { r: 10, g: 14, b: 22 };
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 10, g: 14, b: 22 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}
