const jsonCache = new Map();

export const PATCH = '7.41f';
export const UPDATED = '2026-10-24';

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export async function fetchJSON(path) {
  if (!jsonCache.has(path)) {
    jsonCache.set(
      path,
      fetch(path, { credentials: 'same-origin' }).then((response) => {
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
        return response.json();
      }),
    );
  }
  return jsonCache.get(path);
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const fmtPct = (value, digits = 1) =>
  Number.isFinite(value) ? `${value.toFixed(digits)}%` : '—';

export const fmtNum = (value, digits = 0) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)).toLocaleString('zh-CN') : '—';

export const fmtSigned = (value, digits = 1) => {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
};

export const attrs = {
  str: { label: '力量', className: 'attr-str' },
  agi: { label: '敏捷', className: 'attr-agi' },
  int: { label: '智力', className: 'attr-int' },
  all: { label: '全能', className: 'attr-all' },
};

export const getParam = (name, fallback = '') =>
  new URLSearchParams(window.location.search).get(name) ?? fallback;

export function setPageMeta(title, description) {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', description);
}

export function winClass(winrate) {
  if (!Number.isFinite(winrate)) return '';
  if (winrate >= 52.5) return 'is-strong';
  if (winrate >= 50.5) return 'is-good';
  if (winrate < 48) return 'is-weak';
  return '';
}

export function sparkline(values, { width = 186, height = 48, className = '' } = {}) {
  const points = (values ?? []).filter((value) => Number.isFinite(value));
  if (points.length < 2) return '<span class="spark-empty">暂无走势</span>';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = Math.max(0.7, max - min);
  const step = width / (points.length - 1);
  const coords = points.map((value, index) => {
    const x = index * step;
    const y = height - 5 - ((value - min) / spread) * (height - 10);
    return [x, y];
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;
  const last = coords[coords.length - 1];
  const first = points[0];
  const lastValue = points[points.length - 1];
  const rising = lastValue >= first;
  return `
    <svg class="sparkline ${rising ? 'is-up' : 'is-down'} ${className}" viewBox="0 0 ${width} ${height}" role="img" aria-label="近七日胜率走势">
      <polygon class="spark-area" points="${area}"></polygon>
      <polyline class="spark-line" points="${line}"></polyline>
      <circle class="spark-dot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.4"></circle>
    </svg>`;
}

export function heroCard(hero, { compact = false } = {}) {
  const attr = attrs[hero.attr] ?? attrs.all;
  return `
    <a class="hero-card ${compact ? 'is-compact' : ''}" href="hero.html?id=${encodeURIComponent(hero.slug)}">
      <div class="hero-card-media">
        <img src="${escapeHtml(hero.art)}" alt="${escapeHtml(hero.name)}立绘" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(hero.card)}'">
      </div>
      <div class="hero-card-glow ${attr.className}"></div>
      <div class="hero-card-top">
        <span class="hero-icon-wrap ${attr.className}"><img src="${escapeHtml(hero.icon)}" alt="" loading="lazy"></span>
        <span class="hero-win ${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</span>
      </div>
      <div class="hero-card-body">
        <div class="hero-card-kicker">${attr.label} · ${escapeHtml(hero.attack)}</div>
        <h3>${escapeHtml(hero.name)}</h3>
        <p class="hero-card-en">${escapeHtml(hero.en)}</p>
        <div class="hero-card-tags">
          ${hero.positions.map((position) => `<span class="pos-badge">${position}</span>`).join('')}
          ${hero.roles.slice(0, 2).map((role) => `<span class="tag">${escapeHtml(role)}</span>`).join('')}
        </div>
      </div>
    </a>`;
}

export function itemCard(item, { showCategory = true } = {}) {
  return `
    <a class="item-card" href="item.html?id=${encodeURIComponent(item.slug)}">
      <div class="item-card-image">
        <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/fallback-item.svg'">
        ${item.neutralTier ? `<span class="item-tier">T${item.neutralTier}</span>` : ''}
      </div>
      <div class="item-card-body">
        <div class="item-card-head">
          <h3>${escapeHtml(item.name)}</h3>
          <span class="item-cost ${item.cost ? '' : 'is-free'}">${item.cost ? `${fmtNum(item.cost)}<i>g</i>` : '—'}</span>
        </div>
        <p class="item-short">${escapeHtml(item.short || item.en || '')}</p>
        ${showCategory ? `<span class="item-category">${escapeHtml(item.categoryLabel)}</span>` : ''}
      </div>
    </a>`;
}

const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8"/><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>',
};

export function initChrome() {
  const page = document.body.dataset.page ?? 'home';
  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
      <div class="header-inner">
        <a class="brand" href="index.html" aria-label="Dota 2 Wiki 首页">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="brand-text"><strong>DOTA 2</strong><em>WIKI</em></span>
        </a>
        <nav class="main-nav" id="main-nav" aria-label="主导航">
          <a href="index.html" class="${page === 'home' ? 'is-active' : ''}">首页</a>
          <a href="heroes.html" class="${page === 'heroes' || page === 'hero' ? 'is-active' : ''}">英雄</a>
          <a href="items.html" class="${page === 'items' || page === 'item' ? 'is-active' : ''}">物品</a>
          <a href="meta.html" class="${page === 'meta' ? 'is-active' : ''}">环境</a>
          <a href="patch.html" class="${page === 'patch' ? 'is-active' : ''}">7.41f</a>
        </nav>
        <div class="header-actions">
          <button class="search-trigger" type="button" data-open-search aria-label="搜索">
            ${ICONS.search}<span>搜索</span><kbd>/</kbd>
          </button>
          <a class="patch-pill" href="patch.html"><span class="pulse-dot"></span>7.41f</a>
          <button class="menu-trigger" type="button" aria-label="打开导航" aria-controls="main-nav" aria-expanded="false">${ICONS.menu}</button>
        </div>
      </div>`;
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand-mark small" aria-hidden="true"><i></i><i></i><i></i></span>
          <div><strong>DOTA 2 WIKI</strong><p>7.41f 中文英雄与物品图鉴</p></div>
        </div>
        <div class="footer-links">
          <a href="heroes.html">英雄图鉴</a>
          <a href="items.html">物品图鉴</a>
          <a href="meta.html">环境数据</a>
          <a href="patch.html">版本更新</a>
          <a href="about.html">关于与数据来源</a>
        </div>
        <div class="footer-note">
          <p>非官方粉丝项目。Dota 2 及相关素材版权归 Valve Corporation 所有。</p>
          <p>英雄 / 物品数值来自 Valve 官方 7.41f 数据；胜率与出装来自 OpenDota 公开对局。数据更新于 ${UPDATED}。</p>
        </div>
      </div>`;
  }

  const menuTrigger = $('.menu-trigger');
  const nav = $('#main-nav');
  menuTrigger?.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    menuTrigger.setAttribute('aria-expanded', String(open));
    menuTrigger.innerHTML = open ? ICONS.close : ICONS.menu;
  });

  initSearch();
}

function initSearch() {
  const modal = document.createElement('div');
  modal.className = 'search-modal';
  modal.id = 'search-modal';
  modal.innerHTML = `
    <div class="search-backdrop" data-close-search></div>
    <div class="search-panel" role="dialog" aria-modal="true" aria-label="站内搜索">
      <div class="search-field">
        ${ICONS.search}
        <input type="search" id="global-search" placeholder="搜索英雄、物品…" autocomplete="off" spellcheck="false">
        <button type="button" class="search-close" data-close-search aria-label="关闭搜索">${ICONS.close}</button>
      </div>
      <div class="search-results" id="search-results">
        <p class="search-hint">输入中文名、英文名或关键词，例如「敌法师」「BKB」「跳刀」。</p>
      </div>
    </div>`;
  document.body.append(modal);

  let dataPromise = null;
  const input = $('#global-search', modal);
  const results = $('#search-results', modal);

  const load = () => {
    dataPromise ??= Promise.all([fetchJSON('data/heroes-index.json'), fetchJSON('data/items-index.json')]);
    return dataPromise;
  };

  const open = () => {
    modal.classList.add('is-open');
    document.body.classList.add('no-scroll');
    setTimeout(() => input.focus(), 30);
    load().then(() => {
      if (!input.value.trim()) render('');
    });
  };
  const close = () => {
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  };

  const render = (query) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      results.innerHTML = '<p class="search-hint">输入中文名、英文名或关键词，例如「敌法师」「BKB」「跳刀」。</p>';
      return;
    }
    load().then(([heroData, itemData]) => {
      const heroes = heroData.heroes
        .filter((hero) => [hero.name, hero.en, hero.slug, ...(hero.roles ?? []), ...(hero.aliases ?? [])].join(' ').toLowerCase().includes(q))
        .slice(0, 7);
      const items = itemData.items
        .filter((item) => [item.name, item.en, item.slug, item.categoryLabel, ...(item.aliases ?? [])].join(' ').toLowerCase().includes(q))
        .slice(0, 7);
      if (!heroes.length && !items.length) {
        results.innerHTML = `<p class="search-empty">没有找到「${escapeHtml(query)}」相关的英雄或物品。</p>`;
        return;
      }
      results.innerHTML = `
        ${heroes.length ? `<div class="search-group"><h4>英雄 <span>${heroes.length}</span></h4>${heroes.map((hero) => `
          <a class="search-row" href="hero.html?id=${encodeURIComponent(hero.slug)}">
            <img src="${escapeHtml(hero.icon)}" alt="" loading="lazy">
            <span><strong>${escapeHtml(hero.name)}</strong><em>${escapeHtml(hero.en)}</em></span>
            <b class="search-win ${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</b>
          </a>`).join('')}</div>` : ''}
        ${items.length ? `<div class="search-group"><h4>物品 <span>${items.length}</span></h4>${items.map((item) => `
          <a class="search-row" href="item.html?id=${encodeURIComponent(item.slug)}">
            <img src="${escapeHtml(item.img)}" alt="" loading="lazy">
            <span><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(item.categoryLabel)}</em></span>
            <b class="search-cost">${item.cost ? fmtNum(item.cost) : ''}</b>
          </a>`).join('')}</div>` : ''}`;
    });
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-search]')) open();
    if (event.target.closest('[data-close-search]')) close();
  });
  input.addEventListener('input', () => render(input.value));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    if ((event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      open();
    }
  });
}

export function renderError(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="empty-state"><span class="empty-rune">✦</span><h2>页面暂时无法显示</h2><p>${escapeHtml(message)}</p><a class="button ghost" href="index.html">返回首页</a></div>`;
}
