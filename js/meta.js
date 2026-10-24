import {
  $,
  initChrome,
  fetchJSON,
  heroCard,
  sparkline,
  escapeHtml,
  fmtPct,
  fmtNum,
  fmtSigned,
  winClass,
} from './core.js';

initChrome();

const content = $('#meta-content');

function heroTable(heroes, { showRank = true, showPick = true } = {}) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${showRank ? '<th>#</th>' : ''}<th>英雄</th><th>胜率</th>${showPick ? '<th>登场</th>' : ''}<th>走势</th><th>位置</th></tr></thead>
        <tbody>
          ${heroes.map((hero, index) => `
            <tr>
              ${showRank ? `<td class="rank">${String(index + 1).padStart(2, '0')}</td>` : ''}
              <td>
                <a class="hero-cell" href="hero.html?id=${encodeURIComponent(hero.slug)}">
                  <img src="${escapeHtml(hero.icon)}" alt="" loading="lazy">
                  <span><strong>${escapeHtml(hero.name)}</strong><em>${escapeHtml(hero.en)}</em></span>
                </a>
              </td>
              <td class="mono ${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</td>
              ${showPick ? `<td class="mono">${fmtPct(hero.pickrate)}</td>` : ''}
              <td><div class="mini-spark">${sparkline(hero.trend, { width: 84, height: 24 })}</div></td>
              <td><span class="pos-list">${hero.positions.map((position) => `<span class="pos-badge">${position}</span>`).join('')}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderPosition(position, data) {
  const entry = data.positionMeta[position];
  $('#position-title').textContent = `${entry.label} · ${entry.name}`;
  $('#position-count').textContent = `${entry.heroes.length} 位英雄`;
  $('#position-hero-grid').innerHTML = entry.heroes.length
    ? entry.heroes.map((hero) => heroCard(hero, { compact: true })).join('')
    : '<div class="empty-state"><h2>暂无数据</h2></div>';
  document.querySelectorAll('[data-position]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.position === String(position));
  });
}

function render(meta) {
  $('#meta-matches').textContent = fmtNum(meta.totals.matches);
  content.innerHTML = `
    <div class="meta-grid">
      <section class="meta-panel">
        <div class="meta-panel-head"><h2>胜率榜</h2><span>最低样本 20,000 场</span></div>
        ${heroTable(meta.topWin)}
      </section>
      <section class="meta-panel">
        <div class="meta-panel-head"><h2>登场率榜</h2><span>按每场出现率</span></div>
        ${heroTable(meta.topPick)}
      </section>
    </div>

    <section class="section">
      <div class="section-head">
        <div><span class="eyebrow">Position Meta</span><h2>各位置热门英雄</h2><p>按主位置与副位置筛选，再以近期胜率排序。位置为编辑整理，胜率来自公开对局。</p></div>
      </div>
      <div class="position-tabs" id="position-tabs">
        ${[1, 2, 3, 4, 5].map((position) => {
          const entry = meta.positionMeta[position];
          return `<button class="position-tab ${position === 1 ? 'is-active' : ''}" type="button" data-position="${position}"><strong>${position}</strong><span>${entry.name}</span></button>`;
        }).join('')}
      </div>
      <div class="meta-panel">
        <div class="meta-panel-head"><h2 id="position-title"></h2><span id="position-count"></span></div>
        <div class="panel-inner"><div class="position-hero-grid" id="position-hero-grid"></div></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><div><span class="eyebrow">Patch Impact</span><h2>7.41f 改动焦点</h2><p>这些改动最可能影响接下来几周的英雄优先级。</p></div><a class="section-link" href="patch.html">完整改动 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>
      <div class="meta-panel">
        <div class="patch-highlight-list">
          ${meta.highlights.map((highlight) => `
            <a class="patch-highlight" href="${highlight.type === 'hero' ? 'hero.html?id=' : 'item.html?id='}${encodeURIComponent(highlight.slug)}">
              <span class="dot"></span><div><h4>${escapeHtml(highlight.title)}</h4><p>${escapeHtml(highlight.text)}</p></div>
            </a>`).join('')}
        </div>
      </div>
    </section>

    <div class="data-note" style="margin-top:24px">
      <strong>数据口径：</strong>英雄与物品数值来自 Valve 官方 7.41f 数据接口；胜率、登场率、出装与克制来自 OpenDota 公开对局（约 ${fmtNum(meta.totals.matches)} 场样本）。胜率走势为最近七个统计窗口，末位窗口可能尚未完整。位置标签为编辑整理，用于图鉴导航。数据更新于 ${meta.updated}。
    </div>`;

  document.getElementById('position-tabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-position]');
    if (button) renderPosition(Number(button.dataset.position), meta);
  });
  renderPosition(1, meta);
}

async function init() {
  try {
    const meta = await fetchJSON('data/meta.json');
    render(meta);
  } catch (error) {
    console.error(error);
    content.innerHTML = '<div class="empty-state"><span class="empty-rune">✦</span><h2>环境数据加载失败</h2><p>请通过静态服务器或 GitHub Pages 打开本站。</p></div>';
  }
}

init();
