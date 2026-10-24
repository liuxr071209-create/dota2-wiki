import {
  $,
  initChrome,
  fetchJSON,
  getParam,
  setPageMeta,
  escapeHtml,
  fmtNum,
  fmtPct,
  winClass,
  renderError,
} from './core.js';

initChrome();

const root = $('#item-detail');
const slugParam = getParam('id');

function masthead(item) {
  return `
    <section class="item-masthead">
      <div class="item-art-frame">
        <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='assets/fallback-item.svg'">
      </div>
      <div class="item-masthead-copy">
        <span class="eyebrow">${escapeHtml(item.categoryLabel)} · ${item.neutralTier ? `TIER ${item.neutralTier}` : 'PATCH 7.41f'}</span>
        <h1>${escapeHtml(item.name)}</h1>
        <div class="en-name">${escapeHtml(item.en)}</div>
        <div class="item-meta-row">
          <div class="price"><span>价格</span><strong>${item.cost ? `${fmtNum(item.cost)} 金` : '非售卖'}</strong></div>
          <div><span>分类</span><strong>${escapeHtml(item.categoryLabel)}</strong></div>
          <div><span>版本</span><strong>7.41f</strong></div>
        </div>
        ${item.chips.length ? `<div class="item-chips">${item.chips.map((chip) => `<span class="ability-chip">${escapeHtml(chip.label)} <b>${escapeHtml(chip.value)}</b></span>`).join('')}</div>` : ''}
      </div>
    </section>`;
}

function descriptionBlock(item) {
  return `
    <section class="content-block">
      <div class="block-head"><h2>物品效果</h2><span class="head-note">${escapeHtml(item.categoryLabel)}</span></div>
      <div class="item-desc">${item.desc || '<p style="color:var(--muted)">该物品没有主动效果；属性与被动数值见下方。</p>'}</div>
      ${item.notes.length ? `<div class="item-notes">${item.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join('')}</div>` : ''}
      ${item.lore ? `<div class="lore-block" style="margin-top:16px"><p>${escapeHtml(item.lore)}</p></div>` : ''}
    </section>`;
}

function valuesBlock(item) {
  if (!item.values.length) return '';
  return `
    <section class="content-block">
      <div class="block-head"><h2>具体数值</h2><span class="head-note">7.41f</span></div>
      <div class="value-list">
        ${item.values.map((value) => `<div class="value-row"><span>${escapeHtml(value.label)}</span><b>${escapeHtml(value.value)}</b></div>`).join('')}
      </div>
    </section>`;
}

function componentBlock(item) {
  const components = item.components ?? [];
  const buildsInto = item.buildsInto ?? [];
  if (!components.length && !buildsInto.length) {
    return `
      <section class="content-block">
        <div class="block-head"><h2>合成路径</h2></div>
        <p class="data-note">该物品没有合成组件，也不会作为其他物品的组件。</p>
      </section>`;
  }
  const row = (entry) => `
    <a class="component-card" href="item.html?id=${encodeURIComponent(entry.slug)}">
      <img src="${escapeHtml(entry.img)}" alt="" loading="lazy" onerror="this.style.opacity=.15">
      <span><strong>${escapeHtml(entry.name)}</strong><span>${entry.cost ? `${fmtNum(entry.cost)} 金` : '—'}</span></span>
    </a>`;
  return `
    <section class="content-block">
      <div class="block-head"><h2>合成路径</h2><span class="head-note">组件 / 后续升级</span></div>
      ${components.length ? `<h3 class="patch-subhead">合成需要</h3><div class="component-grid">${components.map(row).join('')}</div>` : ''}
      ${buildsInto.length ? `<h3 class="patch-subhead" style="margin-top:16px">可升级为</h3><div class="component-grid">${buildsInto.map(row).join('')}</div>` : ''}
    </section>`;
}

function heroesBlock(item) {
  if (!item.heroes?.length) return '';
  return `
    <section class="content-block">
      <div class="block-head"><h2>适合英雄</h2><span class="head-note">按近期出装热度</span></div>
      <div class="synergy-list">
        ${item.heroes.map((hero) => `
          <a class="synergy-row" href="hero.html?id=${encodeURIComponent(hero.slug)}">
            <img src="${escapeHtml(hero.icon)}" alt="" loading="lazy">
            <span>${escapeHtml(hero.name)}</span>
            <b>${hero.count}</b>
          </a>`).join('')}
      </div>
      <p class="data-note" style="margin-top:8px">热度来自 OpenDota 公开对局中各英雄的装备选取次数，不代表胜负因果。</p>
    </section>`;
}

function aside(item) {
  return `
    <aside class="side-column">
      <div class="aside-card">
        <div class="aside-card-head">物品档案</div>
        <div class="aside-body">
          <div class="aside-stat"><span>价格</span><b class="is-good">${item.cost ? `${fmtNum(item.cost)} 金` : '非售卖'}</b></div>
          <div class="aside-stat"><span>分类</span><b>${escapeHtml(item.categoryLabel)}</b></div>
          <div class="aside-stat"><span>版本</span><b>7.41f</b></div>
        </div>
      </div>
      <div class="aside-card">
        <div class="aside-card-head">快速跳转</div>
        <nav class="aside-nav">
          <a href="items.html?category=${encodeURIComponent(item.category)}">同类物品 →</a>
          <a href="items.html">全部物品 →</a>
          <a href="patch.html">7.41f 改动 →</a>
        </nav>
      </div>
    </aside>`;
}

function render(item) {
  setPageMeta(`${item.name} ${item.en} · DOTA 2 WIKI 7.41f`, `${item.name}（${item.en}）7.41f 价格、属性、效果与合成路径。`);
  $('#breadcrumb-name').textContent = item.name;
  root.innerHTML = `
    ${masthead(item)}
    <div class="item-layout">
      <div class="content-column">
        ${descriptionBlock(item)}
        ${valuesBlock(item)}
        ${componentBlock(item)}
        ${heroesBlock(item)}
      </div>
      ${aside(item)}
    </div>`;
}

async function init() {
  if (!slugParam) {
    renderError(root, '缺少物品 ID。请从物品图鉴进入。');
    return;
  }
  try {
    const index = await fetchJSON('data/items-index.json');
    const match = index.items.find((item) => item.slug === slugParam || String(item.id) === slugParam);
    if (!match) {
      renderError(root, `没有找到「${slugParam}」对应的物品。`);
      return;
    }
    const item = await fetchJSON(`data/items/${match.slug}.json`);
    render(item);
  } catch (error) {
    console.error(error);
    renderError(root, '物品数据读取失败。请确认是通过静态服务器或 GitHub Pages 访问。');
  }
}

init();
