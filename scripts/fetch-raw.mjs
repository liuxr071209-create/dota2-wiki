import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'research', 'raw');
const FORCE = process.argv.includes('--force');

const DATAFEED = 'https://www.dota2.com/datafeed';
const OPENDOTA = 'https://api.opendota.com/api';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function fetchJson(url, tries = 6) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'dota2-wiki-741f/1.0 (static fan wiki; data build)',
          Accept: 'application/json,text/plain,*/*',
        },
        signal: AbortSignal.timeout(45_000),
      });
      if (response.status === 429) {
        const wait = Math.max(3000, attempt * 5000);
        console.log(`  rate limited, waiting ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        throw new Error('HTTP 429');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < tries) await new Promise((r) => setTimeout(r, 700 * attempt));
    }
  }
  throw new Error(`${url} -> ${lastError?.message}`);
}

async function fetchText(url, tries = 4) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 dota2-wiki-741f' },
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < tries) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error(`${url} -> ${lastError?.message}`);
}

async function saveJson(file, data) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data), 'utf8');
}

async function cachedJson(file, loader) {
  if (!FORCE) {
    const cached = await readJson(file);
    if (cached) return cached;
  }
  const data = await loader();
  await saveJson(file, data);
  return data;
}

async function mapLimit(items, limit, worker, label = '') {
  let index = 0;
  let done = 0;
  const results = new Array(items.length);
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      results[current] = await worker(items[current], current);
      done++;
      if (done % 25 === 0 || done === items.length) {
        console.log(`  ${label} ${done}/${items.length}`);
      }
    }
  });
  await Promise.all(runners);
  return results;
}

async function ensureConstants() {
  const buildDir = path.join(ROOT, 'research', 'dotaconstants', 'build');
  await ensureDir(buildDir);
  const files = ['heroes.json', 'items.json', 'abilities.json', 'hero_abilities.json'];
  for (const file of files) {
    const target = path.join(buildDir, file);
    if (FORCE || !(await fs.stat(target).catch(() => null))) {
      const url = `https://raw.githubusercontent.com/odota/dotaconstants/master/build/${file}`;
      const data = await fetchJson(url);
      await saveJson(target, data);
      console.log(`  constants: ${file}`);
    }
  }
  const neutralFile = path.join(ROOT, 'research', 'neutral_items.txt');
  if (FORCE || !(await fs.stat(neutralFile).catch(() => null))) {
    const text = await fetchText(
      'https://raw.githubusercontent.com/SteamDatabase/GameTracking-Dota2/master/game/dota/pak01_dir/scripts/npc/neutral_items.txt',
    );
    await fs.writeFile(neutralFile, text, 'utf8');
    console.log('  constants: neutral_items.txt');
  }
}

async function main() {
  await ensureDir(RAW);
  console.log('== Constants ==');
  await ensureConstants();
  console.log('== Valve datafeed ==');

  const heroList = await cachedJson(
    path.join(RAW, 'hero-list.json'),
    () => fetchJson(`${DATAFEED}/herolist?language=schinese`),
  );
  const heroes = heroList.result.data.heroes;
  console.log(`heroes: ${heroes.length}`);

  const itemList = await cachedJson(
    path.join(RAW, 'item-list.json'),
    () => fetchJson(`${DATAFEED}/itemlist?language=schinese`),
  );
  const items = itemList.result.data.itemabilities;
  console.log(`items: ${items.length}`);

  await cachedJson(
    path.join(RAW, 'patch-zh.json'),
    () => fetchJson(`${DATAFEED}/patchnotes?version=7.41f&language=schinese`),
  );
  await cachedJson(
    path.join(RAW, 'patch-en.json'),
    () => fetchJson(`${DATAFEED}/patchnotes?version=7.41f&language=english`),
  );

  const articlePath = path.join(RAW, 'patch-article.md');
  if (FORCE || !(await fs.stat(articlePath).catch(() => null))) {
    const article = await fetchText(
      'https://r.jina.ai/https://news.17173.com/content/09162026/160958832.shtml',
    );
    await fs.writeFile(articlePath, article, 'utf8');
  }

  await mapLimit(
    heroes,
    6,
    async (hero) => {
      const file = path.join(RAW, 'heroes', `${hero.id}.json`);
      await cachedJson(file, () =>
        fetchJson(`${DATAFEED}/herodata?language=schinese&hero_id=${hero.id}`),
      );
    },
    'hero data',
  );

  const itemIds = [...new Set(items.map((item) => item.id))];
  await mapLimit(
    itemIds,
    8,
    async (id) => {
      const file = path.join(RAW, 'items', `${id}.json`);
      await cachedJson(file, () =>
        fetchJson(`${DATAFEED}/itemdata?language=schinese&item_id=${id}`),
      );
    },
    'item data',
  );

  console.log('== OpenDota ==');
  const heroStats = await cachedJson(
    path.join(RAW, 'opendota', 'hero-stats.json'),
    () => fetchJson(`${OPENDOTA}/heroStats`),
  );
  console.log(`hero stats: ${heroStats.length}`);

  // OpenDota rate-limits aggressively (429). Keep this sequential and paced.
  await mapLimit(
    heroes,
    1,
    async (hero) => {
      const popFile = path.join(RAW, 'opendota', 'item-popularity', `${hero.id}.json`);
      await cachedJson(popFile, () =>
        fetchJson(`${OPENDOTA}/heroes/${hero.id}/itemPopularity`),
      );
      const matchFile = path.join(RAW, 'opendota', 'matchups', `${hero.id}.json`);
      await cachedJson(matchFile, () =>
        fetchJson(`${OPENDOTA}/heroes/${hero.id}/matchups`),
      );
      await new Promise((r) => setTimeout(r, 900));
    },
    'hero trends',
  );

  console.log('Raw data ready in research/raw');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
