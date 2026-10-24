import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const FORCE = process.argv.includes('--force');
const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function exists(file) {
  try {
    const stat = await fs.stat(file);
    return stat.size > 0;
  } catch {
    return false;
  }
}

async function download(url, file, fallbackUrl = null) {
  if (!FORCE && (await exists(file))) return true;
  await ensureDir(path.dirname(file));
  for (const candidate of [url, fallbackUrl].filter(Boolean)) {
    try {
      const response = await fetch(candidate, {
        headers: { 'User-Agent': 'dota2-wiki-741f/1.0' },
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 100) continue;
      await fs.writeFile(file, buffer);
      return true;
    } catch {
      // Try the fallback.
    }
  }
  return false;
}

async function mapLimit(items, limit, worker, label) {
  let index = 0;
  let done = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      await worker(items[current]);
      done++;
      if (done % 100 === 0 || done === items.length) console.log(`  ${label} ${done}/${items.length}`);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const heroes = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'heroes-index.json'), 'utf8')).heroes;
  const items = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'items-index.json'), 'utf8')).items;

  console.log(`Downloading ${heroes.length} hero sets…`);
  await mapLimit(
    heroes,
    6,
    async (hero) => {
      const icon = path.join(ROOT, hero.icon);
      const card = path.join(ROOT, hero.card);
      const art = path.join(ROOT, hero.art);
      const iconUrl = `${CDN}/dota_react/heroes/icons/${hero.slug}.png`;
      const cardUrl = `${CDN}/dota_react/heroes/${hero.slug}.png`;
      const artUrl = `${CDN}/heroes/${hero.slug}_vert.jpg`;
      await Promise.all([
        download(iconUrl, icon),
        download(cardUrl, card),
        download(artUrl, art, cardUrl),
      ]);
    },
    'hero images',
  );

  console.log('Downloading ability icons…');
  const abilityFiles = [];
  for (const hero of heroes) {
    const detail = JSON.parse(
      await fs.readFile(path.join(ROOT, 'data', 'heroes', `${hero.slug}.json`), 'utf8'),
    );
    for (const ability of detail.abilities) {
      const name = path.basename(ability.icon, '.png');
      abilityFiles.push({ name, icon: ability.icon, heroIcon: hero.icon });
    }
  }
  const uniqueAbilities = [...new Map(abilityFiles.map((ability) => [ability.name, ability])).values()];
  await mapLimit(
    uniqueAbilities,
    8,
    async (ability) => {
      const file = path.join(ROOT, ability.icon);
      const url = `${CDN}/dota_react/abilities/${ability.name}.png`;
      const ok = await download(url, file, `${CDN}/dota_react/heroes/icons/${path.basename(ability.heroIcon, '.png')}.png`);
      if (!ok) {
        // Last resort: copy the hero icon so the slot is never empty.
        await ensureDir(path.dirname(file));
        await fs.copyFile(path.join(ROOT, ability.heroIcon), file).catch(() => {});
      }
    },
    'ability icons',
  );

  console.log(`Downloading ${items.length} item icons…`);
  await mapLimit(
    items,
    8,
    async (item) => {
      const file = path.join(ROOT, item.img);
      const url = `${CDN}/dota_react/items/${item.slug}.png`;
      const ok = await download(url, file, `${CDN}/dota_react/items/recipe.png`);
      if (!ok) {
        await ensureDir(path.dirname(file));
      }
    },
    'item icons',
  );

  const missing = [];
  for (const hero of heroes) {
    for (const file of [hero.icon, hero.card, hero.art]) {
      if (!(await exists(path.join(ROOT, file)))) missing.push(file);
    }
  }
  for (const item of items) {
    if (!(await exists(path.join(ROOT, item.img)))) missing.push(item.img);
  }
  console.log(`Asset download complete. Missing files: ${missing.length}`);
  if (missing.length) console.log(missing.slice(0, 30).join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
