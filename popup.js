document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('wheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const spinBtn = document.getElementById('spin-btn');
  const tickerTray = document.getElementById('ticker-tray');
  const coinLabel = document.getElementById('coins-val');
  const gemLabel = document.getElementById('gems-val');
  const rollsLabel = document.getElementById('rolls-val');
  const cycleStatus = document.getElementById('cycle-status');
  const luckLevelLabel = document.getElementById('luck-level');
  const payoutLevelLabel = document.getElementById('payout-level');
  const buyLuckButton = document.getElementById('buy-luck');
  const buyPayoutButton = document.getElementById('buy-payout');
  const buyEternalButton = document.getElementById('buy-eternal');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const potionTiers = ['basic', 'uncommon', 'rare', 'mythic', 'legendary', 'divine', 'secret', 'eternal'];
  const marketTiers = ['uncommon', 'rare', 'mythic', 'legendary', 'divine'];
  const dailyMarketDefaults = { uncommon: 3, rare: 2, mythic: 2, legendary: 1, divine: 1 };
  const sellValues = { basic: 2, uncommon: 8, rare: 20, mythic: 50, legendary: 110, divine: 300, secret: 250, eternal: 500 };
  const lootKeys = ['materialChest', 'gemCluster', 'divineRoyalty'];
  const materialKeys = ['timber', 'copperOre', 'coal', 'bronzeIngot', 'silverOre', 'silverIngot', 'crystalShard', 'goldOre'];
  const wheelMilestones = [
    { name: 'Broken Wooden Wheel', recipe: null },
    { name: 'Bronze Wheel', recipe: { timber: 27, copperOre: 18, coal: 12 }, label: '27 Timber, 18 Copper Ore, 12 Coal', bonus: 0.08 },
    { name: 'Silver Wheel', recipe: { bronzeIngot: 36, silverOre: 27, crystalShard: 18 }, label: '36 Bronze Ingots, 27 Silver Ore, 18 Crystal Shards', bonus: 0.16 },
    { name: 'Gold Wheel', recipe: { silverIngot: 48, goldOre: 36, crystalShard: 27 }, label: '48 Silver Ingots, 36 Gold Ore, 27 Crystal Shards', bonus: 0.26 }
  ];
  const autoSellValues = { smallCoins: 1, coinPouch: 5, rareChest: 12, gemCluster: 4, divineRoyalty: 100 };
  const materialNames = {
    timber: 'Timber',
    copperOre: 'Copper Ore',
    coal: 'Coal',
    bronzeIngot: 'Bronze Ingot',
    silverOre: 'Silver Ore',
    silverIngot: 'Silver Ingot',
    crystalShard: 'Crystal Shard',
    goldOre: 'Gold Ore'
  };

  const defaultState = {
    coins: 50,
    gems: 0,
    rolls: 0,
    cycle: 1,
    luckLevel: 0,
    payoutLevel: 0,
    eternalStock: 1,
    marketDay: '',
    marketStock: structuredClone(dailyMarketDefaults),
    eternalBlessing: false,
    refreshWheelType: 'normal',
    crystalRefreshUsed: false,
    wheelTier: 0,
    inventory: { basic: 1, uncommon: 0, rare: 0, mythic: 0, legendary: 0, divine: 0, secret: 0, eternal: 0 },
    loot: { smallCoins: 0, coinPouch: 0, rareChest: 0, materialChest: 0, gemCluster: 0, divineRoyalty: 0 },
    materials: { timber: 0, copperOre: 0, coal: 0, bronzeIngot: 0, silverOre: 0, silverIngot: 0, crystalShard: 0, goldOre: 0 },
    autoSell: { smallCoins: false, coinPouch: false, rareChest: false, gemCluster: false, divineRoyalty: false },
    activePotion: null
  };
  let runtimeState = structuredClone(defaultState);

  const basePrizes = [
    { name: 'Small Coins', lootKey: 'smallCoins', rarity: 'common', weight: 50, type: 'coins', val: 4, materials: { timber: 1 }, c1: '#fff0a8', c2: '#e9b936' },
    { name: 'Coin Reward', rarity: 'uncommon', weight: 24, type: 'coins', val: 20, materials: { copperOre: 1, coal: 1 }, c1: '#ffe27a', c2: '#d68b18' },
    { name: 'Bronze Ingot', rarity: 'uncommon', weight: 7, type: 'material', materials: { bronzeIngot: 1 }, c1: '#e9b07b', c2: '#8a4d25' },
    { name: 'Silver Ingot', rarity: 'rare', weight: 5, type: 'material', materials: { silverIngot: 1 }, c1: '#e8f2ff', c2: '#7894ad' },
    { name: 'Material Chest', rarity: 'rare', lootKey: 'materialChest', weight: 5, type: 'materialChest', c1: '#d8c2a4', c2: '#8b5e34' },
    { name: 'Gem Cluster', rarity: 'rare', weight: 14, type: 'gems', val: 2, materials: { crystalShard: 1 }, c1: '#f1c7ff', c2: '#a342d4' },
    { name: 'Divine Royalty', rarity: 'divine', weight: 1, type: 'jackpot', val: 0, materials: { goldOre: 2 }, c1: '#fff8c7', c2: '#e19a00' },
    { name: 'Basic Potion', rarity: 'common', weight: 8, type: 'potion', tier: 'basic', c1: '#e2e4e8', c2: '#777b89' },
    { name: 'Uncommon Potion', rarity: 'uncommon', weight: 7, type: 'potion', tier: 'uncommon', c1: '#d8ffd9', c2: '#2ecc71' },
    { name: 'Rare Potion', rarity: 'rare', weight: 4, type: 'potion', tier: 'rare', c1: '#d7f2ff', c2: '#0088ff' },
    { name: 'Mythic Potion', rarity: 'mythic', weight: 2, type: 'potion', tier: 'mythic', c1: '#f0d9ff', c2: '#a832ff' },
    { name: 'Legendary Potion', rarity: 'legendary', weight: 1, type: 'potion', tier: 'legendary', c1: '#fff3b0', c2: '#e19a00' },
    { name: 'Divine Potion', rarity: 'divine', weight: 0.5, type: 'potion', tier: 'divine', c1: '#dfffff', c2: '#00a9c7' },
    { name: 'Eternal Potion', rarity: 'eternal', weight: 0.1, type: 'potion', tier: 'eternal', c1: '#eaffff', c2: '#00b9d4' }
  ];

  let wheelPrizes = [];
  let currentWheelAngle = 0;
  let isMotionActive = false;

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedPanel = document.getElementById(button.getAttribute('aria-controls'));
      tabButtons.forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      tabPanels.forEach(panel => {
        panel.hidden = panel !== selectedPanel;
      });
    });
  });

  function refreshWheelPrizes() {
    const refreshRoll = Math.random();
    if (!runtimeState.crystalRefreshUsed && refreshRoll < 0.0005) {
      runtimeState.refreshWheelType = 'crystal';
      runtimeState.crystalRefreshUsed = true;
    } else {
      runtimeState.refreshWheelType = refreshRoll < 0.0025 ? 'gold' : refreshRoll < 0.01 ? 'silver' : 'normal';
    }
    const refreshTier = { normal: 0, silver: 2, gold: 3, crystal: 4 }[runtimeState.refreshWheelType] || 0;
    if (refreshTier <= runtimeState.wheelTier) {
      runtimeState.refreshWheelType = 'normal';
    }
    const permanentPrizes = basePrizes.filter(prize => prize.type !== 'potion');
    const potionPrizes = basePrizes.filter(prize => prize.type === 'potion');
    let selectedPrizes = [...permanentPrizes];
    const potionSpawnChance = {
      basic: 0.2,
      uncommon: 0.14,
      rare: 0.09,
      mythic: 0.05,
      legendary: 0.02,
      divine: 0.01,
      eternal: 0.001
    };
    const eternalPotion = potionPrizes.find(prize => prize.tier === 'eternal');
    const availablePotion = Math.random() < potionSpawnChance.eternal
      ? eternalPotion
      : potionPrizes.filter(prize => prize.tier !== 'eternal').find(prize => Math.random() < potionSpawnChance[prize.tier]);
    if (availablePotion) {
      selectedPrizes.push(availablePotion);
      if (availablePotion.tier === 'eternal') {
        tickerTray.textContent = 'ETERNAL POTION SPAWNED ON THE WHEEL!';
      }
    } else {
      selectedPrizes.push({ name: 'Empty', weight: 8, type: 'empty', c1: '#9b8f85', c2: '#514943' });
    }

    const regularPrizes = selectedPrizes.filter(prize => prize.type !== 'material' && prize.type !== 'potion');
    const specialPrizes = selectedPrizes.filter(prize => prize.type === 'material' || prize.type === 'potion');
    const shuffledRegularPrizes = [...regularPrizes].sort(() => Math.random() - 0.5);
    const shuffledSpecialPrizes = [...specialPrizes].sort(() => Math.random() - 0.5);
    wheelPrizes = [];
    shuffledRegularPrizes.forEach((prize, index) => {
      wheelPrizes.push(prize);
      if (shuffledSpecialPrizes[index]) wheelPrizes.push(shuffledSpecialPrizes[index]);
    });
    while (wheelPrizes.length < 10) {
      wheelPrizes.push({ name: 'Empty', weight: 8, type: 'empty', c1: '#9b8f85', c2: '#514943' });
    }
    wheelPrizes = wheelPrizes.slice(0, 10);
  }

  refreshWheelPrizes();
  paintWheelMatrix();

  chrome.storage.local.get(['arcaneMasterStateV2'], (store) => {
    if (store.arcaneMasterStateV2) {
      const savedState = store.arcaneMasterStateV2;
      runtimeState = {
        ...defaultState,
        ...savedState,
        inventory: { ...defaultState.inventory, ...(savedState.inventory || {}) },
        loot: { ...defaultState.loot, ...(savedState.loot || {}) },
        marketStock: { ...defaultState.marketStock, ...(savedState.marketStock || {}) },
        materials: { ...defaultState.materials, ...(savedState.materials || {}) },
        autoSell: { ...defaultState.autoSell, ...(savedState.autoSell || {}) }
      };
    }
    restockMarketIfNeeded();
    refreshDisplayHUD();
    refreshWheelPrizes();
    paintWheelMatrix();
    updateCooldownDisplay();
  });

  function saveStateToLocalDisk() {
    chrome.storage.local.set({ arcaneMasterStateV2: runtimeState });
  }

  function refreshDisplayHUD() {
    coinLabel.textContent = runtimeState.coins;
    gemLabel.textContent = runtimeState.gems;
    rollsLabel.textContent = `${runtimeState.rolls} / 10`;
    cycleStatus.textContent = runtimeState.cooldownUntil > Date.now() ? `Wheel cooldown · ${Math.ceil((runtimeState.cooldownUntil - Date.now()) / 1000)}s` : (runtimeState.cycle % 2 === 1 ? `Lucky wheel · Cycle ${runtimeState.cycle}` : `Risky wheel · Cycle ${runtimeState.cycle}`);
    luckLevelLabel.textContent = runtimeState.luckLevel;
    payoutLevelLabel.textContent = runtimeState.payoutLevel;
    buyLuckButton.textContent = `Buy ${100 + runtimeState.luckLevel * 150} coins`;
    buyPayoutButton.textContent = `Buy ${150 + runtimeState.payoutLevel * 200} coins`;
    buyEternalButton.textContent = runtimeState.eternalStock > 0 ? '1,000 gems' : 'Sold out today';
    buyEternalButton.disabled = runtimeState.eternalStock <= 0;
    potionTiers.forEach(tier => {
      const quantity = runtimeState.inventory[tier] || 0;
      document.getElementById(`qty-${tier}`).textContent = `${quantity} owned`;
      const row = document.getElementById(`row-${tier}`);
      const button = document.getElementById(`btn-${tier}`);
      row.classList.toggle('active', runtimeState.activePotion === tier || (tier === 'eternal' && runtimeState.eternalBlessing));
      button.textContent = tier === 'eternal' && runtimeState.eternalBlessing ? 'Blessed' : (runtimeState.activePotion === tier ? 'Active' : 'Use');
      button.disabled = tier === 'eternal' && runtimeState.eternalBlessing;
    });
    marketTiers.forEach(tier => {
      const button = document.querySelector(`[data-potion="${tier}"]`);
      if (!button) return;
      const stock = runtimeState.marketStock[tier] || 0;
      button.textContent = stock > 0 ? `${button.dataset.cost} gems · ${stock} left` : 'Sold out today';
      button.disabled = stock <= 0;
    });
    lootKeys.forEach(key => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
      document.getElementById(`loot-${key}-label`).textContent = `${label} × ${runtimeState.loot[key] || 0}`;
    });
    const currentWheel = wheelMilestones[runtimeState.wheelTier] || wheelMilestones[0];
    document.getElementById('wheel-tier').textContent = runtimeState.wheelTier;
    document.getElementById('wheel-name').textContent = currentWheel.name;
    const nextWheel = wheelMilestones[runtimeState.wheelTier + 1];
    const upgradeWheelButton = document.getElementById('upgrade-wheel');
    upgradeWheelButton.disabled = !nextWheel;
    upgradeWheelButton.textContent = nextWheel ? `Build ${nextWheel.name}` : 'Gold Wheel complete';
    document.getElementById('wheel-recipe').textContent = nextWheel ? `Next: ${nextWheel.name} · ${nextWheel.label}` : 'Final milestone reached.';
    materialKeys.forEach(key => {
      document.getElementById(`mat-${key}`).textContent = runtimeState.materials[key] || 0;
    });
    document.querySelectorAll('[data-auto-sell]').forEach(input => {
      input.checked = Boolean(runtimeState.autoSell[input.dataset.autoSell]);
    });
  }

  function restockMarketIfNeeded() {
    const today = new Date().toISOString().slice(0, 10);
    if (runtimeState.marketDay === today) return;
    runtimeState.marketDay = today;
    runtimeState.marketStock = structuredClone(dailyMarketDefaults);
    runtimeState.eternalStock = 1;
    saveStateToLocalDisk();
  }

  function updateCooldownDisplay() {
    const remaining = (runtimeState.cooldownUntil || 0) - Date.now();
    spinBtn.disabled = isMotionActive || remaining > 0;
    if (remaining > 0) {
      cycleStatus.textContent = `Wheel cooldown · ${Math.ceil(remaining / 1000)}s`;
      tickerTray.textContent = 'The wheel is cooling down after ten spins.';
    } else if (!isMotionActive) {
      refreshDisplayHUD();
    }
  }

  function paintWheelMatrix() {
    if (!canvas || !ctx) return;
    if (!wheelPrizes.length) refreshWheelPrizes();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const radius = canvas.width / 2;
    const sectorRadians = (2 * Math.PI) / wheelPrizes.length;
    const wheelStyles = [
      { inner: '#d2a66f', outer: '#81502d', rim: '#9b6238', outline: '#4e2d1d', center: '#f0c58a', shadow: 'rgba(107, 61, 28, 0.38)', texture: 'wood' },
      { inner: '#e8a85c', outer: '#8b451f', rim: '#a85f2a', outline: '#542815', center: '#ffd08a', shadow: 'rgba(139, 69, 31, 0.4)', texture: 'bronze' },
      { inner: '#e7f6ff', outer: '#7b9caf', rim: '#a9c7d8', outline: '#425d6d', center: '#f5fbff', shadow: 'rgba(91, 126, 148, 0.4)', texture: 'silver' },
      { inner: '#fff0a8', outer: '#d18a00', rim: '#f0b928', outline: '#765000', center: '#fff8cf', shadow: 'rgba(197, 135, 0, 0.4)', texture: 'gold' }
    ];
    const specialStyles = {
      silver: { inner: '#f7fdff', outer: '#7b9caf', rim: '#d9f2ff', outline: '#425d6d', center: '#ffffff', shadow: 'rgba(91, 126, 148, 0.55)', texture: 'silver' },
      gold: { inner: '#fff8b0', outer: '#d18a00', rim: '#ffe36e', outline: '#765000', center: '#fffdf0', shadow: 'rgba(197, 135, 0, 0.6)', texture: 'gold' },
      crystal: { inner: '#f4ffff', outer: '#43d7e7', rim: '#ffffff', outline: '#08798c', center: '#ffffff', shadow: 'rgba(0, 185, 212, 0.7)', texture: 'crystal' },
      degraded: { inner: '#c8b9ac', outer: '#62554c', rim: '#8f7b6d', outline: '#3c3029', center: '#d8c9bc', shadow: 'rgba(81, 68, 58, 0.45)', texture: 'wood' }
    };
    const rarityStyles = {
      common: { inner: '#fff3d1', mid: '#c39a62', outer: '#694626', outline: '#392516' },
      uncommon: { inner: '#efffc9', mid: '#8bc957', outer: '#2d7137', outline: '#174524' },
      rare: { inner: '#e7f5ff', mid: '#62a9ed', outer: '#1f4f9e', outline: '#102b63' },
      mythic: { inner: '#f8e7ff', mid: '#c06be8', outer: '#6b238f', outline: '#37104c' },
      legendary: { inner: '#fff8c7', mid: '#f0b52f', outer: '#a7520d', outline: '#572706' },
      divine: { inner: '#e0ffff', mid: '#42d1cc', outer: '#087487', outline: '#043e4b' },
      eternal: { inner: '#ffffff', mid: '#88f1f4', outer: '#159bb8', outline: '#034c68' },
      empty: { inner: '#e1d5ca', mid: '#9b8879', outer: '#55463d', outline: '#30251f' }
    };
    const tierStyle = specialStyles[runtimeState.refreshWheelType] || wheelStyles[runtimeState.wheelTier] || wheelStyles[0];
    canvas.classList.toggle('rare-refresh', runtimeState.refreshWheelType !== 'normal');
    canvas.style.borderColor = runtimeState.eternalBlessing ? '#00b9d4' : tierStyle.rim;
    canvas.style.boxShadow = `0 8px 24px ${runtimeState.eternalBlessing ? 'rgba(0, 185, 212, 0.35)' : tierStyle.shadow}`;

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(currentWheelAngle);

    for (let i = 0; i < wheelPrizes.length; i++) {
      const item = wheelPrizes[i];
      const rarityStyle = rarityStyles[item.rarity || item.type] || rarityStyles.common;
      const eternalColors = ['#dffcff', '#78dce8', '#f8ffff', '#75bfd8'];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 2, i * sectorRadians, (i + 1) * sectorRadians);
      
      let radialGlowGradient = ctx.createRadialGradient(0, 0, 6, 0, 0, radius);
      radialGlowGradient.addColorStop(0, runtimeState.eternalBlessing ? eternalColors[(i + 1) % eternalColors.length] : rarityStyle.inner);
      radialGlowGradient.addColorStop(0.52, runtimeState.eternalBlessing ? '#78dce8' : rarityStyle.mid);
      radialGlowGradient.addColorStop(1, runtimeState.eternalBlessing ? eternalColors[i % eternalColors.length] : rarityStyle.outer);
      ctx.fillStyle = radialGlowGradient;
      ctx.fill();

      ctx.save();
      ctx.clip();
      const faceShade = ctx.createLinearGradient(-radius, -radius, radius, radius);
      faceShade.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
      faceShade.addColorStop(0.45, 'rgba(255, 255, 255, 0.02)');
      faceShade.addColorStop(1, 'rgba(20, 12, 8, 0.28)');
      ctx.fillStyle = faceShade;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      ctx.restore();

      ctx.save();
      ctx.clip();
      ctx.lineCap = 'round';
      ctx.lineWidth = tierStyle.texture === 'wood' ? 2.5 : 1.5;
      ctx.strokeStyle = runtimeState.eternalBlessing ? 'rgba(255, 255, 255, 0.24)' : 'rgba(45, 25, 14, 0.13)';
      if (tierStyle.texture === 'wood') {
        for (let grain = 1; grain <= 5; grain++) {
          const grainRadius = 20 + grain * 13 + (i % 3) * 4;
          ctx.beginPath();
          ctx.arc(0, 0, grainRadius, i * sectorRadians - 0.18, (i + 1) * sectorRadians + 0.18);
          ctx.stroke();
        }
      } else if (tierStyle.texture === 'crystal') {
        for (let streak = -2; streak <= 3; streak++) {
          ctx.beginPath();
          ctx.moveTo(-radius, streak * 22 + (i % 2) * 8);
          ctx.lineTo(radius, streak * 22 - 34);
          ctx.stroke();
        }
      } else {
        for (let ring = 1; ring <= 4; ring++) {
          ctx.beginPath();
          ctx.arc(0, 0, ring * 25, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 14, i * sectorRadians + 0.04, (i + 1) * sectorRadians - 0.04);
        ctx.stroke();
      }
      ctx.restore();

      ctx.lineWidth = 3;
      ctx.strokeStyle = rarityStyle.outline;
      ctx.stroke();

    }
    ctx.restore();

    const spokeStyle = runtimeState.eternalBlessing ? '#56e3ee' : tierStyle.outline;
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(currentWheelAngle);
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = spokeStyle;
    for (let spoke = 0; spoke < wheelPrizes.length; spoke++) {
      const spokeAngle = spoke * sectorRadians;
      ctx.beginPath();
      ctx.moveTo(Math.cos(spokeAngle) * 10, Math.sin(spokeAngle) * 10);
      ctx.lineTo(Math.cos(spokeAngle) * (radius - 12), Math.sin(spokeAngle) * (radius - 12));
      ctx.stroke();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = tierStyle.rim;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 16, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(radius, radius, radius - 3, 0, 2 * Math.PI);
    ctx.lineWidth = 5;
    ctx.strokeStyle = runtimeState.eternalBlessing ? '#08798c' : tierStyle.outline;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 9, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = tierStyle.rim;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(radius, radius, 8, 0, 2 * Math.PI);
    ctx.fillStyle = runtimeState.eternalBlessing ? '#eaffff' : tierStyle.center;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = runtimeState.eternalBlessing ? '#00b9d4' : tierStyle.rim;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(radius, radius, 4, 0, 2 * Math.PI);
    ctx.fillStyle = runtimeState.eternalBlessing ? '#08798c' : tierStyle.outline;
    ctx.fill();
  }

  function processStateProbabilityIndex() {
    let pool = [];
    wheelPrizes.forEach((slice, segmentIndex) => {
      let calcWeight = slice.weight;
      const luckyCycle = runtimeState.cycle % 2 === 1;
      if (slice.type === 'jackpot') calcWeight *= luckyCycle ? 1.5 : 0.6;
      if (slice.type === 'gems') calcWeight *= luckyCycle ? 1.5 : 0.85;
      if (slice.type === 'coins' && slice.val >= 20) calcWeight *= 1 + runtimeState.luckLevel * 0.12;
      if (slice.type === 'coins' && slice.val === 4 && !luckyCycle) calcWeight *= 1.35;
      if (slice.type === 'potion') calcWeight *= 1 + runtimeState.luckLevel * 0.1;
      const wheelBonus = wheelMilestones[runtimeState.wheelTier]?.bonus || 0;
      const temporaryBonus = runtimeState.refreshWheelType === 'crystal' ? 0.35
        : runtimeState.refreshWheelType === 'gold' ? 0.20
          : runtimeState.refreshWheelType === 'silver' ? 0.10 : 0;
      const effectiveWheelBonus = runtimeState.refreshWheelType === 'degraded'
        ? Math.max(0, wheelBonus - 0.15)
        : Math.max(wheelBonus, temporaryBonus);
      if (slice.type === 'gems' || slice.type === 'potion') calcWeight *= 1 + effectiveWheelBonus;
      if (slice.type === 'gems' || slice.type === 'potion' || slice.type === 'jackpot') {
        calcWeight *= Math.max(0.1, 1 + (runtimeState.refreshLuck || 0));
      }
      if (runtimeState.eternalBlessing) {
        if (slice.type === 'jackpot') calcWeight *= 2;
        if (slice.type === 'gems') calcWeight *= 1.8;
        if (slice.type === 'coins' && slice.val >= 20) calcWeight *= 1.15;
      }

      if (runtimeState.activePotion === 'basic' && slice.type === 'coins' && slice.val === 4) calcWeight = 0;
      else if (runtimeState.activePotion === 'uncommon') {
        if (slice.type === 'coins' && slice.val === 20) calcWeight *= 3;
      }
      else if (runtimeState.activePotion === 'rare') {
        if (slice.type === 'gems') calcWeight *= 2;
      } else if (runtimeState.activePotion === 'mythic') {
        if (slice.type === 'jackpot') calcWeight *= 3;
        if (slice.type === 'gems') calcWeight *= 2;
      } else if (runtimeState.activePotion === 'legendary') {
        if (slice.type === 'jackpot') calcWeight *= 6;
      } else if (runtimeState.activePotion === 'divine') {
        if (slice.type === 'jackpot') calcWeight *= 12;
      } else if (runtimeState.activePotion === 'secret') {
        if (slice.type === 'jackpot') calcWeight *= 4;
        if (slice.type === 'gems') calcWeight *= 3;
      }
      
      for (let i = 0; i < calcWeight; i++) pool.push(segmentIndex);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function beginMotionSequence() {
    if (isMotionActive || (runtimeState.cooldownUntil || 0) > Date.now()) {
      updateCooldownDisplay();
      return;
    }
    isMotionActive = true;
    spinBtn.disabled = true;
    tickerTray.textContent = 'Spinning the wheel...';

    const winIdx = processStateProbabilityIndex();
    const sectorRadians = (2 * Math.PI) / wheelPrizes.length;
    const sliceTargetArc = (3.5 * Math.PI - (winIdx * sectorRadians + sectorRadians / 2)) % (2 * Math.PI);
    const continuousRotations = (Math.floor(Math.random() * 3) + 6) * 2 * Math.PI;
    const finalRotationalTarget = continuousRotations + sliceTargetArc;

    let operationalRotation = currentWheelAngle % (2 * Math.PI);
    let initialTimestamp = null;
    const spinLifespan = 4000;

    function renderStepFrame(now) {
      if (!initialTimestamp) initialTimestamp = now;
      const progressTracker = Math.min((now - initialTimestamp) / spinLifespan, 1);
      const easeParabolicCurve = 1 - Math.pow(1 - progressTracker, 4);
      
      currentWheelAngle = operationalRotation + (finalRotationalTarget - operationalRotation) * easeParabolicCurve;
      paintWheelMatrix();

      if (progressTracker < 1) {
        requestAnimationFrame(renderStepFrame);
      } else {
        grantTargetReward(wheelPrizes[winIdx]);
      }
    }
    requestAnimationFrame(renderStepFrame);
  }

  function grantTargetReward(landedSlice) {
    isMotionActive = false;
    spinBtn.disabled = false;
    
    if (landedSlice.type === 'coins') {
      const payout = Math.round(landedSlice.val * (1 + runtimeState.payoutLevel * 0.15));
      runtimeState.coins += payout;
      addMaterials(landedSlice.materials);
      const materialText = Object.keys(landedSlice.materials || {}).map(key => materialNames[key]).join(', ');
      tickerTray.textContent = `Claimed: +${payout} Coins${materialText ? ` and ${materialText}` : ''}!`;
    } else if (landedSlice.type === 'gems') {
      runtimeState.gems += landedSlice.val;
      runtimeState.loot.gemCluster++;
      addMaterials(landedSlice.materials);
      autoSellLoot('gemCluster');
      tickerTray.textContent = `Claimed: +${landedSlice.val} Gems!`;
    } else if (landedSlice.type === 'jackpot') {
      runtimeState.loot.divineRoyalty++;
      addMaterials(landedSlice.materials);
      autoSellLoot('divineRoyalty');
      const roll = Math.random() * 100;
      if (roll < 1) { runtimeState.inventory.eternal++; tickerTray.textContent = 'ETERNAL DROP! A crystal potion has appeared!'; }
      else if (roll < 5) { runtimeState.inventory.secret++; tickerTray.textContent = 'SECRET DROP! A Secret Potion has appeared!'; }
      else if (roll < 40) { runtimeState.inventory.uncommon++; tickerTray.textContent = 'JACKPOT! Uncommon Potion unlocked!'; }
      else if (roll < 70) { runtimeState.inventory.rare++; tickerTray.textContent = 'JACKPOT! Rare Potion unlocked!'; }
      else if (roll < 90) { runtimeState.inventory.mythic++; tickerTray.textContent = 'JACKPOT! Mythic Potion unlocked!'; }
      else if (roll < 98) { runtimeState.inventory.legendary++; tickerTray.textContent = 'JACKPOT! Legendary Potion unlocked!'; }
      else { runtimeState.inventory.divine++; tickerTray.textContent = 'UNREAL LAND! Divine Potion unlocked!'; }
    } else if (landedSlice.type === 'materialChest') {
      runtimeState.loot.materialChest++;
      const foundMaterials = openMaterialChest();
      tickerTray.textContent = `Opened Material Chest: ${foundMaterials.join(', ')}!`;
    } else if (landedSlice.type === 'material') {
      addMaterials(landedSlice.materials);
      const materialText = Object.keys(landedSlice.materials || {}).map(key => materialNames[key]).join(', ');
      tickerTray.textContent = `Found: ${materialText}!`;
    } else if (landedSlice.type === 'potion') {
      runtimeState.inventory[landedSlice.tier]++;
      tickerTray.textContent = landedSlice.tier === 'eternal'
        ? 'ETERNAL POTION SPAWNED! You found the rarest reward!'
        : `${landedSlice.name} won!`;
    } else if (landedSlice.type === 'empty') {
      tickerTray.textContent = 'The wheel lands on an empty slot.';
    }

    if (runtimeState.activePotion) {
      runtimeState.inventory[runtimeState.activePotion]--;
      runtimeState.activePotion = null;
    }
    runtimeState.rolls++;
    if (runtimeState.rolls % 5 === 0) {
      refreshWheelPrizes();
      runtimeState.refreshLuck = runtimeState.refreshWheelType === 'crystal' ? 0.35
        : runtimeState.refreshWheelType === 'gold' ? 0.20
          : runtimeState.refreshWheelType === 'silver' ? 0.10 : 0;
      paintWheelMatrix();
      const refreshName = runtimeState.refreshWheelType === 'crystal' ? 'Crystal Wheel' : runtimeState.refreshWheelType === 'gold' ? 'Gold Wheel' : runtimeState.refreshWheelType === 'silver' ? 'Silver Wheel' : 'new wheel layout';
      if (Math.random() < 0.15 && runtimeState.wheelTier > 0) {
        runtimeState.refreshWheelType = 'degraded';
        runtimeState.refreshLuck = -0.15;
        tickerTray.textContent = `The wheel changed to a ${refreshName}, but its material degraded one tier.`;
        paintWheelMatrix();
      } else {
        tickerTray.textContent = `The wheel changed to a ${refreshName}!`;
      }
    }
    if (runtimeState.rolls >= 10) {
      runtimeState.rolls = 0;
      runtimeState.cycle++;
      runtimeState.cooldownUntil = Date.now() + 20000;
      tickerTray.textContent += runtimeState.cycle % 2 === 1 ? ' New lucky cycle!' : ' New risky cycle!';
      updateCooldownDisplay();
    }
    refreshDisplayHUD();
    showRewardPopup(landedSlice, tickerTray.textContent);
    saveStateToLocalDisk();
  }

  function showRewardPopup(landedSlice, detail) {
    const popup = document.getElementById('reward-popup');
    const icon = document.getElementById('reward-icon');
    const title = document.getElementById('reward-title');
    const detailLabel = document.getElementById('reward-detail');
    const icons = { coins: '◉', gems: '◆', material: '▰', materialChest: '▣', jackpot: '✦', potion: '⚗', empty: '—' };
    icon.textContent = icons[landedSlice.type] || '✦';
    icon.className = `reward-icon rarity-${landedSlice.rarity || 'common'}`;
    title.textContent = landedSlice.type === 'empty' ? 'Empty Slot' : landedSlice.name;
    detailLabel.textContent = detail;
    popup.classList.remove('hidden');
  }

  function addMaterials(materials) {
    Object.entries(materials || {}).forEach(([key, amount]) => {
      const dropAmount = amount === 1 && Math.random() < 0.12 ? 2 : amount;
      runtimeState.materials[key] += dropAmount;
    });
  }

  function openMaterialChest() {
    const foundMaterials = [];
    for (let dropIndex = 0; dropIndex < 3; dropIndex++) {
      const materialKey = materialKeys[Math.floor(Math.random() * materialKeys.length)];
      runtimeState.materials[materialKey]++;
      foundMaterials.push(`1 ${materialNames[materialKey]}`);
    }
    return foundMaterials;
  }

  function autoSellLoot(key) {
    if (!runtimeState.autoSell[key]) return;
    runtimeState.loot[key]--;
    runtimeState.gems += autoSellValues[key];
  }

  function upgradeWheel() {
    if (isMotionActive) return;
    const nextWheel = wheelMilestones[runtimeState.wheelTier + 1];
    if (!nextWheel) return;
    const missing = Object.entries(nextWheel.recipe).find(([key, amount]) => runtimeState.materials[key] < amount);
    if (missing) {
      tickerTray.textContent = `Need ${missing[1] - runtimeState.materials[missing[0]]} more ${missing[0]}.`;
      return;
    }
    Object.entries(nextWheel.recipe).forEach(([key, amount]) => {
      runtimeState.materials[key] -= amount;
    });
    runtimeState.wheelTier++;
    tickerTray.textContent = `${nextWheel.name} built! Milestone ${runtimeState.wheelTier} reached.`;
    refreshDisplayHUD();
    paintWheelMatrix();
    saveStateToLocalDisk();
  }

  function toggleInventoryBuff(tier) {
    if (isMotionActive) return;
    if (runtimeState.inventory[tier] <= 0) {
      tickerTray.textContent = `Zero ${tier} potions owned.`;
      return;
    }
    runtimeState.activePotion = (runtimeState.activePotion === tier) ? null : tier;
    tickerTray.textContent = runtimeState.activePotion ? `${tier} potion active for next roll.` : "Potion unequipped.";
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function useEternalPotion() {
    if (isMotionActive || runtimeState.eternalBlessing) return;
    if (runtimeState.inventory.eternal <= 0) {
      tickerTray.textContent = 'No Eternal Potions owned.';
      return;
    }
    runtimeState.inventory.eternal--;
    runtimeState.eternalBlessing = true;
    runtimeState.inventory.secret++;
    tickerTray.textContent = 'ETERNAL BLESSING! The wheel became crystal, and a Secret Potion appeared.';
    refreshDisplayHUD();
    paintWheelMatrix();
    saveStateToLocalDisk();
  }

  function buyUpgrade(type) {
    if (isMotionActive) return;
    const levelKey = type === 'luck' ? 'luckLevel' : 'payoutLevel';
    const cost = type === 'luck' ? 100 + runtimeState.luckLevel * 150 : 150 + runtimeState.payoutLevel * 200;
    if (runtimeState.coins < cost) {
      tickerTray.textContent = `You need ${cost - runtimeState.coins} more coins.`;
      return;
    }
    runtimeState.coins -= cost;
    runtimeState[levelKey]++;
    tickerTray.textContent = type === 'luck' ? 'Fortune Charm upgraded!' : 'Golden Touch upgraded!';
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function buyPotion(tier, cost) {
    if (isMotionActive) return;
    restockMarketIfNeeded();
    if (marketTiers.includes(tier) && (runtimeState.marketStock[tier] || 0) <= 0) {
      tickerTray.textContent = `${tier} Potion is sold out until tomorrow.`;
      return;
    }
    if (runtimeState.gems < cost) {
      tickerTray.textContent = `You need ${cost - runtimeState.gems} more gems.`;
      return;
    }
    runtimeState.gems -= cost;
    runtimeState.inventory[tier]++;
    if (marketTiers.includes(tier)) runtimeState.marketStock[tier]--;
    tickerTray.textContent = `${tier} Potion added to your inventory!`;
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function buyEternalPotion() {
    restockMarketIfNeeded();
    if (isMotionActive || runtimeState.eternalStock <= 0) return;
    if (runtimeState.gems < 1000) {
      tickerTray.textContent = `You need ${1000 - runtimeState.gems} more gems.`;
      return;
    }
    runtimeState.gems -= 1000;
    runtimeState.inventory.eternal++;
    runtimeState.eternalStock--;
    tickerTray.textContent = 'Eternal Potion secured. Use it for a permanent crystal blessing.';
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function sellPotion(tier, requestedAmount) {
    if (runtimeState.activePotion === tier) {
      tickerTray.textContent = 'Unequip that potion before selling it.';
      return;
    }
    const ownedAmount = runtimeState.inventory[tier] || 0;
    const amount = requestedAmount === '' || requestedAmount === undefined ? 1 : Number(requestedAmount);
    if (isMotionActive || ownedAmount <= 0) {
      tickerTray.textContent = `No ${tier} Potions available to sell.`;
      return;
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > ownedAmount) {
      tickerTray.textContent = `Enter a whole number from 1 to ${ownedAmount}.`;
      return;
    }
    const totalValue = sellValues[tier] * amount;
    if (!window.confirm(`Sell ${amount} ${tier} Potion${amount === 1 ? '' : 's'} for ${totalValue} gems?`)) return;
    runtimeState.inventory[tier] -= amount;
    runtimeState.gems += totalValue;
    tickerTray.textContent = `${amount} ${tier} Potion${amount === 1 ? '' : 's'} sold for ${totalValue} gems.`;
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function sellLoot(key, value) {
    if (isMotionActive || runtimeState.loot[key] <= 0) {
      tickerTray.textContent = 'That loot item is not in your collection.';
      return;
    }
    runtimeState.loot[key]--;
    runtimeState.gems += value;
    tickerTray.textContent = `Loot sold for ${value} gems.`;
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  spinBtn.addEventListener('click', beginMotionSequence);
  buyLuckButton.addEventListener('click', () => buyUpgrade('luck'));
  buyPayoutButton.addEventListener('click', () => buyUpgrade('payout'));
  buyEternalButton.addEventListener('click', buyEternalPotion);
  document.querySelectorAll('[data-potion]').forEach(button => {
    button.addEventListener('click', () => buyPotion(button.dataset.potion, Number(button.dataset.cost)));
  });
  ['basic', 'uncommon', 'rare', 'mythic', 'legendary', 'divine', 'secret'].forEach(tier => {
    document.getElementById(`btn-${tier}`).addEventListener('click', () => toggleInventoryBuff(tier));
    document.getElementById(`sell-${tier}`).addEventListener('click', () => sellPotion(tier, document.getElementById(`sell-qty-${tier}`).value));
  });
  document.getElementById('btn-eternal').addEventListener('click', useEternalPotion);
  document.getElementById('sell-eternal').addEventListener('click', () => sellPotion('eternal', document.getElementById('sell-qty-eternal').value));
  document.getElementById('reward-close').addEventListener('click', () => {
    document.getElementById('reward-popup').classList.add('hidden');
  });
  document.querySelectorAll('[data-sell-item]').forEach(button => {
    button.addEventListener('click', () => sellLoot(button.dataset.sellItem, Number(button.dataset.sellValue)));
  });
  document.getElementById('upgrade-wheel').addEventListener('click', upgradeWheel);
  document.querySelectorAll('[data-auto-sell]').forEach(input => {
    input.addEventListener('change', () => {
      runtimeState.autoSell[input.dataset.autoSell] = input.checked;
      saveStateToLocalDisk();
    });
  });
  setInterval(updateCooldownDisplay, 250);
});




