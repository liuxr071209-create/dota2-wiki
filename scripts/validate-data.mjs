import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const exists = (file) => fs.existsSync(path.join(ROOT, file));
const heroIndex = read('data/heroes-index.json').heroes;
const itemIndex = read('data/items-index.json').items;
const heroSlugs = new Set(heroIndex.map((hero) => hero.slug));
const itemSlugs = new Set(itemIndex.map((item) => item.slug));
const problems = [];

for (const hero of heroIndex) {
  for (const key of ['icon', 'art', 'card']) {
    if (!exists(hero[key])) problems.push(`missing hero asset ${hero.slug} ${key}`);
  }
  const detail = read(`data/heroes/${hero.slug}.json`);
  if (!detail.abilities?.length) problems.push(`no abilities ${hero.slug}`);
  for (const ability of detail.abilities ?? []) {
    if (!exists(ability.icon)) problems.push(`missing ability icon ${hero.slug} ${ability.key}`);
  }
  for (const [stage, rows] of Object.entries(detail.build ?? {})) {
    if (!Array.isArray(rows)) continue;
    for (const item of rows) if (!itemSlugs.has(item.slug)) problems.push(`bad build item ${hero.slug} ${stage} ${item.slug}`);
  }
  for (const row of [...(detail.counters?.weak ?? []), ...(detail.counters?.strong ?? [])]) {
    if (!heroSlugs.has(row.slug)) problems.push(`bad counter ${hero.slug} ${row.slug}`);
  }
}

for (const item of itemIndex) {
  if (!exists(item.img)) problems.push(`missing item image ${item.slug}`);
  const detail = read(`data/items/${item.slug}.json`);
  for (const entry of [...(detail.components ?? []), ...(detail.buildsInto ?? [])]) {
    if (!itemSlugs.has(entry.slug)) problems.push(`bad item relation ${item.slug} ${entry.slug}`);
  }
  for (const hero of detail.heroes ?? []) {
    if (!heroSlugs.has(hero.slug)) problems.push(`bad item hero ${item.slug} ${hero.slug}`);
  }
}

console.log({
  heroes: heroIndex.length,
  items: itemIndex.length,
  problems: problems.length,
});
if (problems.length) {
  console.log(problems.slice(0, 40).join('\n'));
  process.exitCode = 1;
}
