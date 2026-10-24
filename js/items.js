import { $, initChrome, fetchJSON, itemCard, escapeHtml, fmtNum } from './core.js';

initChrome();

const grid = $('#items-grid');
const countLabel = $('#item-count');
const totalLabel = $('#items-total');
const searchInput = $('#item-search');
const searchClear = $('#item-search-clear');
const sortSelect = $('#item-sort');

const CATEGORY_OPTIONS = [
  ['', '全部'],
  ['consumable', '消耗品'],
  ['component', '组件'],
  ['basic', '基础装备'],
  ['advanced', '进阶装备'],
  ['luxury', '神装'],
  ['neutral', '中立物品'],
  ['enhancement', '附魔'],
];

const state = { q: '', category: '', sort: 'name' };
let items = [];

function readUrl() {
  const params = new URLSearchParams(location.search);
  state.q = params.get('q') ?? '';
  state.category = params.get('category') ?? '';
  state.sort = params.get('sort') ?? 'name';
}

function writeUrl() {
  const url = new URL(location.href);
  const params = url.searchParams;
  for (const key of ['q', 'category', 'sort']) {
    if (state[key] && !(key === 'sort' && state[key] === 'name')) params.set(key, state[key]);
    else params.delete(key);
  }
  history.replaceState(null, '', `${url.pathname}${params.toString() ? `?${params}` : ''}`);
}

function renderFilters() {
  const container = $('#filter-category');
  container.innerHTML = '<span class="filter-label">分类</span>' + CATEGORY_OPTIONS.map(([value, label]) => {
    const count = value ? items.filter((item) => item.category === value).length : items.length;
    return `<button class="chip ${state.category === value ? 'is-active' : ''}" type="button" data-category="${value}">${label}<span class="count">${count}</span></button>`;
  }).join('');
}

function filteredItems() {
  const query = state.q.trim().toLowerCase();
  let rows = items.filter((item) => {
    if (state.category && item.category !== state.category) return false;
    if (query) {
      const haystack = [item.name, item.en, item.slug, item.categoryLabel, item.short, ...(item.aliases ?? [])].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  rows = [...rows].sort((a, b) => {
    if (state.sort === 'cost') return (b.cost ?? 0) - (a.cost ?? 0);
    if (state.sort === 'costAsc') return (a.cost ?? 0) - (b.cost ?? 0);
    if (state.sort === 'category') return a.categoryLabel.localeCompare(b.categoryLabel, 'zh-Hans-CN') || a.name.localeCompare(b.name, 'zh-Hans-CN');
    return a.name.localeCompare(b.name, 'zh-Hans-CN');
  });
  return rows;
}

function render() {
  const rows = filteredItems();
  countLabel.textContent = fmtNum(rows.length);
  searchClear.hidden = !state.q;
  if (!rows.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-rune">✦</span><h2>没有符合条件的物品</h2><p>试试清除分类或换个关键词。</p></div>';
  } else {
    grid.innerHTML = rows.map((item) => itemCard(item)).join('');
  }
  document.querySelectorAll('[data-category]').forEach((button) => {
    button.classList.toggle('is-active', state.category === button.dataset.category);
  });
}

function initEvents() {
  document.querySelectorAll('#filter-category .chip').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = state.category === button.dataset.category ? '' : button.dataset.category;
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
    const data = await fetchJSON('data/items-index.json');
    items = data.items;
    totalLabel.textContent = fmtNum(items.length);
    readUrl();
    searchInput.value = state.q;
    sortSelect.value = ['name', 'cost', 'costAsc', 'category'].includes(state.sort) ? state.sort : 'name';
    renderFilters();
    initEvents();
    render();
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h2>物品数据加载失败</h2><p>请通过静态服务器或 GitHub Pages 打开本站。</p></div>';
  }
}

init();
