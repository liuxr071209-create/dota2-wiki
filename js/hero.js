import {
  $,
  initChrome,
  fetchJSON,
  getParam,
  setPageMeta,
  attrs,
  escapeHtml,
  fmtPct,
  fmtNum,
  fmtSigned,
  winClass,
  sparkline,
  renderError,
} from './core.js';

initChrome();

const root = $('#hero-detail');
const slugParam = getParam('id');

const STAGES = [
  ['start_game_items', '出门装', '0–10 分钟'],
  ['early_game_items', '前期', '10–20 分钟'],
  ['mid_game_items', '中期', '20–35 分钟'],
  ['late_game_items', '后期', '35 分钟以后'],
];

function masthead(hero) {
  const attr = attrs[hero.attr] ?? attrs.all;
  return `
    <section class="hero-masthead ${attr.className}">
      <img class="hero-masthead-bg" src="${escapeHtml(hero.card)}" alt="" aria-hidden="true">
      <div class="hero-masthead-inner">
        <div class="hero-portrait">
          <img src="${escapeHtml(hero.art)}" alt="${escapeHtml(hero.name)}立绘" onerror="this.onerror=null;this.src='${escapeHtml(hero.card)}'">
        </div>
        <div class="hero-masthead-copy">
          <div class="hero-title-row">
            <div class="hero-title-icon"><img src="${escapeHtml(hero.icon)}" alt="" loading="lazy"></div>
            <div>
              <h1>${escapeHtml(hero.name)}</h1>
              <div class="en-name">${escapeHtml(hero.en)}</div>
            </div>
          </div>
          <p class="hero-blurb">${escapeHtml(hero.npe || hero.hype || hero.lore).slice(0, 220)}${(hero.npe || hero.hype || hero.lore).length > 220 ? '…' : ''}</p>
          <div class="hero-masthead-tags">
            <span class="tag">${escapeHtml(hero.attrLabel)}</span>
            <span class="tag">${escapeHtml(hero.attack)}</span>
            <span class="tag">${escapeHtml(hero.complexityLabel)}</span>
            ${hero.roles.map((role) => `<span class="tag">${escapeHtml(role)}</span>`).join('')}
            ${hero.positions.map((position) => `<span class="pos-badge" title="${escapeHtml(hero.positionNames[hero.positions.indexOf(position)] ?? '')}">${position}</span>`).join('')}
          </div>
          <div class="masthead-numbers">
            <div class="masthead-number"><strong class="${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</strong><span>近期胜率</span></div>
            <div class="masthead-number"><strong>${fmtPct(hero.pickrate)}</strong><span>登场率</span></div>
            <div class="masthead-number"><strong>#${hero.winRank ?? '—'}</strong><span>胜率排名</span></div>
            <div class="masthead-number"><strong class="${hero.delta >= 0 ? 'is-good' : 'is-weak'}">${fmtSigned(hero.delta)}%</strong><span>七日走势</span></div>
            <div class="masthead-trend">
              <div class="masthead-trend-label"><span>7 日胜率</span><span>${hero.trend?.filter((v) => v !== null).length ?? 0} 个窗口</span></div>
              ${sparkline(hero.trend, { width: 190, height: 40 })}
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function statsBlock(hero) {
  const stats = hero.stats;
  const cells = [
    ['生命值', fmtNum(stats.health)],
    ['生命恢复', `${stats.healthRegen}`],
    ['魔法值', fmtNum(stats.mana)],
    ['魔法恢复', `${stats.manaRegen}`],
    ['攻击力', stats.damage],
    ['护甲', `${stats.armor}`],
    ['魔法抗性', `${stats.magicResistance}%`],
    ['移动速度', `${stats.moveSpeed}`],
    ['攻击距离', `${stats.attackRange}`],
    ['攻击频率', `${stats.attackRate}`],
    ['白天视野', fmtNum(stats.sightDay)],
    ['夜间视野', fmtNum(stats.sightNight)],
  ];
  return `
    <section class="content-block" id="stats">
      <div class="block-head"><h2>基础属性 <small>LEVEL 1</small></h2><span class="head-note">Valve 7.41f 基础数值</span></div>
      <div class="stat-grid">
        ${cells.map(([label, value]) => `<div class="stat-cell"><span>${label}</span><strong>${value}</strong></div>`).join('')}
      </div>
      <div class="attr-block">
        <div class="attr-cell str"><div class="attr-name">力量</div><div class="attr-value">${stats.str.base} <small>+${stats.str.gain}/级</small></div></div>
        <div class="attr-cell agi"><div class="attr-name">敏捷</div><div class="attr-value">${stats.agi.base} <small>+${stats.agi.gain}/级</small></div></div>
        <div class="attr-cell int"><div class="attr-name">智力</div><div class="attr-value">${stats.int.base} <small>+${stats.int.gain}/级</small></div></div>
      </div>
    </section>`;
}

function abilityCard(ability, index) {
  const hasUpgrade = ability.shard || ability.scepter;
  return `
    <article class="ability-card is-${ability.type}" id="ability-${index}">
      <div class="ability-main">
        <div class="ability-icon">
          <img src="${escapeHtml(ability.icon)}" alt="" loading="lazy" onerror="this.style.display='none'">
          <span class="ability-type">${ability.type === 'ultimate' ? 'ULT' : ability.type === 'innate' ? '先天' : ability.type === 'passive' ? '被动' : '主动'}</span>
        </div>
        <div>
          <div class="ability-head">
            <h3>${escapeHtml(ability.name)}</h3>
            <span class="en">${escapeHtml(ability.en)}</span>
          </div>
          <p class="ability-desc">${escapeHtml(ability.desc)}</p>
          ${ability.notes.length ? `<ul class="ability-notes">${ability.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>` : ''}
          ${ability.chips.length ? `<div class="ability-chips">${ability.chips.map((chip) => `<span class="ability-chip">${escapeHtml(chip.label)} <b>${escapeHtml(chip.value)}</b></span>`).join('')}</div>` : ''}
          ${ability.scepter ? `<div class="ability-upgrade"><strong>神杖升级 · </strong>${escapeHtml(ability.scepter)}</div>` : ''}
          ${ability.shard ? `<div class="ability-upgrade shard"><strong>魔晶升级 · </strong>${escapeHtml(ability.shard)}</div>` : ''}
          ${hasUpgrade && !ability.scepter && !ability.shard ? '<div class="ability-upgrade">该技能可被阿哈利姆神杖或魔晶升级。</div>' : ''}
        </div>
      </div>
      ${ability.values.length ? `
        <dl class="ability-values">
          ${ability.values.map((value) => `
            <div class="ability-value">
              <dt>${escapeHtml(value.label)}</dt>
              <dd>${escapeHtml(value.value)}
                ${value.scepter ? `<em>神杖 ${escapeHtml(value.scepter)}</em>` : ''}
                ${value.shard ? `<em class="shard">魔晶 ${escapeHtml(value.shard)}</em>` : ''}
              </dd>
            </div>`).join('')}
        </dl>` : ''}
    </article>`;
}

function abilitiesBlock(hero) {
  return `
    <section class="content-block" id="abilities">
      <div class="block-head">
        <h2>技能 <small>${hero.abilities.length} 个</small></h2>
        <span class="head-note">逐级数值 · 神杖 / 魔晶升级</span>
      </div>
      <div class="ability-list">
        ${hero.abilities.map(abilityCard).join('')}
      </div>
    </section>`;
}

function talentsBlock(hero) {
  if (!hero.talents.length) return '';
  return `
    <section class="content-block" id="talents">
      <div class="block-head"><h2>天赋树 <small>10 / 15 / 20 / 25</small></h2><span class="head-note">左右二选一</span></div>
      <div class="talent-grid">
        ${hero.talents.map((row) => `
          <div class="talent-row">
            <div class="talent-level">${row.level}</div>
            ${row.options.map((option) => `<div class="talent-option" title="${escapeHtml(option.en)}">${escapeHtml(option.name)}</div>`).join('')}
          </div>`).join('')}
      </div>
    </section>`;
}

function buildBlock(hero) {
  const route = STAGES.map(([key, label]) => {
    const names = (hero.build?.[key] ?? []).slice(0, 2).map((item) => item.name);
    return names.length ? `${label} ${names.join(' / ')}` : null;
  }).filter(Boolean);
  return `
    <section class="content-block" id="build">
      <div class="block-head">
        <h2>出装参考 <small>OPEN DOTA</small></h2>
        <span class="head-note">按阶段统计的装备出现热度</span>
      </div>
      ${route.length ? `<p class="build-route">常见路线：<strong>${route.map(escapeHtml).join(' → ')}</strong></p>` : ''}
      <div class="build-section">
        ${STAGES.map(([key, label, time]) => {
          const rows = hero.build?.[key] ?? [];
          return `
            <div class="build-stage">
              <div class="build-stage-head"><h3>${label}</h3><span>${time}</span></div>
              <div class="build-items">
                ${rows.length ? rows.map((item) => `
                  <a class="build-item" href="item.html?id=${encodeURIComponent(item.slug)}">
                    <img src="${escapeHtml(item.img)}" alt="" loading="lazy">
                    <span class="build-item-main"><strong>${escapeHtml(item.name)}</strong><span class="build-bar"><i style="width:${item.heat}%"></i></span></span>
                    <span class="count">${item.count}</span>
                  </a>`).join('') : '<p class="counter-empty">暂无足够样本</p>'}
              </div>
            </div>`;
        }).join('')}
      </div>
      <p class="data-note" style="margin-top:8px">热度按该阶段内最高选取次数归一化；样本来自 OpenDota 公开对局，低分段与高分段混合，仅作出装方向参考。</p>
    </section>`;
}

function countersBlock(hero) {
  const renderRows = (rows, empty) => rows.length
    ? rows.map((row) => `
      <a class="counter-row" href="hero.html?id=${encodeURIComponent(row.slug)}">
        <img src="${escapeHtml(row.icon)}" alt="" loading="lazy">
        <span>${escapeHtml(row.name)}<em>${row.games} 场</em></span>
        <b class="${winClass(row.winrate)}">${fmtPct(row.winrate)}</b>
      </a>`).join('')
    : `<p class="counter-empty">${empty}</p>`;

  return `
    <section class="content-block" id="counters">
      <div class="block-head"><h2>克制关系 <small>近期对局</small></h2><span class="head-note">样本 ≥ 25 场，仅供参考</span></div>
      <div class="counter-grid">
        <div class="counter-panel">
          <h3>对阵劣势 <span>COUNTERED BY</span></h3>
          <div class="counter-list">${renderRows(hero.counters.weak, '近期样本不足')}</div>
        </div>
        <div class="counter-panel good">
          <h3>对阵优势 <span>GOOD AGAINST</span></h3>
          <div class="counter-list">${renderRows(hero.counters.strong, '近期样本不足')}</div>
        </div>
      </div>
      <p class="data-note" style="margin-top:8px">数值为<span style="color:var(--text-dim)">${escapeHtml(hero.name)}</span>面对该英雄时的胜率。对局样本较小时波动明显，请结合阵容与分路理解。</p>
    </section>`;
}

function aside(hero) {
  return `
    <aside class="side-column">
      <div class="aside-card">
        <div class="aside-card-head">版本数据 · 7.41f</div>
        <div class="aside-body">
          <div class="aside-stat"><span>近期胜率</span><b class="${winClass(hero.winrate)}">${fmtPct(hero.winrate)}</b></div>
          <div class="aside-stat"><span>登场率</span><b>${fmtPct(hero.pickrate)}</b></div>
          <div class="aside-stat"><span>胜率排名</span><b>#${hero.winRank ?? '—'} / ${hero.winRank ? 127 : '—'}</b></div>
          <div class="aside-stat"><span>职业选取</span><b>${fmtNum(hero.proPick)}</b></div>
          <div class="aside-stat"><span>职业禁用</span><b>${fmtNum(hero.proBan)}</b></div>
          <div class="aside-stat"><span>七日变化</span><b class="${hero.delta >= 0 ? 'is-good' : 'is-weak'}">${fmtSigned(hero.delta)}%</b></div>
        </div>
      </div>
      <div class="aside-card">
        <div class="aside-card-head">常见位置</div>
        <div class="aside-body">
          <div class="aside-positions">
            ${hero.positions.map((position, index) => `
              <span class="aside-position"><b>${position}</b>${escapeHtml(hero.positionNames[index] ?? '')}${index === 0 ? ' · 主' : ''}</span>`).join('')}
          </div>
          <div class="aside-stat" style="margin-top:10px"><span>分路</span><b>${hero.lanes.map(escapeHtml).join(' / ')}</b></div>
        </div>
      </div>
      <div class="aside-card">
        <div class="aside-card-head">本页导航</div>
        <nav class="aside-nav">
          <a href="#stats">基础属性</a>
          <a href="#abilities">技能与数值</a>
          <a href="#talents">天赋树</a>
          <a href="#build">出装参考</a>
          <a href="#counters">克制关系</a>
          <a href="#lore">背景故事</a>
        </nav>
      </div>
      <div class="aside-card">
        <div class="aside-card-head">快速跳转</div>
        <nav class="aside-nav">
          <a href="heroes.html?attr=${encodeURIComponent(hero.attr)}">同属性英雄 →</a>
          <a href="meta.html">版本环境 →</a>
          <a href="patch.html">7.41f 改动 →</a>
        </nav>
      </div>
    </aside>`;
}

function render(hero) {
  setPageMeta(`${hero.name} ${hero.en} · DOTA 2 WIKI 7.41f`, `${hero.name}（${hero.en}）7.41f 技能、天赋、出装、胜率走势与克制关系。`);
  $('#breadcrumb-name').textContent = hero.name;
  root.innerHTML = `
    ${masthead(hero)}
    <div class="hero-layout">
      <div class="content-column">
        ${statsBlock(hero)}
        ${abilitiesBlock(hero)}
        ${talentsBlock(hero)}
        ${buildBlock(hero)}
        ${countersBlock(hero)}
        <section class="content-block" id="lore">
          <div class="block-head"><h2>背景故事</h2><span class="head-note">${escapeHtml(hero.en)}</span></div>
          <div class="lore-block"><p>${escapeHtml(hero.lore)}</p></div>
        </section>
      </div>
      ${aside(hero)}
    </div>`;
}

async function init() {
  if (!slugParam) {
    renderError(root, '缺少英雄 ID。请从英雄图鉴进入。');
    return;
  }
  try {
    const index = await fetchJSON('data/heroes-index.json');
    const match = index.heroes.find((hero) => hero.slug === slugParam || String(hero.id) === slugParam);
    if (!match) {
      renderError(root, `没有找到「${slugParam}」对应的英雄。`);
      return;
    }
    const hero = await fetchJSON(`data/heroes/${match.slug}.json`);
    render(hero);
  } catch (error) {
    console.error(error);
    renderError(root, '英雄数据读取失败。请确认是通过静态服务器或 GitHub Pages 访问。');
  }
}

init();
