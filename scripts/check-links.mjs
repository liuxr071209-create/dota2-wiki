import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const files = fs.readdirSync(ROOT).filter((file) => file.endsWith('.html'));
const problems = [];
for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(https?:|#|data:|mailto:)/.test(url)) continue;
    const clean = url.split('?')[0].split('#')[0];
    if (!clean) continue;
    if (!fs.existsSync(path.join(ROOT, clean))) problems.push(`${file}: ${url}`);
  }
}
console.log({ files: files.length, problems: problems.length });
if (problems.length) console.log(problems.join('\n'));
