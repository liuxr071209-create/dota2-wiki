import { $, initChrome, fetchJSON, escapeHtml, fmtNum, renderError } from './core.js';

initChrome();

const root = $('#patch-content');

function notesList(notes, className = '') {
  if (!notes?.length) return '';
  return `<ul class="patch-notes ${className}">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`;
}

function itemEntry(group) {
  return `
    <div class="patch-entry" data-search="${escapeHtml([group.name, ...(group.notes ?? [])].join(' '))}">
      <div>${group.slug ? `<a href="item.html?id=${encodeURIComponent(group.slug)}"><img class="patch-entry-icon item-icon" src="assets/items/${encodeURIComponent(group.slug)}.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></a>` : ''}</div>
      <div>
        <h3>${group.slug ? `<a href="item.html?id=${encodeURIComponent(group.slug)}">${escapeHtml(group.name)}</a>` : escapeHtml(group.name)}</h3>
        ${notesList(group.notes)}
        ${group.groups?.map((subgroup) => `
          <div class="patch-ability">
            <h4>${subgroup.slug ? `<a href="item.html?id=${encodeURIComponent(subgroup.slug)}">${escapeHtml(subgroup.name)}</a>` : escapeHtml(subgroup.name)}</h4>
            ${notesList(subgroup.notes)}
          </div>`).join('') ?? ''}
      </div>
    </div>`;
}

function heroEntry(group) {
  const search = [group.name, ...(group.notes ?? []), ...(group.groups ?? []).flatMap((subgroup) => [
    subgroup.name,
    ...(subgroup.notes ?? []),
    ...(subgroup.abilities ?? []).flatMap((ability) => [ability.name, ...(ability.notes ?? [])]),
  ])].join(' ');
  return `
    <div class="patch-entry" data-search="${escapeHtml(search)}">
      <div>${group.icon ? `<a href="hero.html?id=${encodeURIComponent(group.slug)}"><img class="patch-entry-icon" src="${escapeHtml(group.icon)}" alt="" loading="lazy"></a>` : ''}</div>
      <div>
        <h3>${group.slug ? `<a href="hero.html?id=${encodeURIComponent(group.slug)}">${escapeHtml(group.name)}</a>` : escapeHtml(group.name)}</h3>
        ${notesList(group.notes)}
        ${group.groups.map((subgroup) => {
          if (subgroup.name === '技能') {
            return `
              <div class="patch-subhead">技能</div>
              ${(subgroup.abilities ?? []).map((ability) => `
                <div class="patch-ability">
                  <h4>${escapeHtml(ability.name)}</h4>
                  ${notesList(ability.notes)}
                </div>`).join('')}`;
          }
          return `
            <div class="patch-subhead">${escapeHtml(subgroup.name)}</div>
            ${notesList(subgroup.notes)}`;
        }).join('')}
      </div>
    </div>`;
}

function render(patch) {
  const sections = patch.sections.map((section, index) => {
    const id = `patch-${section.type}-${index}`;
    const count = section.type === 'heroes'
      ? section.groups.length
      : section.type === 'items'
        ? section.groups.length
        : section.groups.reduce((sum, group) => sum + (group.groups?.length ?? 1), 0);
    let body = '';
    if (section.type === 'items') body = section.groups.map(itemEntry).join('');
    else if (section.type === 'neutral') {
      body = section.groups.map((group) => `
        <div class="patch-entry" data-search="${escapeHtml([group.name, ...(group.notes ?? [])].join(' '))}">
          <div></div>
          <div>
            <h3>${escapeHtml(group.name)}</h3>
            ${notesList(group.notes)}
            ${group.groups.map((subgroup) => `
              <div class="patch-ability">
                <h4>${subgroup.slug ? `<a href="item.html?id=${encodeURIComponent(subgroup.slug)}">${escapeHtml(subgroup.name)}</a>` : escapeHtml(subgroup.name)}</h4>
                ${notesList(subgroup.notes)}
              </div>`).join('')}
          </div>
        </div>`).join('');
    } else body = section.groups.map(heroEntry).join('');
    return `
      <section class="patch-section" id="${id}">
        <div class="patch-section-head"><h2>${escapeHtml(section.title)}</h2><span>${count} 项</span></div>
        ${body}
      </section>`;
  }).join('');

  root.innerHTML = `
    <div class="patch-layout">
      <aside class="patch-nav">
        <div class="patch-nav-head">7.41f 目录</div>
        ${patch.sections.map((section, index) => `<a href="#patch-${section.type}-${index}">${escapeHtml(section.title)}<span>${section.type === 'heroes' ? patch.sections[index].groups.length : ''}</span></a>`).join('')}
        <a href="#patch-fixes">问题修复<span></span></a>
        <a href="https://www.dota2.com/newsentry/677383425371407609" target="_blank" rel="noopener">官方原文 ↗<span></span></a>
      </aside>
      <div>
        <div class="filter-bar" style="margin-bottom:24px">
          <div class="filter-top">
            <label class="filter-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
              <input type="search" id="patch-search" placeholder="筛选改动，例如「赏金」「冷却」「吸血」…" autocomplete="off">
            </label>
            <span class="filter-summary" style="margin:0">共 <strong id="patch-visible">—</strong> 条条目</span>
          </div>
        </div>
        ${sections}
        <section class="patch-section" id="patch-fixes">
          <div class="patch-section-head"><h2>问题修复</h2><span>官方补充</span></div>
          <div class="patch-fixes"><strong>此外，最近还修复了：</strong>${escapeHtml(patch.fixes)}</div>
        </section>
      </div>
    </div>`;

  const search = $('#patch-search');
  const visible = $('#patch-visible');
  const entries = [...document.querySelectorAll('.patch-entry')];
  const update = () => {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    for (const entry of entries) {
      const show = !query || entry.dataset.search.toLowerCase().includes(query);
      entry.style.display = show ? '' : 'none';
      if (show) count++;
    }
    visible.textContent = fmtNum(count);
  };
  search.addEventListener('input', update);
  update();
}

async function init() {
  try {
    const patch = await fetchJSON('data/patch.json');
    render(patch);
  } catch (error) {
    console.error(error);
    renderError(root, '7.41f 补丁数据读取失败。');
  }
}

init();
