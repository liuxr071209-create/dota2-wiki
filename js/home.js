import {
  $,
  $$,
  initChrome,
  fetchJSON,
  heroCard,
  itemCard,
  sparkline,
  fmtPct,
  fmtNum,
  fmtSigned,
  winClass,
  escapeHtml,
} from './core.js';

initChrome();

const featuredGrid = $('#featured-grid');
const sideRank = $('#home-side-rank');
const leaderboard = $('#home-leaderboard');
const pickTable = $('#home-pick');
const homeHeroes = $('#home-heroes');
const homeItems = $('#home-items');
const patchHighlights = $('#home-patch-highlights');

function featureCard(hero, index) {
  return `
    <a class="feature-card" href="hero.html?id=${encodeURIComponent(hero.slug)}">
      <img class="feature-art" src="${escapeHtml(hero.art)}" alt="${escapeHtml(hero.name)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(hero.card)}'">
      <span class="feature-rank">0${index + 1}</span>
      <div class="feature-content">
        <div class="attr-line">${escapeHtml(hero.attrLabel)} · ${escapeHtml(hero.attack)} · ${hero.positions.map((p) => `POS ${p}`).join(' / ')}</div>
        <h3>${escapeHtml(hero.name)}</h3>
        <p>${hero.roles.slice(0, 3).map(escapeHtml).join(' · ')}。近期公开对局胜率 ${fmtPct(hero.winrate)}，登场率 ${fmtPct(hero.pickrate)}。</p>
        <div class="feature-stats">
          <div><strong class="${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</strong><span>胜率</span></div>
          <div><strong>${fmtPct(hero.pickrate)}</strong><span>登场率</span></div>
          <div><strong class="${hero.delta >= 0 ? 'is-good' : 'is-weak'}">${fmtSigned(hero.delta)}%</strong><span>走势</span></div>
        </div>
      </div>
      <span class="feature-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </a>`;
}

function tableHeader(columns) {
  return `<thead><tr>${columns.map((column) => `<th>${column}</th>`).join('')}</tr></thead>`;
}

function heroRow(hero, index) {
  return `
    <tr>
      <td class="rank">${String(index + 1).padStart(2, '0')}</td>
      <td>
        <a class="hero-cell" href="hero.html?id=${encodeURIComponent(hero.slug)}">
          <img src="${escapeHtml(hero.icon)}" alt="" loading="lazy">
          <span><strong>${escapeHtml(hero.name)}</strong><em>${escapeHtml(hero.en)}</em></span>
        </a>
      </td>
      <td class="mono ${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</td>
      <td class="mono">${fmtPct(hero.pickrate)}</td>
      <td><div class="mini-spark">${sparkline(hero.trend, { width: 82, height: 24 })}</div></td>
    </tr>`;
}

async function init() {
  try {
    const [heroData, itemData, meta] = await Promise.all([
      fetchJSON('data/heroes-index.json'),
      fetchJSON('data/items-index.json'),
      fetchJSON('data/meta.json'),
    ]);
    const heroes = heroData.heroes;
    const items = itemData.items;

    $('#home-item-count').textContent = fmtNum(items.length);

    // Side win-rate ranking.
    sideRank.innerHTML = meta.topWin.slice(0, 5).map((hero, index) => `
      <a class="side-rank" href="hero.html?id=${encodeURIComponent(hero.slug)}">
        <span class="side-rank-index">${String(index + 1).padStart(2, '0')}</span>
        <img src="${escapeHtml(hero.icon)}" alt="" loading="lazy">
        <span class="side-rank-main"><strong>${escapeHtml(hero.name)}</strong><em>${escapeHtml(hero.en)}</em></span>
        <b class="${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</b>
      </a>`).join('');

    // Feature cards: strongest win rates with a reasonable sample.
    featuredGrid.innerHTML = meta.topWin.slice(0, 3).map(featureCard).join('');

    leaderboard.innerHTML = `${tableHeader(['#', '英雄', '胜率', '登场', '走势'])}
      <tbody>${meta.topWin.slice(0, 8).map(heroRow).join('')}</tbody>`;
    pickTable.innerHTML = `${tableHeader(['#', '英雄', '登场', '胜率', '位置'])}
      <tbody>${meta.topPick.slice(0, 8).map((hero, index) => `
        <tr>
          <td class="rank">${String(index + 1).padStart(2, '0')}</td>
          <td>
            <a class="hero-cell" href="hero.html?id=${encodeURIComponent(hero.slug)}">
              <img src="${escapeHtml(hero.icon)}" alt="" loading="lazy">
              <span><strong>${escapeHtml(hero.name)}</strong><em>${escapeHtml(hero.en)}</em></span>
            </a>
          </td>
          <td class="mono">${fmtPct(hero.pickrate)}</td>
          <td class="mono ${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</td>
          <td><span class="pos-list">${hero.positions.map((p) => `<span class="pos-badge">${p}</span>`).join('')}</span></td>
        </tr>`).join('')}</tbody>`;

    const heroPreview = [...heroes]
      .sort((a, b) => (b.pickrate ?? 0) - (a.pickrate ?? 0))
      .slice(0, 12);
    homeHeroes.innerHTML = heroPreview.map((hero) => heroCard(hero)).join('');

    const iconic = [
      'blink',
      'black_king_bar',
      'ultimate_scepter',
      'aghanims_shard',
      'travel_boots',
      'butterfly',
      'satanic',
      'sheepstick',
    ];
    const featuredItems = iconic
      .map((slug) => items.find((item) => item.slug === slug))
      .filter(Boolean);
    homeItems.innerHTML = (featuredItems.length ? featuredItems : items.slice(0, 8))
      .slice(0, 8)
      .map((item) => itemCard(item, { showCategory: false }))
      .join('');

    patchHighlights.innerHTML = meta.highlights.map((highlight) => `
      <a class="patch-highlight" href="${highlight.type === 'hero' ? 'hero.html?id=' : 'item.html?id='}${encodeURIComponent(highlight.slug)}">
        <span class="dot"></span>
        <div><h4>${escapeHtml(highlight.title)}</h4><p>${escapeHtml(highlight.text)}</p></div>
      </a>`).join('');

    initHomeSearch(heroes, items);
  } catch (error) {
    console.error(error);
    featuredGrid.innerHTML = '<div class="empty-state"><h2>数据加载失败</h2><p>请通过本地静态服务器或 GitHub Pages 打开本站。</p></div>';
  }
}

function initHomeSearch(heroes, items) {
  const input = $('#home-search');
  const results = $('#home-search-results');
  if (!input || !results) return;

  const close = () => {
    results.classList.remove('is-open');
    results.innerHTML = '';
  };

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      close();
      return;
    }
    const heroMatches = heroes
      .filter((hero) => [hero.name, hero.en, hero.slug, ...(hero.roles ?? []), ...(hero.aliases ?? [])].join(' ').toLowerCase().includes(query))
      .slice(0, 4);
    const itemMatches = items
      .filter((item) => [item.name, item.en, item.slug, item.categoryLabel, ...(item.aliases ?? [])].join(' ').toLowerCase().includes(query))
      .slice(0, 4);
    if (!heroMatches.length && !itemMatches.length) {
      results.innerHTML = '<p class="search-hint" style="padding:14px 16px">没有匹配结果，试试英文名或更短的关键词。</p>';
    } else {
      results.innerHTML = [...heroMatches.map((hero) => `
        <a href="hero.html?id=${encodeURIComponent(hero.slug)}">
          <img src="${escapeHtml(hero.icon)}" alt="">
          <span><strong>${escapeHtml(hero.name)}</strong><em>英雄 · ${escapeHtml(hero.en)}</em></span>
        </a>`), ...itemMatches.map((item) => `
        <a href="item.html?id=${encodeURIComponent(item.slug)}">
          <img src="${escapeHtml(item.img)}" alt="">
          <span><strong>${escapeHtml(item.name)}</strong><em>物品 · ${escapeHtml(item.categoryLabel)}</em></span>
        </a>`)].join('');
    }
    results.classList.add('is-open');
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const first = results.querySelector('a');
      if (first) window.location.href = first.href;
      else window.location.href = `heroes.html?q=${encodeURIComponent(input.value.trim())}`;
    }
    if (event.key === 'Escape') close();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.home-search') && !event.target.closest('#home-search-results')) close();
  });
}

init();
