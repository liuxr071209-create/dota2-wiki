import { $, initChrome, fetchJSON, heroCard, escapeHtml, fmtNum } from './core.js';

initChrome();

const grid = $('#heroes-grid');
const countLabel = $('#hero-count');
const searchInput = $('#hero-search');
const searchClear = $('#hero-search-clear');
const sortSelect = $('#hero-sort');

const ATTR_OPTIONS = [
  ['', '全部'],
  ['str', '力量'],
  ['agi', '敏捷'],
  ['int', '智力'],
  ['all', '全能'],
];
const ROLE_ORDER = ['核心', '辅助', '爆发', '控制', '先手', '耐久', '逃生', '推进'];
const POSITION_OPTIONS = [['', '全部'], ['1', '1 号位'], ['2', '2 号位'], ['3', '3 号位'], ['4', '4 号位'], ['5', '5 号位']];

const state = {
  q: '',
  attr: '',
  role: '',
  pos: '',
  sort: 'winrate',
};

let heroes = [];

function readUrl() {
  const params = new URLSearchParams(location.search);
  state.q = params.get('q') ?? '';
  state.attr = params.get('attr') ?? '';
  state.role = params.get('role') ?? '';
  state.pos = params.get('pos') ?? '';
  state.sort = params.get('sort') ?? 'winrate';
}

function writeUrl() {
  const url = new URL(location.href);
  const params = url.searchParams;
  for (const key of ['q', 'attr', 'role', 'pos', 'sort']) {
    if (state[key] && !(key === 'sort' && state[key] === 'winrate')) params.set(key, state[key]);
    else params.delete(key);
  }
  history.replaceState(null, '', `${url.pathname}${params.toString() ? `?${params}` : ''}`);
}

function chip(label, value, count, active, group) {
  return `<button class="chip ${active ? 'is-active' : ''}" type="button" data-group="${group}" data-value="${escapeHtml(value)}">${escapeHtml(label)}${Number.isFinite(count) ? `<span class="count">${count}</span>` : ''}</button>`;
}

function renderFilters() {
  const attrContainer = $('#filter-attr');
  const roleContainer = $('#filter-role');
  const posContainer = $('#filter-pos');

  attrContainer.innerHTML = '<span class="filter-label">属性</span>' + ATTR_OPTIONS.map(([value, label]) => {
    const count = value ? heroes.filter((hero) => hero.attr === value).length : heroes.length;
    return chip(label, value, count, state.attr === value, 'attr');
  }).join('');

  roleContainer.innerHTML = '<span class="filter-label">定位</span>' +
    chip('全部', '', heroes.length, state.role === '', 'role') +
    ROLE_ORDER.filter((role) => heroes.some((hero) => hero.roles.includes(role))).map((role) => {
      const count = heroes.filter((hero) => hero.roles.includes(role)).length;
      return chip(role, role, count, state.role === role, 'role');
    }).join('');

  posContainer.innerHTML = '<span class="filter-label">位置</span>' + POSITION_OPTIONS.map(([value, label]) => {
    const count = value ? heroes.filter((hero) => hero.positions.includes(Number(value))).length : heroes.length;
    return chip(label, value, count, state.pos === value, 'pos');
  }).join('');
}

function filteredHeroes() {
  const query = state.q.trim().toLowerCase();
  let rows = heroes.filter((hero) => {
    if (state.attr && hero.attr !== state.attr) return false;
    if (state.role && !hero.roles.includes(state.role)) return false;
    if (state.pos && !hero.positions.includes(Number(state.pos))) return false;
    if (query) {
      const haystack = [hero.name, hero.en, hero.slug, hero.attrLabel, ...(hero.roles ?? []), ...(hero.positionLabels ?? []), ...(hero.aliases ?? [])]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  rows = [...rows].sort((a, b) => {
    if (state.sort === 'name') return a.name.localeCompare(b.name, 'zh-Hans-CN');
    if (state.sort === 'pickrate') return (b.pickrate ?? 0) - (a.pickrate ?? 0);
    if (state.sort === 'complexity') return (b.complexity ?? 0) - (a.complexity ?? 0);
    return (b.winrate ?? 0) - (a.winrate ?? 0);
  });
  return rows;
}

function render() {
  const rows = filteredHeroes();
  countLabel.textContent = fmtNum(rows.length);
  searchClear.hidden = !state.q;
  if (!rows.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-rune">✦</span><h2>没有符合条件的英雄</h2><p>试试清除位置或定位筛选，或换一个关键词。</p></div>`;
  } else {
    grid.innerHTML = rows.map((hero) => heroCard(hero)).join('');
  }
  document.querySelectorAll('.chip').forEach((button) => {
    button.classList.toggle('is-active', state[button.dataset.group] === button.dataset.value);
  });
}

function initEvents() {
  document.querySelectorAll('.filter-row').forEach((row) => {
    row.addEventListener('click', (event) => {
      const button = event.target.closest('.chip');
      if (!button) return;
      const { group, value } = button.dataset;
      state[group] = state[group] === value ? '' : value;
      writeUrl();
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    state.q = searchInput.value;
    writeUrl();
    render();
  });
  searchClear.addEventListener('click', () => {
    state.q = '';
    searchInput.value = '';
    writeUrl();
    render();
    searchInput.focus();
  });
  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    writeUrl();
    render();
  });
}

async function init() {
  try {
    const data = await fetchJSON('data/heroes-index.json');
    heroes = data.heroes;
    readUrl();
    searchInput.value = state.q;
    sortSelect.value = ['winrate', 'pickrate', 'name', 'complexity'].includes(state.sort) ? state.sort : 'winrate';
    renderFilters();
    initEvents();
    render();
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h2>英雄数据加载失败</h2><p>请通过静态服务器或 GitHub Pages 打开本站。</p></div>';
  }
}

init();
