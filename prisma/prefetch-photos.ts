import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTS, GUESTS, LISTINGS } from './seed-data.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '../../web/public/photos');
const manifestPath = path.join(here, 'photo-manifest.json');

const toFilename = (seed: string) => `${seed.replace(/[^a-z0-9-]/gi, '_')}.jpg`;

interface Job { seed: string; url: string; file: string }

function buildJobs(): Job[] {
  const jobs: Job[] = [];
  const add = (seed: string, w: number, h: number) =>
    jobs.push({ seed, url: `https://picsum.photos/seed/${seed}/${w}/${h}`, file: toFilename(seed) });

  for (const [, name] of HOSTS) add(`host-${name}`, 200, 200);
  for (const [, name] of GUESTS) add(`guest-${name}`, 200, 200);
  LISTINGS.forEach((l, i) => {
    for (let p = 0; p < 7; p++) add(`${l.city}-${i}-${p}`, 900, 600);
  });
  return jobs;
}

async function main() {
  mkdirSync(publicDir, { recursive: true });
  const jobs = buildJobs();

  const manifest: Record<string, string> = existsSync(manifestPath)
    ? JSON.parse(await readFile(manifestPath, 'utf8'))
    : {};

  console.log(`Fetching ${jobs.length} images from picsum.photos (one-time)\u2026`);
  let fetched = 0, skipped = 0;

  for (const job of jobs) {
    const dest = path.join(publicDir, job.file);
    if (!existsSync(dest)) {
      const res = await fetch(job.url);
      if (!res.ok) throw new Error(`Failed to fetch ${job.url}: ${res.status} ${res.statusText}`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      fetched++;
    } else {
      skipped++;
    }
    manifest[job.seed] = `/photos/${job.file}`;
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Done \u2014 ${fetched} downloaded, ${skipped} already cached locally.`);
  console.log('Now run `npm run db:seed` to reseed with the local photo paths.');
}

main().catch((e) => { console.error(e); process.exit(1); });
