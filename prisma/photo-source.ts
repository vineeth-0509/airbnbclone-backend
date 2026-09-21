import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(here, 'photo-manifest.json');

// Populated by `npm run prefetch:photos` (see prefetch-photos.ts). Maps a
// seed string to a local path under web/public/photos. Until that script has
// been run, this stays empty and every photo falls back to picsum.photos.
const manifest: Record<string, string> = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {};

/**
 * Photo URL for a given seed.
 *
 * - If `npm run prefetch:photos` has been run, this returns a local path
 *   (`/photos/<file>.jpg`) served straight out of the Next.js app's own
 *   public folder — no external request, no on-demand generation, loads
 *   instantly regardless of picsum's mood that day.
 * - Otherwise it falls back to picsum.photos, which generates the image on
 *   demand. That's fine for local dev, but picsum can take several seconds
 *   per unique image on a cold request — noticeably slow the first time
 *   someone (or an evaluator) loads a page full of new listings.
 */
export function photo(seed: string, w = 900, h = 600): string {
  return manifest[seed] ?? `https://picsum.photos/seed/${seed}/${w}/${h}`;
}
