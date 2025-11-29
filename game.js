// --- Data definitions ---
const chassisOptions = [
  { id: 'light', label: 'Light Chassis', hp: 70, speed: 25, energy: 10, desc: 'Fast but fragile frame.' },
  { id: 'balanced', label: 'Balanced Chassis', hp: 90, speed: 18, energy: 8, desc: 'Good all-rounder.' },
  { id: 'heavy', label: 'Heavy Chassis', hp: 120, speed: 10, energy: 5, desc: 'Tank armor, slow mover.' },
];

const weaponOptions = [
  { id: 'spinner', label: 'Vertical Spinner', atk: 24, speed: -2, energy: -4, critChance: 0.15, desc: 'High burst damage, heavy draw.' },
  { id: 'ram', label: 'Ramming Blade', atk: 18, speed: 4, energy: 0, critChance: 0.08, desc: 'Speed-focused kinetic hits.' },
  { id: 'launcher', label: 'Disc Launcher', atk: 20, speed: 0, energy: -2, critChance: 0.12, desc: 'Reliable ranged strikes.' },
];

const wheelsOptions = [
  { id: 'omni', label: 'Omni Wheels', speed: 8, energy: -1, handling: 'Agile', desc: 'Great maneuverability.' },
  { id: 'standard', label: 'Standard Wheels', speed: 4, energy: 0, handling: 'Balanced', desc: 'Stable and predictable.' },
  { id: 'tank', label: 'Tank Treads', speed: -2, energy: 2, handling: 'Stable', desc: 'Slow but excellent traction.' },
];

const batteryOptions = [
  { id: 'light', label: 'Lightweight Battery', energy: 10, hp: -5, desc: 'Great output, limited protection.' },
  { id: 'standard', label: 'Standard Pack', energy: 8, hp: 0, desc: 'Balanced capacity.' },
  { id: 'highcap', label: 'High-Capacity Pack', energy: 14, hp: 5, speed: -2, desc: 'Huge reserves, adds weight.' },
];

// --- State ---
const state = {
  chassis: chassisOptions[1],
  weapon: weaponOptions[0],
  wheels: wheelsOptions[1],
  battery: batteryOptions[1],
  playerStats: null,
  enemyStats: null,
  battleRunning: false,
  currentTurn: null, // 'player' or 'enemy'
  turnCount: 0,
  xp: 0,
  level: 1,
  upgradePoints: 0,
  upgrades: { hp: 0, atk: 0, speed: 0, energy: 0 },
};

const battleButtons = {
  attack: document.getElementById('btn-attack'),
  guard: document.getElementById('btn-guard'),
  special: document.getElementById('btn-special'),
};

const upgradeButtons = {
  hp: document.getElementById('upg-hp'),
  atk: document.getElementById('upg-atk'),
  speed: document.getElementById('upg-speed'),
  energy: document.getElementById('upg-energy'),
};

// --- UI helpers for options ---
function createOptionButtons(containerId, options, groupKey) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;
    btn.className = 'option-btn';
    btn.dataset.id = opt.id;
    btn.title = opt.desc || '';

    btn.addEventListener('click', () => {
      state[groupKey] = opt;
      updateSelectedButtons(containerId, opt.id);
      updateStatsPreview();
    });

    container.appendChild(btn);
  });

  let defaultId;
  if (groupKey === 'chassis') defaultId = state.chassis.id;
  if (groupKey === 'weapon') defaultId = state.weapon.id;
  if (groupKey === 'wheels') defaultId = state.wheels.id;
  if (groupKey === 'battery') defaultId = state.battery.id;
  updateSelectedButtons(containerId, defaultId);
}

function updateSelectedButtons(containerId, selectedId) {
  const container = document.getElementById(containerId);
  [...container.children].forEach(btn => {
    if (btn.dataset.id === selectedId) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// --- Stats ---
function computeStats(chassis, weapon, wheels, battery, applyUpgrades) {
  let hp = (chassis.hp || 0) + (battery.hp || 0);
  let atk = (weapon.atk || 0) + 5;
  let speed = (chassis.speed || 0) + (weapon.speed || 0) + (wheels.speed || 0) + (battery.speed || 0);
  let energy = (chassis.energy || 0) + (weapon.energy || 0) + (wheels.energy || 0) + (battery.energy || 0);

  if (applyUpgrades) {
    const upg = state.upgrades || { hp: 0, atk: 0, speed: 0, energy: 0 };
    hp += upg.hp * 8;
    atk += upg.atk * 2;
    speed += upg.speed * 2;
    energy += upg.energy * 2;
  }

  if (hp < 40) hp = 40;
  if (atk < 8) atk = 8;
  if (speed < 4) speed = 4;
  if (energy < 2) energy = 2;

  const critChance =
    (weapon.critChance || 0.05) +
    (speed > 25 ? 0.03 : 0) +
    (energy > 16 ? 0.02 : 0);
  const dodgeChance =
    speed > 24 ? 0.18 :
    speed > 18 ? 0.12 :
    speed > 12 ? 0.07 :
    0.03;

  return {
    maxHp: hp,
    hp: hp,
    atk: atk,
    speed: speed,
    energy: energy,
    critChance: Math.min(0.35, critChance),
    dodgeChance: Math.min(0.25, dodgeChance),
    chassis,
    weapon,
    wheels,
    battery,
    guardActive: false,
    specialCooldown: 0,
    status: { burn: 0, slow: 0, stun: 0 },
  };
}

function updateStatsPreview() {
  const stats = computeStats(
    state.chassis,
    state.weapon,
    state.wheels,
    state.battery,
    true
  );
  state.playerStats = stats;

  const hpNum = document.getElementById('stat-hp-num');
  const atkNum = document.getElementById('stat-atk-num');
  const spdNum = document.getElementById('stat-speed-num');
  const engNum = document.getElementById('stat-energy-num');
  const hpBar = document.getElementById('stat-hp-bar');
  const atkBar = document.getElementById('stat-atk-bar');
  const spdBar = document.getElementById('stat-speed-bar');
  const engBar = document.getElementById('stat-energy-bar');

  hpNum.textContent = stats.maxHp;
  atkNum.textContent = stats.atk;
  spdNum.textContent = stats.speed;
  engNum.textContent = stats.energy;

  const maxHp = 130 + state.upgrades.hp * 8;
  const maxAtk = 30 + state.upgrades.atk * 2;
  const maxSpeed = 30 + state.upgrades.speed * 2;
  const maxEnergy = 20 + state.upgrades.energy * 2;

  hpBar.style.width = Math.min(100, (stats.maxHp / maxHp) * 100) + '%';
  atkBar.style.width = Math.min(100, (stats.atk / maxAtk) * 100) + '%';
  spdBar.style.width = Math.min(100, (stats.speed / maxSpeed) * 100) + '%';
  engBar.style.width = Math.min(100, (stats.energy / maxEnergy) * 100) + '%';

  updateRobotCardFromStats('player', stats);
}

function updateRobotCardFromStats(prefix, stats) {
  const nameLabel = document.getElementById(prefix + '-name-label');
  const hpLabel = document.getElementById(prefix + '-hp-label');
  const hpBar = document.getElementById(prefix + '-hp-bar');
  const partsRow = document.getElementById(prefix + '-parts');
  const summary = document.getElementById(prefix + '-summary');

  if (!stats) {
    hpLabel.textContent = '0 / 0';
    hpBar.style.width = '0%';
    partsRow.innerHTML = '';
    summary.textContent = '';
    return;
  }

  if (prefix === 'player') {
    const inputName = document.getElementById('robot-name-input').value.trim();
    nameLabel.textContent = inputName || 'Your Robot';
  }

  hpLabel.textContent = `${stats.hp} / ${stats.maxHp}`;
  hpBar.style.width = Math.max(0, (stats.hp / stats.maxHp) * 100) + '%';

  partsRow.innerHTML = '';
  const parts = [
    { label: stats.chassis.label, color: '#22c55e' },
    { label: stats.weapon.label, color: '#eab308' },
    { label: stats.wheels.label, color: '#38bdf8' },
    { label: stats.battery.label, color: '#a855f7' },
  ];
  parts.forEach(p => {
    const pill = document.createElement('div');
    pill.className = 'pill';
    const dot = document.createElement('div');
    dot.className = 'pill-dot';
    dot.style.background = p.color;
    pill.appendChild(dot);
    const span = document.createElement('span');
    span.textContent = p.label;
    pill.appendChild(span);
    partsRow.appendChild(pill);
  });

  const statusTags = [];
  if (stats.status && stats.status.burn > 0) statusTags.push('BURN');
  if (stats.status && stats.status.slow > 0) statusTags.push('SLOW');
  if (stats.status && stats.status.stun > 0) statusTags.push('STUN');

  const statusText = statusTags.length ? ` • Status: ${statusTags.join(', ')}` : '';
  summary.textContent =
    `ATK ${stats.atk} • SPD ${stats.speed} • ENG ${stats.energy} • ` +
    `CRIT ${(stats.critChance * 100).toFixed(0)}% • DODGE ${(stats.dodgeChance * 100).toFixed(0)}%` +
    statusText;
}

// --- XP / Upgrades UI ---
function xpThresholdForLevel(level) {
  return level * 4; // simple curve: 4, 8, 12, ...
}

function updateProgressUI() {
  const xpLabel = document.getElementById('xp-label');
  const upgLabel = document.getElementById('upgrade-points-label');
  const threshold = xpThresholdForLevel(state.level);
  xpLabel.textContent = `Level ${state.level} • XP ${state.xp} / ${threshold}`;
  upgLabel.textContent = `Upgrade points: ${state.upgradePoints}`;

  const canUpgrade = state.upgradePoints > 0;
  Object.values(upgradeButtons).forEach(btn => {
    btn.disabled = !canUpgrade;
  });
}

function applyUpgrade(statKey) {
  if (state.upgradePoints <= 0) return;
  state.upgradePoints -= 1;
  state.upgrades[statKey] = (state.upgrades[statKey] || 0) + 1;
  updateProgressUI();
  updateStatsPreview();
}

// --- Logging ---
const logEl = document.getElementById('battle-log');
const turnIndicatorEl = document.getElementById('turn-indicator');

function clearLog() {
  logEl.innerHTML = '';
}

function appendLog(text, type) {
  const line = document.createElement('div');
  line.className = 'battle-log-line';
  const span = document.createElement('span');
  if (type === 'turn') span.className = 'log-turn';
  if (type === 'player') span.className = 'log-player';
  if (type === 'enemy') span.className = 'log-enemy';
  if (type === 'system') span.className = 'log-system';
  if (type === 'crit') span.className = 'log-crit';
  if (type === 'miss') span.className = 'log-miss';
  span.textContent = text;
  line.appendChild(span);
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

// --- Enemy generation ---
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEnemyStats() {
  const ch = randomChoice(chassisOptions);
  const weap = randomChoice(weaponOptions);
  const wh = randomChoice(wheelsOptions);
  const bat = randomChoice(batteryOptions);

  let stats = computeStats(ch, weap, wh, bat, false);

  const hpDelta = Math.random() * 20 - 10;
  stats.maxHp = Math.round(stats.maxHp + hpDelta);
  stats.hp = stats.maxHp;
  const atkDelta = Math.random() * 4 - 2;
  stats.atk = Math.round(stats.atk + atkDelta);

  const archetypes = ['Mk-II', 'Prototype', 'ArenaBot', 'Rival-X', 'Nemesis'];
  const baseNames = ['Shard', 'Thunder', 'Torque', 'Echo', 'Nova', 'Hydra', 'Aegis', 'Pulse'];
  const name = `${randomChoice(baseNames)} ${randomChoice(archetypes)}`;
  document.getElementById('enemy-name-label').textContent = name;

  return stats;
}

// --- Turn management ---
function setActionButtonsEnabled(enabled) {
  battleButtons.attack.disabled = !enabled;
  battleButtons.guard.disabled = !enabled;
  battleButtons.special.disabled =
    !enabled || (state.playerStats && state.playerStats.specialCooldown > 0);
}

function updateTurnIndicator() {
  if (!state.battleRunning) {
    turnIndicatorEl.textContent = 'Press "Start Battle" to begin.';
    return;
  }
  if (state.currentTurn === 'player') {
    const playerName = document.getElementById('player-name-label').textContent;
    turnIndicatorEl.textContent = `Your turn – choose an action for ${playerName}.`;
  } else {
    const enemyName = document.getElementById('enemy-name-label').textContent;
    turnIndicatorEl.textContent = `Enemy turn – ${enemyName} is thinking...`;
  }
}

function checkBattleEnd() {
  const player = state.playerStats;
  const enemy = state.enemyStats;
  if (!player || !enemy) return false;

  if (player.hp <= 0 && enemy.hp <= 0) {
    endBattle('draw');
    return true;
  } else if (enemy.hp <= 0) {
    endBattle('player');
    return true;
  } else if (player.hp <= 0) {
    endBattle('enemy');
    return true;
  }
  return false;
}

function applyStartOfTurnStatus(entity, who) {
  const name =
    who === 'player'
      ? document.getElementById('player-name-label').textContent
      : document.getElementById('enemy-name-label').textContent;

  // Burn damage
  if (entity.status.burn > 0) {
    const burnDmg = Math.max(3, Math.round(entity.maxHp * 0.05));
    entity.hp -= burnDmg;
    if (entity.hp < 0) entity.hp = 0;
    appendLog(`${name} takes ${burnDmg} burn damage!`, 'system');
    entity.status.burn -= 1;
  }

  // Slow duration tick
  if (entity.status.slow > 0) {
    entity.status.slow -= 1;
    if (entity.status.slow === 0) {
      appendLog(`${name} shakes off the slow effect.`, 'system');
    }
  }

  if (checkBattleEnd()) return true;

  // Stun check
  if (entity.status.stun > 0) {
    appendLog(`${name} is stunned and misses their turn!`, 'system');
    entity.status.stun -= 1;
    return true; // skip turn
  }

  return false;
}

function beginPlayerTurn() {
  if (!state.battleRunning) return;
  state.currentTurn = 'player';
  updateTurnIndicator();

  const player = state.playerStats;
  const enemy = state.enemyStats;

  applyStartOfTurnStatus(player, 'player');
  updateRobotCardFromStats('player', player);
  updateRobotCardFromStats('enemy', enemy);
  if (checkBattleEnd()) return;

  if (player.status.stun > 0) {
    setActionButtonsEnabled(false);
    state.turnCount += 1;
    appendLog(`-- Turn ${state.turnCount} --`, 'turn');
    setTimeout(beginEnemyTurn, 750);
    return;
  }

  setActionButtonsEnabled(true);
}

function beginEnemyTurn() {
  if (!state.battleRunning) return;
  state.currentTurn = 'enemy';
  updateTurnIndicator();
  setActionButtonsEnabled(false);

  const player = state.playerStats;
  const enemy = state.enemyStats;

  applyStartOfTurnStatus(enemy, 'enemy');
  updateRobotCardFromStats('player', player);
  updateRobotCardFromStats('enemy', enemy);
  if (checkBattleEnd()) return;

  if (enemy.status.stun > 0) {
    state.turnCount += 1;
    appendLog(`-- Turn ${state.turnCount} --`, 'turn');
    setTimeout(beginPlayerTurn, 750);
    return;
  }

  setTimeout(enemyTurn, 650);
}

// --- Battle control ---
function startBattle() {
  if (state.battleRunning) return;
  if (!state.playerStats) updateStatsPreview();

  const player = JSON.parse(JSON.stringify(state.playerStats));
  const enemy = generateEnemyStats();

  player.guardActive = false;
  player.specialCooldown = 0;
  player.status = { burn: 0, slow: 0, stun: 0 };
  enemy.guardActive = false;
  enemy.specialCooldown = 1 + Math.floor(Math.random() * 2);
  enemy.status = { burn: 0, slow: 0, stun: 0 };

  state.playerStats = player;
  state.enemyStats = enemy;
  state.battleRunning = true;
  state.currentTurn = 'player';
  state.turnCount = 1;

  updateRobotCardFromStats('player', player);
  updateRobotCardFromStats('enemy', enemy);

  clearLog();
  const playerName = document.getElementById('player-name-label').textContent;
  const enemyName = document.getElementById('enemy-name-label').textContent;
  appendLog('Battle start! Robots roll into the arena...', 'system');
  appendLog(`${playerName} vs ${enemyName}`, 'system');
  appendLog('-- Turn 1 --', 'turn');

  document.getElementById('start-battle-btn').disabled = true;
  setActionButtonsEnabled(false);
  beginPlayerTurn();
}

function endBattle(winner) {
  if (!state.battleRunning) return;
  state.battleRunning = false;
  setActionButtonsEnabled(false);
  document.getElementById('start-battle-btn').disabled = false;

  const player = state.playerStats;
  const enemy = state.enemyStats;
  const playerName = document.getElementById('player-name-label').textContent;
  const enemyName = document.getElementById('enemy-name-label').textContent;

  if (winner === 'draw') {
    appendLog("Both robots are immobilized! It's a draw!", 'system');
    turnIndicatorEl.textContent = 'Draw game – both bots are out!';
  } else if (winner === 'player') {
    appendLog(`${playerName} wins the match!`, 'system');
    turnIndicatorEl.textContent = `${playerName} wins!`;
  } else if (winner === 'enemy') {
    appendLog(`${enemyName} claims victory this time.`, 'system');
    turnIndicatorEl.textContent = `${enemyName} wins.`;
  }

  // XP rewards
  let gained = 0;
  if (winner === 'player') gained = 3;
  else if (winner === 'enemy') gained = 1;
  else if (winner === 'draw') gained = 2;
  state.xp += gained;
  appendLog(`You earned ${gained} XP.`, 'system');

  // Level up logic
  let leveledUp = false;
  while (state.xp >= xpThresholdForLevel(state.level)) {
    state.xp -= xpThresholdForLevel(state.level);
    state.level += 1;
    state.upgradePoints += 1;
    leveledUp = true;
  }

  updateProgressUI();

  if (leveledUp) {
    appendLog(
      `Level up! You reached Level ${state.level} and gained an upgrade point!`,
      'system'
    );
  }

  // ✅ Reset your health (and full stats) for the next match
  updateStatsPreview();               // recomputes state.playerStats with full HP
  updateRobotCardFromStats('player', state.playerStats);
}

// --- Actions ---
function computeDamage(attacker, isSpecial) {
  // Slow reduces effective speed a bit
  const speedPenalty = attacker.status && attacker.status.slow > 0 ? 4 : 0;
  let effSpeed = attacker.speed - speedPenalty;
  if (effSpeed < 4) effSpeed = 4;

  let dmg = attacker.atk + Math.round((effSpeed - 15) / 4);
  if (dmg < 6) dmg = 6;
  if (isSpecial) {
    dmg = Math.round(dmg * 1.5);
  }
  let isCrit = false;
  if (Math.random() < attacker.critChance) {
    dmg = Math.round(dmg * 1.7);
    isCrit = true;
  }
  return { dmg, isCrit };
}

function resolveAttack(attacker, defender, who, isSpecial) {
  const attackerName =
    who === 'player'
      ? document.getElementById('player-name-label').textContent
      : document.getElementById('enemy-name-label').textContent;
  const defenderName =
    who === 'player'
      ? document.getElementById('enemy-name-label').textContent
      : document.getElementById('player-name-label').textContent;

  // Dodge (slow reduces dodge effectiveness)
  let effectiveDodge = defender.dodgeChance;
  if (defender.status && defender.status.slow > 0) {
    effectiveDodge *= 0.4;
  }
  if (!defender.guardActive && Math.random() < effectiveDodge) {
    appendLog(`${defenderName} dodges the attack!`, 'miss');
    return;
  }

  const { dmg: baseDmg, isCrit } = computeDamage(attacker, isSpecial);
  let dmg = baseDmg;

  if (defender.guardActive) {
    dmg = Math.round(dmg * 0.6);
    defender.guardActive = false;
    appendLog(`${defenderName} braces and reduces the damage!`, 'system');
  }

  defender.hp -= dmg;
  if (defender.hp < 0) defender.hp = 0;

  const typeLabel = isSpecial ? 'SPECIAL' : 'attack';
  if (who === 'player') {
    appendLog(
      `${attackerName} uses ${typeLabel} on ${defenderName} for ${dmg} dmg.`,
      'player'
    );
  } else {
    appendLog(
      `${attackerName} uses ${typeLabel} on ${defenderName} for ${dmg} dmg.`,
      'enemy'
    );
  }
  if (isCrit) {
    appendLog('Critical impact! Massive damage dealt!', 'crit');
  }

  // Weapon-specific special effects
  if (isSpecial) {
    if (attacker.weapon.id === 'spinner') {
      // Overdrive Spin: huge hit, chance to self-stun
      if (Math.random() < 0.25) {
        attacker.status.stun = Math.max(attacker.status.stun, 1);
        appendLog(
          `${attackerName}'s overdrive recoils, leaving it stunned!`,
          'system'
        );
      }
    } else if (attacker.weapon.id === 'ram') {
      // Full-Speed Ram: chance to stun defender
      if (Math.random() < 0.5) {
        defender.status.stun = Math.max(defender.status.stun, 1);
        appendLog(
          `${defenderName} is stunned by the massive ram!`,
          'system'
        );
      }
    } else if (attacker.weapon.id === 'launcher') {
      // Explosive Volley: apply burn over time
      defender.status.burn = Math.max(defender.status.burn, 3);
      appendLog(
        `${defenderName} is set on fire and will keep taking burn damage!`,
        'system'
      );
    }

    // Generic "slow" chance on any devastating special
    if (!defender.status.slow && Math.random() < 0.4) {
      defender.status.slow = 2;
      appendLog(
        `${defenderName} is slowed and moves sluggishly!`,
        'system'
      );
    }
  }
}

function playerAction(actionType) {
  if (!state.battleRunning || state.currentTurn !== 'player') return;

  const player = state.playerStats;
  const enemy = state.enemyStats;

  if (actionType === 'attack') {
    resolveAttack(player, enemy, 'player', false);
  } else if (actionType === 'guard') {
    player.guardActive = true;
    appendLog('You raise your guard, ready to absorb the next hit.', 'player');
  } else if (actionType === 'special') {
    if (player.specialCooldown > 0) {
      appendLog('Special not ready yet!', 'system');
      return;
    }
    resolveAttack(player, enemy, 'player', true);
    player.specialCooldown = 2; // wait 2 future player turns
  }

  updateRobotCardFromStats('player', player);
  updateRobotCardFromStats('enemy', enemy);

  if (checkBattleEnd()) return;

  // End of player's turn: tick cooldown if not just used
  if (player.specialCooldown > 0 && actionType !== 'special') {
    player.specialCooldown -= 1;
  }

  state.turnCount += 1;
  appendLog(`-- Turn ${state.turnCount} --`, 'turn');
  setActionButtonsEnabled(false);
  beginEnemyTurn();
}

function enemyTurn() {
  if (!state.battleRunning || state.currentTurn !== 'enemy') return;
  const player = state.playerStats;
  const enemy = state.enemyStats;

  let action;
  if (enemy.specialCooldown === 0 && Math.random() < 0.5) {
    action = 'special';
  } else if (enemy.hp < enemy.maxHp * 0.35 && Math.random() < 0.4) {
    action = 'guard';
  } else {
    action = 'attack';
  }

  if (action === 'attack') {
    resolveAttack(enemy, player, 'enemy', false);
  } else if (action === 'guard') {
    enemy.guardActive = true;
    appendLog(
      'Enemy raises its guard, preparing to absorb damage.',
      'enemy'
    );
  } else if (action === 'special') {
    resolveAttack(enemy, player, 'enemy', true);
    enemy.specialCooldown = 2;
  }

  updateRobotCardFromStats('player', player);
  updateRobotCardFromStats('enemy', enemy);

  if (checkBattleEnd()) return;

  if (enemy.specialCooldown > 0 && action !== 'special') {
    enemy.specialCooldown -= 1;
  }

  state.turnCount += 1;
  appendLog(`-- Turn ${state.turnCount} --`, 'turn');
  beginPlayerTurn();
}

// --- Events ---
document
  .getElementById('start-battle-btn')
  .addEventListener('click', startBattle);

document
  .getElementById('robot-name-input')
  .addEventListener('input', () => {
    if (state.playerStats) {
      updateRobotCardFromStats('player', state.playerStats);
    }
  });

battleButtons.attack.addEventListener('click', () => playerAction('attack'));
battleButtons.guard.addEventListener('click', () => playerAction('guard'));
battleButtons.special.addEventListener('click', () => playerAction('special'));

upgradeButtons.hp.addEventListener('click', () => applyUpgrade('hp'));
upgradeButtons.atk.addEventListener('click', () => applyUpgrade('atk'));
upgradeButtons.speed.addEventListener('click', () => applyUpgrade('speed'));
upgradeButtons.energy.addEventListener('click', () => applyUpgrade('energy'));

// --- Init ---
createOptionButtons('chassis-options', chassisOptions, 'chassis');
createOptionButtons('weapon-options', weaponOptions, 'weapon');
createOptionButtons('wheels-options', wheelsOptions, 'wheels');
createOptionButtons('battery-options', batteryOptions, 'battery');
updateStatsPreview();
setActionButtonsEnabled(false);
updateProgressUI();
