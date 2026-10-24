import fs from 'node:fs/promises';
import path from 'node:path';
import { POSITIONS, POSITION_LABELS, POSITION_NAMES, POSITION_LANES } from './hero-positions.mjs';
import { HERO_ALIASES, ITEM_ALIASES } from './aliases.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'research', 'raw');
const DATA = path.join(ROOT, 'data');
const PATCH = '7.41f';
const UPDATED = '2026-10-24';

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value), 'utf8');
};

const round = (value, digits = 2) => {
  if (!Number.isFinite(value)) return null;
  const power = 10 ** digits;
  return Math.round(value * power) / power;
};

const formatNumber = (value, digits = 2) => {
  if (!Number.isFinite(value)) return String(value);
  return String(Number(value.toFixed(digits)));
};

const stripTags = (value = '') =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const ATTR = {
  0: { key: 'str', label: '力量', en: 'Strength' },
  1: { key: 'agi', label: '敏捷', en: 'Agility' },
  2: { key: 'int', label: '智力', en: 'Intelligence' },
  3: { key: 'all', label: '全能', en: 'Universal' },
};

// Valve role_levels order: Carry, Support, Nuker, Disabler, (unused), Durable, Escape, Pusher, Initiator
const ROLE_NAMES = ['核心', '辅助', '爆发', '控制', '', '耐久', '逃生', '推进', '先手'];

const ITEM_TOKENS = {
  agi: '敏捷',
  all: '全属性',
  aoe_bonus: '作用范围',
  armor: '护甲',
  attack: '攻击速度',
  attack_pct: '攻击速度',
  attack_range: '攻击距离',
  attack_range_all: '攻击距离',
  attack_range_melee: '近战攻击距离',
  cast_range: '施法距离',
  cooldown_reduction: '冷却缩减',
  damage: '攻击力',
  debuff_amp: '负面效果增强',
  evasion: '闪避',
  healing_amp: '治疗增强',
  health: '生命值',
  hp_regen: '生命恢复',
  int: '智力',
  lifesteal: '吸血',
  mana: '魔法值',
  mana_regen: '魔法恢复',
  manacost_reduction: '魔法消耗降低',
  max_mana_percentage: '最大魔法值',
  move_speed: '移动速度',
  primary_attribute: '主属性',
  projectile_speed: '弹道速度',
  restoration_amp: '恢复增强',
  selected_attrib: '所选属性',
  slow_resistance: '减速抗性',
  spell_lifesteal: '技能吸血',
  spell_resist: '魔法抗性',
  status_resist: '状态抗性',
  str: '力量',
};

const ITEM_KEY_LABELS = {
  duration: '持续时间',
  radius: '作用范围',
  aura_radius: '光环范围',
  damage: '伤害',
  slow_duration: '减速持续时间',
  slow: '减速',
  buff_duration: '增益持续时间',
  bonus_damage: '攻击力',
  replenish_amount: '回复量',
  aura_health_regen: '光环生命恢复',
  blink_range: '闪烁距离',
  health: '生命值',
  bonus_intellect: '智力',
  push_length: '推进距离',
  summon_duration: '召唤持续时间',
  speed: '速度',
  mana_restore: '魔法恢复',
  projectile_speed: '弹道速度',
  crit_multiplier: '暴击倍率',
  max_charges: '最大能量点数',
  proc_chance: '触发几率',
  damage_threshold: '伤害阈值',
  block_chance: '格挡几率',
  bonus_chance_damage: '触发额外伤害',
  vision_radius: '视野范围',
  corruption_armor: '腐蚀护甲',
  stun_duration: '眩晕持续时间',
  health_regen: '生命恢复',
  barrier_block: '护盾吸收',
  barrier_duration: '护盾持续时间',
  bonus_spell_amp: '技能增强',
  crit_chance: '暴击几率',
  heal_amount: '治疗量',
  max_distance: '最大距离',
  bonus_aoe_radius: '作用范围',
  movement_slow: '移动减速',
  knockback_duration: '击退持续时间',
  mana: '魔法值',
  damage_bonus: '额外伤害',
  absorb_amount: '吸收量',
  block_damage_melee: '近战格挡',
  block_damage_ranged: '远程格挡',
  bash_chance_melee: '近战重击几率',
  bash_chance_ranged: '远程重击几率',
  bash_duration: '重击持续时间',
  bash_cooldown: '重击冷却',
  windwalk_duration: '隐身持续时间',
  windwalk_movement_speed: '隐身移动速度',
  windwalk_bonus_damage: '破隐伤害',
  heal_reduction: '治疗降低',
  chain_damage: '弹射伤害',
  chain_strikes: '弹射次数',
  chain_radius: '弹射范围',
  heal_duration: '治疗持续时间',
  max_range: '最大距离',
  bounty_gold: '赏金',
  attack_slow: '攻击速度降低',
  bonus_magic_resistance: '魔法抗性',
  poison_duration: '毒伤持续时间',
  damage_block_melee: '近战伤害格挡',
  damage_block_ranged: '远程伤害格挡',
  bonus_attack_speed_pct: '攻击速度',
  bonus_movement_speed_pct: '移动速度',
  bonus_movement_speed: '移动速度',
  bonus_health: '生命值',
  impact_damage_units: '冲击伤害（单位）',
  impact_damage_buildings: '冲击伤害（建筑）',
  silence_duration: '沉默持续时间',
  silence_damage_percent: '沉默伤害',
  movespeed: '移动速度',
  dps: '每秒伤害',
  lifesteal_aura: '吸血光环',
  damage_aura: '攻击力光环',
  leap_distance: '跳跃距离',
  leap_speed: '跳跃速度',
  max_health: '最大生命值',
  reincarnate_time: '复活时间',
  blast_damage: '冲击伤害',
  blast_radius: '冲击范围',
  damage_absorb: '伤害吸收',
  bonus_spell_resist: '魔法抗性',
  aura_damage: '光环伤害',
  cleave_damage_percent: '分裂伤害',
  cleave_damage_percent_creep: '分裂伤害（非英雄）',
  quelling_bonus: '压制伤害（近战）',
  quelling_bonus_ranged: '压制伤害（远程）',
  cleave_distance: '分裂距离',
  illusion_duration: '幻象持续时间',
  images_do_damage_percent_melee: '幻象攻击力（近战）',
  images_take_damage_percent: '幻象承受伤害',
  images_do_damage_percent_ranged: '幻象攻击力（远程）',
  bonus_strength: '力量',
  bonus_agility: '敏捷',
  bonus_armor: '护甲',
  bonus_evasion: '闪避',
  bonus_attack_range: '攻击距离',
  bonus_cast_range: '施法距离',
  bonus_mana: '魔法值',
  magic_resistance: '魔法抗性',
  status_resistance: '状态抗性',
  slow_resist: '减速抗性',
  spell_lifesteal: '技能吸血',
  spell_amp: '技能增强',
  health_regen_pct: '生命恢复',
  max_hp_pct: '最大生命值',
  max_movement_speed: '最大移动速度',
  movement_speed: '移动速度',
  attack_speed: '攻击速度',
  armor_bonus: '护甲',
  evasion: '闪避',
  magic_resist: '魔法抗性',
  night_vision: '夜间视野',
  turn_rate: '转身速率',
  bonus_gold: '金钱',
  health_restore: '生命回复',
  mana_restore_pct: '魔法回复',
  bonus_attack_speed: '攻击速度',
  bonus_damage_pct: '攻击力',
  bonus_primary_stat: '主属性',
  bonus_secondary_stat: '次属性',
  health_gain: '生命获取',
  mana_gain: '魔法获取',
};

function tokenizeHeading(heading = '') {
  let text = stripTags(heading);
  text = text.replace(/\$([a-zA-Z0-9_]+)/g, (_, key) => ITEM_TOKENS[key] ?? key);
  return text.trim();
}

function unitFor(key, heading, isPercentage) {
  if (isPercentage) return '%';
  if (/%/.test(heading ?? '')) return '%';
  if (/duration|_time$|time_/i.test(key) && /持续|时间|冷却|眩晕|沉默|减速/.test(heading ?? '')) {
    return ' 秒';
  }
  if (
    /percent|pct|chance|multiplier|crit/i.test(key) ||
    /几率|概率|暴击|加深|增强|抗性|闪避|吸血|缩减|系数|减速|降低/.test(heading ?? '')
  ) {
    return '%';
  }
  return '';
}

function formatValues(values, key, heading, isPercentage) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const unit = unitFor(key, heading, isPercentage);
  const text = values
    .filter((value) => Number.isFinite(value))
    .map((value) => formatNumber(value))
    .join(' / ');
  if (!text) return null;
  return unit === '%' ? text.split(' / ').map((part) => `${part}%`).join(' / ') : `${text}${unit}`;
}

function specialValuesMap(specialValues = []) {
  const map = new Map();
  for (const value of specialValues) {
    const values = value.values_float ?? [];
    if (values.length) {
      map.set(value.name, values);
      map.set(value.name.toLowerCase(), values);
    }
  }
  return map;
}

const PLACEHOLDER_FALLBACKS = {
  customval_team_tomes_used: '随对局变化',
};

function resolvePlaceholders(text = '', map) {
  let output = text.replace(/%([a-zA-Z0-9_]+)%/g, (match, key) => {
    const values = map.get(key) ?? map.get(key.toLowerCase());
    if (!values) return PLACEHOLDER_FALLBACKS[key] ?? match;
    return values.map((value) => formatNumber(value)).join(' / ');
  });
  output = output.replace(/%%/g, '%');
  return output;
}

function cleanDescription(html = '', map) {
  let output = resolvePlaceholders(html, map);
  output = output.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\u0001$1\u0002');
  output = output.replace(/<br\s*\/?>/gi, '\u0003');
  output = output.replace(/<font[^>]*>(.*?)<\/font>/gi, '$1');
  output = output.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
  output = output.replace(/<[^>]+>/g, '');
  output = output
    .replace(/\u0001/g, '<div class="tt-h">')
    .replace(/\u0002/g, '</div>')
    .replace(/\u0003/g, '<br>');
  output = output.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return output.trim();
}

function cleanText(text = '', map = new Map()) {
  return stripTags(resolvePlaceholders(text, map));
}

function heroSlugFromConstant(hero) {
  return path.basename((hero.img ?? '').split('?')[0], '.png');
}

function itemSlugFromName(name = '') {
  return name.replace(/^item_/, '');
}

function buildAbility(ability, constantsAbilities) {
  const map = specialValuesMap(ability.special_values);
  const values = [];
  for (const value of ability.special_values ?? []) {
    if (!value.heading_loc) continue;
    if (/^Ability(CastRange|Cooldown|ManaCost|Duration|Charges|ChargeRestoreTime|CastPoint|ChannelTime)$/.test(value.name)) {
      continue;
    }
    const base = formatValues(value.values_float, value.name, value.heading_loc, value.is_percentage);
    if (!base) continue;
    const scepter = formatValues(value.values_scepter, value.name, value.heading_loc, value.is_percentage);
    const shard = formatValues(value.values_shard, value.name, value.heading_loc, value.is_percentage);
    values.push({
      key: value.name,
      label: tokenizeHeading(value.heading_loc).replace(/[：:]$/, ''),
      value: base,
      ...(scepter && scepter !== base ? { scepter } : {}),
      ...(shard && shard !== base ? { shard } : {}),
    });
  }

  const joinLevels = (valuesToJoin) =>
    Array.isArray(valuesToJoin) && valuesToJoin.some((value) => value !== 0)
      ? valuesToJoin.map((value) => formatNumber(value)).join(' / ')
      : null;

  const chips = [];
  const cooldown = joinLevels(ability.cooldowns);
  if (cooldown) chips.push({ label: '冷却', value: `${cooldown} 秒` });
  const mana = joinLevels(ability.mana_costs);
  if (mana) chips.push({ label: '魔法', value: mana });
  const range = joinLevels(ability.cast_ranges);
  if (range) chips.push({ label: '施法距离', value: range });
  const duration = joinLevels(ability.durations);
  if (duration) chips.push({ label: '持续时间', value: `${duration} 秒` });
  const damage = joinLevels(ability.damages);
  if (damage) chips.push({ label: '伤害', value: damage });
  const healthCost = joinLevels(ability.health_costs);
  if (healthCost) chips.push({ label: '生命消耗', value: healthCost });

  const bits = BigInt(ability.behavior || '0');
  const isPassive = (bits & 2n) === 2n;
  const type = ability.ability_is_innate
    ? 'innate'
    : ability.type === 1
      ? 'ultimate'
      : isPassive
        ? 'passive'
        : 'active';
  const typeLabel = {
    innate: '先天技能',
    ultimate: '终极技能',
    passive: '被动',
    active: '主动',
  }[type];

  const constantsAbility = constantsAbilities[ability.name];
  const iconName = (constantsAbility?.img ?? `/apps/dota2/images/dota_react/abilities/${ability.name}.png`)
    .split('?')[0]
    .split('/')
    .pop()
    .replace(/\.png$/, '');

  return {
    id: ability.id,
    key: ability.name,
    name: ability.name_loc,
    en: constantsAbility?.dname ?? ability.name,
    desc: cleanText(ability.desc_loc, map),
    lore: cleanText(ability.lore_loc, map),
    notes: (ability.notes_loc ?? []).map((note) => cleanText(note, map)).filter(Boolean),
    shard: cleanText(ability.shard_loc, map),
    scepter: cleanText(ability.scepter_loc, map),
    values,
    chips,
    type,
    typeLabel,
    icon: `assets/abilities/${iconName}.png`,
    maxLevel: ability.max_level,
    hasShard: Boolean(ability.ability_has_shard),
    hasScepter: Boolean(ability.ability_has_scepter),
  };
}

function buildTalent(talent, constantsAbilities) {
  const english = constantsAbilities[talent.name]?.dname ?? '';
  const numbers = english.match(/-?\d+(?:\.\d+)?/g) ?? [];
  let index = 0;
  let text = (talent.name_loc ?? '').replace(/\{s:[^}]+\}/g, () => numbers[index++] ?? '?');
  if (text.includes('?') && english) text = english;
  return { key: talent.name, name: text, en: english };
}

function buildItem(item, constantsItem, constantsItems, recipeComponents, buildsInto) {
  const map = specialValuesMap(item.special_values);
  const values = [];
  for (const value of item.special_values ?? []) {
    if (!(value.values_float ?? []).some((number) => number !== 0)) continue;
    let label = value.heading_loc ? tokenizeHeading(value.heading_loc) : ITEM_KEY_LABELS[value.name] ?? '';
    if (!label) continue;
    const display = formatValues(value.values_float, value.name, label, value.is_percentage);
    if (!display) continue;
    values.push({
      key: value.name,
      label: label.replace(/[：:]$/, ''),
      value: display,
    });
  }

  const joinLevels = (valuesToJoin) =>
    Array.isArray(valuesToJoin) && valuesToJoin.some((number) => number !== 0)
      ? valuesToJoin.map((number) => formatNumber(number)).join(' / ')
      : null;
  const chips = [];
  const cooldown = joinLevels(item.cooldowns);
  if (cooldown) chips.push({ label: '冷却', value: `${cooldown} 秒` });
  const mana = joinLevels(item.mana_costs);
  if (mana) chips.push({ label: '魔法', value: mana });
  const range = joinLevels(item.cast_ranges);
  if (range) chips.push({ label: '施法距离', value: range });
  const damage = joinLevels(item.damages);
  if (damage) chips.push({ label: '伤害', value: damage });

  const slug = constantsItem ? Object.keys(constantsItems).find((key) => constantsItems[key] === constantsItem) : itemSlugFromName(item.name);
  const neutralTier =
    Number.isInteger(item.item_neutral_tier) && item.item_neutral_tier >= 1 && item.item_neutral_tier <= 5
      ? item.item_neutral_tier
      : null;
  const cost = item.item_cost || constantsItem?.cost || 0;
  const qual = constantsItem?.qual ?? '';

  let category = 'advanced';
  let categoryLabel = '进阶装备';
  if (neutralTier) {
    category = 'neutral';
    categoryLabel = `中立 · ${neutralTier} 级`;
  } else if (qual === 'consumable') {
    category = 'consumable';
    categoryLabel = '消耗品';
  } else if (qual === 'component' && cost <= 1200) {
    category = 'component';
    categoryLabel = '组件';
  } else if (cost <= 1000) {
    category = 'basic';
    categoryLabel = '基础装备';
  } else if (cost > 3000) {
    category = 'luxury';
    categoryLabel = '神装';
  }

  const componentSlugs = [
    ...new Map(
      [
        ...(constantsItem?.components ?? []),
        ...(recipeComponents.get(slug) ?? []),
      ]
        .filter((key) => key && constantsItems[key] && constantsItems[key].qual !== 'recipe')
        .map((key) => [key, key]),
    ).values(),
  ];

  const components = componentSlugs.map((key) => ({
    slug: key,
    name: constantsItems[key]?.dname ?? key,
    cost: constantsItems[key]?.cost ?? 0,
    img: `assets/items/${key}.png`,
  }));

  const descHtml = cleanDescription(item.desc_loc ?? '', map);
  const lore = cleanText(item.lore_loc ?? '', map);
  const notes = (item.notes_loc ?? []).map((note) => cleanText(note, map)).filter(Boolean);
  const shortStat = values.slice(0, 2).map((value) => `${value.label} ${value.value}`.trim()).join(' · ');
  const plainDesc = stripTags(descHtml).replace(/\s+/g, ' ');
  const short = shortStat || plainDesc.slice(0, 42);

  return {
    id: item.id,
    slug,
    name: item.name_loc,
    en: item.name_english_loc || constantsItem?.dname || item.name,
    cost,
    qual,
    category,
    categoryLabel,
    neutralTier,
    img: `assets/items/${slug}.png`,
    desc: descHtml,
    lore,
    notes,
    values,
    chips,
    components,
    buildsInto: [...(buildsInto.get(slug) ?? [])]
      .map((key) => ({
        slug: key,
        name: constantsItems[key]?.dname ?? key,
        cost: constantsItems[key]?.cost ?? 0,
        img: `assets/items/${key}.png`,
      }))
      .sort((a, b) => a.cost - b.cost),
    short,
  };
}

function parseNeutralItems(text) {
  const map = new Map();
  let tier = 0;
  let mode = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    const depth = (line.match(/^\t*/) ?? [''])[0].length;
    const keyMatch = trimmed.match(/^"([^"]+)"/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    if (depth === 2 && /^\d+$/.test(key)) {
      tier = Number(key);
      mode = null;
    } else if (depth === 3 && key === 'items') {
      mode = 'trinket';
    } else if (depth === 3 && key === 'enhancements') {
      mode = 'enhancement';
    } else if (mode === 'trinket' && depth === 4 && key.startsWith('item_')) {
      map.set(key.replace(/^item_/, ''), { tier, kind: 'trinket' });
    } else if (mode === 'enhancement' && depth === 5 && key.startsWith('item_')) {
      map.set(key.replace(/^item_/, ''), { tier, kind: 'enhancement' });
    }
  }
  return map;
}

function parsePatchArticle(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let section = null;
  let group = null;
  let subgroup = null;
  let ability = null;

  const pushNote = (note) => {
    if (!note) return;
    if (ability) ability.notes.push(note);
    else if (subgroup) subgroup.notes.push(note);
    else if (group) group.notes.push(note);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      const name = line.slice(3).trim();
      subgroup = null;
      ability = null;
      if (name === '物品改动') {
        section = { type: 'items', title: name, groups: [] };
        sections.push(section);
        group = null;
      } else if (name === '中立物品改动') {
        section = { type: 'neutral', title: name, groups: [] };
        sections.push(section);
        group = null;
      } else if (name === '英雄改动') {
        section = { type: 'heroes', title: name, groups: [] };
        sections.push(section);
        group = null;
      } else {
        group = { name, notes: [], groups: [] };
        section?.groups.push(group);
      }
    } else if (line.startsWith('### ')) {
      const name = line.slice(4).trim();
      ability = null;
      subgroup = { name, notes: [], abilities: [] };
      group?.groups.push(subgroup);
    } else if (line.startsWith('#### ')) {
      const name = line.slice(5).trim();
      ability = { name, notes: [] };
      subgroup?.abilities.push(ability);
    } else if (line.startsWith('* ')) {
      pushNote(line.slice(2).trim().replace(/\*\*/g, ''));
    }
  }
  return sections;
}

async function main() {
  console.log('Loading constants…');
  const [constantsHeroes, constantsItems, constantsAbilities, heroAbilities] = await Promise.all([
    readJson(path.join(ROOT, 'research', 'dotaconstants', 'build', 'heroes.json')),
    readJson(path.join(ROOT, 'research', 'dotaconstants', 'build', 'items.json')),
    readJson(path.join(ROOT, 'research', 'dotaconstants', 'build', 'abilities.json')),
    readJson(path.join(ROOT, 'research', 'dotaconstants', 'build', 'hero_abilities.json')),
  ]);

  const heroList = (await readJson(path.join(RAW, 'hero-list.json'))).result.data.heroes;
  const itemList = (await readJson(path.join(RAW, 'item-list.json'))).result.data.itemabilities;
  const heroStats = await readJson(path.join(RAW, 'opendota', 'hero-stats.json'));
  const neutralMeta = parseNeutralItems(
    await fs.readFile(path.join(ROOT, 'research', 'neutral_items.txt'), 'utf8'),
  );
  console.log(`neutral trinkets / enhancements: ${neutralMeta.size}`);

  const constantHeroById = new Map(Object.values(constantsHeroes).map((hero) => [hero.id, hero]));
  const constantItemById = new Map(Object.values(constantsItems).map((item) => [item.id, item]));
  const heroStatById = new Map(heroStats.map((hero) => [hero.id, hero]));

  const itemListById = new Map(itemList.map((item) => [item.id, item]));

  // Item recipes give us component ids where constants are unavailable.
  const recipeComponents = new Map();
  for (const item of itemList) {
    if (!item.name.startsWith('item_recipe_')) continue;
    const target = item.name.replace('item_recipe_', '');
    const ids = item.recipes?.[0]?.items ?? [];
    recipeComponents.set(
      target,
      ids.map((id) => itemListById.get(id)?.name?.replace(/^item_/, '')).filter(Boolean),
    );
  }

  // Reverse component graph.
  const buildsInto = new Map();
  for (const [key, item] of Object.entries(constantsItems)) {
    if (item.qual === 'recipe') continue;
    for (const component of new Set(item.components ?? [])) {
      if (!constantsItems[component]) continue;
      if (!buildsInto.has(component)) buildsInto.set(component, new Set());
      buildsInto.get(component).add(key);
    }
  }

  console.log('Building items…');
  const itemDataById = new Map();
  for (const metadata of itemList) {
    const file = path.join(RAW, 'items', `${metadata.id}.json`);
    try {
      const raw = await readJson(file);
      const item = raw.result?.data?.items?.[0];
      if (!item) continue;
      itemDataById.set(metadata.id, item);
    } catch {
      // Some itemlist ids have no corresponding itemdata row.
    }
  }

  const zeroCostShopItems = new Set([
    'ward_observer',
    'ward_sentry',
    'tier1_token',
    'tier2_token',
    'tier3_token',
    'tier4_token',
    'tier5_token',
  ]);

  const items = [];
  for (const [id, item] of itemDataById) {
    if (!item || item.name.startsWith('item_recipe_')) continue;
    const constantsItem = constantItemById.get(id) ?? constantsItems[itemSlugFromName(item.name)];
    const slug = constantsItem
      ? Object.keys(constantsItems).find((key) => constantsItems[key] === constantsItem)
      : itemSlugFromName(item.name);
    if (!slug) continue;
    if (constantsItem?.qual === 'recipe') continue;
    if (/_(hidden|deprecated|unused|test)$/.test(slug)) continue;

    const neutralInfo = neutralMeta.get(slug);
    const isConsumable = constantsItem?.qual === 'consumable';
    const keep =
      Boolean(neutralInfo) ||
      (item.item_cost ?? 0) > 0 ||
      isConsumable ||
      zeroCostShopItems.has(slug);
    if (!keep) continue;

    const built = buildItem(item, constantsItem, constantsItems, recipeComponents, buildsInto);
    built.slug = slug;
    built.img = `assets/items/${slug}.png`;
    built.name = item.name_loc || constantsItem?.dname || built.name;
    built.en = item.name_english_loc || constantsItem?.dname || built.en;
    built.aliases = ITEM_ALIASES[slug] ?? [];
    if (!built.name) continue;
    if (neutralInfo) {
      built.neutralTier = neutralInfo.tier;
      built.isEnhancement = neutralInfo.kind === 'enhancement';
      built.category = built.isEnhancement ? 'enhancement' : 'neutral';
      built.categoryLabel = built.isEnhancement
        ? `附魔 · ${neutralInfo.tier} 级`
        : `中立 · ${neutralInfo.tier} 级`;
    }
    items.push(built);
  }

  // Deduplicate by slug, preferring entries with a description/cost.
  const itemMap = new Map();
  for (const item of items) {
    const previous = itemMap.get(item.slug);
    if (!previous || (!previous.desc && item.desc) || (!previous.cost && item.cost)) itemMap.set(item.slug, item);
  }
  const finalItems = [...itemMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

  console.log('Building heroes…');
  const heroIndex = [];
  const heroDetails = [];
  const matchupsByHero = new Map();

  for (const meta of heroList) {
    const constantsHero = constantHeroById.get(meta.id);
    if (!constantsHero) continue;
    const slug = heroSlugFromConstant(constantsHero);
    const raw = await readJson(path.join(RAW, 'heroes', `${meta.id}.json`));
    const hero = raw.result?.data?.heroes?.[0];
    if (!hero) continue;

    const stats = heroStatById.get(meta.id) ?? {};
    const pubPick = stats.pub_pick ?? 0;
    const pubWin = stats.pub_win ?? 0;
    const winrate = pubPick ? round((pubWin / pubPick) * 100) : null;

    const trend = (stats.pub_win_trend ?? []).map((wins, index) => {
      const picks = stats.pub_pick_trend?.[index] ?? 0;
      return picks ? round((wins / picks) * 100) : null;
    });
    const validTrend = trend.filter((value) => value !== null);
    const delta = validTrend.length >= 2 ? round(validTrend[validTrend.length - 1] - validTrend[0]) : null;

    const roles = (hero.role_levels ?? [])
      .slice(0, 9)
      .map((level, index) => ({ level, name: ROLE_NAMES[index] }))
      .filter((role) => role.level > 0 && role.name)
      .sort((a, b) => b.level - a.level)
      .map((role) => role.name);

    const attr = ATTR[hero.primary_attr] ?? ATTR[3];
    const positions = POSITIONS[slug];
    if (!positions) throw new Error(`Missing position mapping for ${slug} (${meta.name_loc})`);

    const abilities = (hero.abilities ?? []).map((ability) => buildAbility(ability, constantsAbilities));
    // Ultimate last, innate before ultimate; the rest keep Q/W/E order.
    const order = { active: 0, passive: 0, innate: 1, ultimate: 2 };
    abilities.sort((a, b) => (order[a.type] ?? 0) - (order[b.type] ?? 0));

    const talents = [];
    for (let i = 0; i < (hero.talents ?? []).length; i += 2) {
      const level = [10, 15, 20, 25][Math.floor(i / 2)] ?? 10 + Math.floor(i / 2) * 5;
      talents.push({
        level,
        options: (hero.talents ?? []).slice(i, i + 2).map((talent) => buildTalent(talent, constantsAbilities)),
      });
    }

    const icon = `assets/heroes/icons/${slug}.png`;
    const art = `assets/heroes/art/${slug}.jpg`;
    const card = `assets/heroes/cards/${slug}.png`;

    const indexEntry = {
      id: meta.id,
      slug,
      name: hero.name_loc,
      en: meta.name_english_loc || constantsHero.localized_name,
      aliases: HERO_ALIASES[slug] ?? [],
      attr: attr.key,
      attrLabel: attr.label,
      attack: hero.attack_capability === 2 ? '远程' : '近战',
      roles,
      positions,
      positionLabels: positions.map((position) => POSITION_LABELS[position]),
      positionNames: positions.map((position) => POSITION_NAMES[position]),
      lanes: [...new Set(positions.map((position) => POSITION_LANES[position]))],
      complexity: hero.complexity,
      complexityLabel: ['', '简单', '中等', '复杂'][hero.complexity] ?? '中等',
      icon,
      art,
      card,
      winrate,
      pickrate: null,
      trend,
      delta,
      pubPick,
      pubWin,
      proPick: stats.pro_pick ?? 0,
      proWin: stats.pro_win ?? 0,
      proBan: stats.pro_ban ?? 0,
    };
    heroIndex.push(indexEntry);

    const build = {};
    const popularity = await readJson(path.join(RAW, 'opendota', 'item-popularity', `${meta.id}.json`)).catch(() => null);
    for (const [stage, label] of [
      ['start_game_items', '出门装'],
      ['early_game_items', '前期'],
      ['mid_game_items', '中期'],
      ['late_game_items', '后期'],
    ]) {
      const stageItems = Object.entries(popularity?.[stage] ?? {})
        .map(([itemId, count]) => {
          const item = finalItems.find((candidate) => candidate.id === Number(itemId));
          return item ? { slug: item.slug, name: item.name, img: item.img, cost: item.cost, count } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      const max = Math.max(1, ...stageItems.map((item) => item.count));
      build[stage] = stageItems.map((item) => ({ ...item, heat: round((item.count / max) * 100) }));
      build[`${stage}_label`] = label;
    }

    const matchups = await readJson(path.join(RAW, 'opendota', 'matchups', `${meta.id}.json`)).catch(() => []);
    matchupsByHero.set(meta.id, matchups ?? []);

    const detail = {
      ...indexEntry,
      lore: cleanText(hero.bio_loc ?? ''),
      hype: cleanText(hero.hype_loc ?? ''),
      npe: cleanText(hero.npe_desc_loc ?? ''),
      stats: {
        health: round(hero.max_health, 0),
        healthRegen: round(hero.health_regen, 2),
        mana: round(hero.max_mana, 0),
        manaRegen: round(hero.mana_regen, 2),
        damage: `${round(hero.damage_min, 0)}–${round(hero.damage_max, 0)}`,
        armor: round(hero.armor, 1),
        magicResistance: round(hero.magic_resistance, 0),
        moveSpeed: hero.movement_speed,
        attackRange: hero.attack_range,
        attackRate: round(hero.attack_rate, 2),
        turnRate: round(hero.turn_rate, 2),
        sightDay: hero.sight_range_day,
        sightNight: hero.sight_range_night,
        str: { base: round(hero.str_base, 1), gain: round(hero.str_gain, 1) },
        agi: { base: round(hero.agi_base, 1), gain: round(hero.agi_gain, 1) },
        int: { base: round(hero.int_base, 1), gain: round(hero.int_gain, 1) },
      },
      abilities,
      talents,
      build,
      counters: { weak: [], strong: [] },
    };
    heroDetails.push(detail);
  }

  // Matchups can reference any hero, so resolve them only after the full index exists.
  for (const detail of heroDetails) {
    const rows = (matchupsByHero.get(detail.id) ?? [])
      .filter((row) => row.games_played >= 25)
      .map((row) => {
        const enemy = heroIndex.find((candidate) => candidate.id === row.hero_id);
        if (!enemy) return null;
        return {
          slug: enemy.slug,
          name: enemy.name,
          icon: enemy.icon,
          winrate: round((row.wins / row.games_played) * 100),
          games: row.games_played,
        };
      })
      .filter(Boolean);
    detail.counters = {
      weak: [...rows].sort((a, b) => a.winrate - b.winrate).slice(0, 5),
      strong: [...rows].sort((a, b) => b.winrate - a.winrate).slice(0, 5),
    };
  }

  // Pick rate: hero picks divided by all hero picks (each match has 10 picks).
  const totalPicks = heroIndex.reduce((sum, hero) => sum + hero.pubPick, 0);
  const totalMatches = totalPicks / 10;
  for (const hero of heroIndex) {
    hero.pickrate = totalMatches ? round((hero.pubPick / totalMatches) * 100) : null;
  }
  const detailBySlug = new Map(heroDetails.map((hero) => [hero.slug, hero]));
  for (const hero of heroIndex) {
    const detail = detailBySlug.get(hero.slug);
    if (detail) detail.pickrate = hero.pickrate;
  }

  // Rankings.
  const ranked = [...heroIndex].sort((a, b) => (b.winrate ?? 0) - (a.winrate ?? 0));
  ranked.forEach((hero, index) => {
    hero.winRank = index + 1;
    const detail = detailBySlug.get(hero.slug);
    if (detail) detail.winRank = index + 1;
  });
  const pickRanked = [...heroIndex].sort((a, b) => (b.pickrate ?? 0) - (a.pickrate ?? 0));
  pickRanked.forEach((hero, index) => {
    hero.pickRank = index + 1;
    const detail = detailBySlug.get(hero.slug);
    if (detail) detail.pickRank = index + 1;
  });

  console.log('Linking item popularity to heroes…');
  const itemHeroMap = new Map();
  for (const hero of heroIndex) {
    const popularity = await readJson(path.join(RAW, 'opendota', 'item-popularity', `${hero.id}.json`)).catch(() => null);
    if (!popularity) continue;
    const best = new Map();
    for (const stage of ['start_game_items', 'early_game_items', 'mid_game_items', 'late_game_items']) {
      for (const [itemId, count] of Object.entries(popularity[stage] ?? {})) {
        best.set(Number(itemId), Math.max(best.get(Number(itemId)) ?? 0, count));
      }
    }
    for (const [itemId, count] of best) {
      const item = finalItems.find((candidate) => candidate.id === itemId);
      if (!item) continue;
      if (!itemHeroMap.has(item.slug)) itemHeroMap.set(item.slug, []);
      itemHeroMap.get(item.slug).push({
        slug: hero.slug,
        name: hero.name,
        icon: hero.icon,
        count,
      });
    }
  }
  const finalItemBySlug = new Map(finalItems.map((item) => [item.slug, item]));
  for (const item of finalItems) {
    item.components = item.components
      .filter((component) => finalItemBySlug.has(component.slug))
      .map((component) => ({ ...component, name: finalItemBySlug.get(component.slug).name }));
    item.buildsInto = item.buildsInto
      .filter((targetItem) => finalItemBySlug.has(targetItem.slug))
      .map((targetItem) => ({ ...targetItem, name: finalItemBySlug.get(targetItem.slug).name }));
    const heroes = (itemHeroMap.get(item.slug) ?? []).sort((a, b) => b.count - a.count).slice(0, 6);
    const max = Math.max(1, ...heroes.map((hero) => hero.count));
    item.heroes = heroes.map((hero) => ({ ...hero, heat: round((hero.count / max) * 100) }));
  }

  // Hero details need final item data (build already has it).
  console.log('Parsing 7.41f notes…');
  const article = await fs.readFile(path.join(RAW, 'patch-article.md'), 'utf8');
  const sections = parsePatchArticle(article);
  const officialPatch = await readJson(path.join(RAW, 'patch-zh.json'));

  const itemById = new Map();
  for (const item of finalItems) itemById.set(item.id, item);
  const heroByName = new Map(heroIndex.map((hero) => [hero.name, hero]));
  const heroById = new Map(heroIndex.map((hero) => [hero.id, hero]));
  const itemByName = new Map(finalItems.map((item) => [item.name, item]));

  const patchSections = [];
  for (const section of sections) {
    if (section.type === 'items') {
      const groups = section.groups.map((group, index) => {
        const officialId = officialPatch.items?.[index]?.ability_id;
        const item = itemById.get(officialId) ?? itemByName.get(group.name);
        return {
          name: item?.name ?? group.name,
          slug: item?.slug ?? null,
          notes: group.notes,
        };
      });
      patchSections.push({ type: 'items', title: section.title, groups });
    } else if (section.type === 'neutral') {
      const groups = section.groups.map((group) => ({
        name: group.name,
        groups: group.groups.map((subgroup) => {
          const official = (officialPatch.neutral_items ?? []).find(
            (entry) => entry.title === subgroup.name,
          );
          const item = official?.ability_id ? itemById.get(official.ability_id) : null;
          return {
            name: item?.name ?? subgroup.name,
            slug: item?.slug ?? null,
            notes: subgroup.notes,
          };
        }),
        notes: group.notes,
      }));
      patchSections.push({ type: 'neutral', title: section.title, groups });
    } else if (section.type === 'heroes') {
      const groups = section.groups.map((group) => {
        const hero = heroByName.get(group.name);
        const subgroups = group.groups.map((subgroup) => {
          if (subgroup.name === '技能') {
            return {
              name: '技能',
              abilities: subgroup.abilities.map((ability) => {
                const heroAbility = hero
                  ? detailBySlug.get(hero.slug)?.abilities.find((candidate) => candidate.name === ability.name)
                  : null;
                return {
                  name: ability.name,
                  key: heroAbility?.key ?? null,
                  icon: heroAbility?.icon ?? null,
                  notes: ability.notes,
                };
              }),
              notes: [],
            };
          }
          return { name: subgroup.name, abilities: [], notes: subgroup.notes };
        });
        return {
          name: hero?.name ?? group.name,
          slug: hero?.slug ?? null,
          icon: hero?.icon ?? null,
          notes: group.notes,
          groups: subgroups,
        };
      });
      patchSections.push({ type: 'heroes', title: section.title, groups });
    }
  }

  const patch = {
    version: PATCH,
    title: '7.41f 平衡性更新',
    date: '2026-09-16',
    timestamp: officialPatch.patch_timestamp ?? 1789455600,
    source: 'https://www.dota2.com/newsentry/677383425371407609',
    sourceLabel: 'Dota 2 官方更新',
    sections: patchSections,
    fixes:
      '修复了上路肉山巢穴附近可以藏身于洞穴模型的问题；修复了部分物品在初始出售期内可被标记出售的问题；修复了静谧之鞋拆分后冷却异常、祸乱之源噩梦视野、赏金猎人职业猎人赏金、上古巨神灵体游魂回音重踏、独行德鲁伊熊灵控制权、莉娜暴击天赋交互、裂魂人位面空洞与阿哈利姆神杖/银月之晶及林肯法球交互、伐木机喷火装置小地图显示等问题。',
  };

  const highlights = [
    { title: '赏金猎人', text: '追踪术金钱奖励下调，20/25 级天赋互换，辅助节奏重新洗牌。', slug: 'bounty_hunter', type: 'hero' },
    { title: '树精卫士', text: '基础智力与自然蔽护削弱，活体护甲前期格挡降低。', slug: 'treant', type: 'hero' },
    { title: '噬魂鬼', text: '狂暴冷却延长，神杖感染控制时间缩短，10 级移速天赋削弱。', slug: 'life_stealer', type: 'hero' },
    { title: '陈', text: '力量成长提升，狂热者复活时间随英雄等级缩短。', slug: 'chen', type: 'hero' },
    { title: '狂战斧', text: '砍伐冷却从 4 秒降至 3 秒，刷钱节奏小幅提升。', slug: 'bfury', type: 'item' },
    { title: '撒旦之邪力', text: '吸血从 30% 降至 25%，对非英雄单位吸血同步下调。', slug: 'satanic', type: 'item' },
  ];

  console.log('Writing data…');
  await fs.rm(DATA, { recursive: true, force: true });
  await writeJson(path.join(DATA, 'heroes-index.json'), {
    patch: PATCH,
    updated: UPDATED,
    heroes: heroIndex,
  });
  await writeJson(path.join(DATA, 'items-index.json'), {
    patch: PATCH,
    updated: UPDATED,
    items: finalItems.map(({ desc, lore, notes, values, components, buildsInto, heroes, ...rest }) => rest),
  });
  for (const hero of heroDetails) {
    await writeJson(path.join(DATA, 'heroes', `${hero.slug}.json`), hero);
  }
  for (const item of finalItems) {
    await writeJson(path.join(DATA, 'items', `${item.slug}.json`), item);
  }

  const positionMeta = {};
  for (const position of [1, 2, 3, 4, 5]) {
    positionMeta[position] = {
      label: POSITION_LABELS[position],
      name: POSITION_NAMES[position],
      heroes: heroIndex
        .filter((hero) => hero.positions.includes(position))
        .sort((a, b) => (b.winrate ?? 0) - (a.winrate ?? 0))
        .slice(0, 10),
    };
  }

  const topWin = [...heroIndex]
    .filter((hero) => hero.pubPick >= 20000 && hero.winrate !== null)
    .sort((a, b) => b.winrate - a.winrate)
    .slice(0, 12);
  const topPick = [...heroIndex]
    .filter((hero) => hero.pickrate !== null)
    .sort((a, b) => b.pickrate - a.pickrate)
    .slice(0, 12);

  const meta = {
    patch: PATCH,
    updated: UPDATED,
    totals: {
      heroes: heroIndex.length,
      items: finalItems.length,
      matches: Math.round(totalMatches),
      picks: totalPicks,
    },
    topWin,
    topPick,
    positionMeta,
    highlights,
    patch,
  };
  await writeJson(path.join(DATA, 'meta.json'), meta);
  await writeJson(path.join(DATA, 'patch.json'), patch);

  console.log(
    `Done: ${heroIndex.length} heroes, ${finalItems.length} items, ${Math.round(totalMatches).toLocaleString()} matches.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
