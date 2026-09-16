document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');
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
  const potionTiers = ['basic', 'uncommon', 'rare', 'mythic', 'legendary', 'divine', 'secret', 'eternal'];
  const sellValues = { basic: 2, uncommon: 8, rare: 20, mythic: 50, legendary: 110, divine: 300, secret: 250, eternal: 500 };
  const lootKeys = ['smallCoins', 'coinPouch', 'rareChest', 'gemCluster', 'divineRoyalty'];

  const defaultState = {
    coins: 50,
    gems: 0,
    rolls: 0,
    cycle: 1,
    luckLevel: 0,
    payoutLevel: 0,
    eternalStock: 1,
    eternalBlessing: false,
    inventory: { basic: 1, uncommon: 0, rare: 0, mythic: 0, legendary: 0, divine: 0, secret: 0, eternal: 0 },
    loot: { smallCoins: 0, coinPouch: 0, rareChest: 0, gemCluster: 0, divineRoyalty: 0 },
    activePotion: null
  };
  let runtimeState = structuredClone(defaultState);

  const basePrizes = [
    { name: 'Small Coins', weight: 50, type: 'coins', val: 5, c1: '#fff0a8', c2: '#e9b936' },
    { name: 'Coin Pouch', weight: 24, type: 'coins', val: 35, c1: '#ffe27a', c2: '#d68b18' },
    { name: 'Rare Chest', weight: 14, type: 'coins', val: 80, c1: '#bde8ff', c2: '#4a9ed8' },
    { name: 'Gem Cluster', weight: 14, type: 'gems', val: 3, c1: '#f1c7ff', c2: '#a342d4' },
    { name: 'DIVINE ROYALTY', weight: 1, type: 'jackpot', val: 0, c1: '#fff8c7', c2: '#e19a00' }
  ];

  let currentWheelAngle = 0;
  let isMotionActive = false;

  chrome.storage.local.get(['arcaneMasterStateV2'], (store) => {
    if (store.arcaneMasterStateV2) {
      const savedState = store.arcaneMasterStateV2;
      runtimeState = {
        ...defaultState,
        ...savedState,
        inventory: { ...defaultState.inventory, ...(savedState.inventory || {}) },
        loot: { ...defaultState.loot, ...(savedState.loot || {}) }
      };
    }
    refreshDisplayHUD();
    paintWheelMatrix();
  });

  function saveStateToLocalDisk() {
    chrome.storage.local.set({ arcaneMasterStateV2: runtimeState });
  }

  function refreshDisplayHUD() {
    coinLabel.textContent = runtimeState.coins;
    gemLabel.textContent = runtimeState.gems;
    rollsLabel.textContent = `${runtimeState.rolls} / 10`;
    cycleStatus.textContent = runtimeState.cycle % 2 === 1 ? `Lucky odds · Cycle ${runtimeState.cycle}` : `Risky odds · Cycle ${runtimeState.cycle}`;
    luckLevelLabel.textContent = runtimeState.luckLevel;
    payoutLevelLabel.textContent = runtimeState.payoutLevel;
    buyLuckButton.textContent = `Buy ${25 + runtimeState.luckLevel * 25} coins`;
    buyPayoutButton.textContent = `Buy ${40 + runtimeState.payoutLevel * 35} coins`;
    buyEternalButton.textContent = runtimeState.eternalStock > 0 ? '1,000 gems' : 'Sold out';
    buyEternalButton.disabled = runtimeState.eternalStock <= 0;
    potionTiers.forEach(tier => {
      document.getElementById(`qty-${tier}`).textContent = runtimeState.inventory[tier] || 0;
      const row = document.getElementById(`row-${tier}`);
      const button = document.getElementById(`btn-${tier}`);
      row.classList.toggle('active', runtimeState.activePotion === tier || (tier === 'eternal' && runtimeState.eternalBlessing));
      button.textContent = tier === 'eternal' && runtimeState.eternalBlessing ? 'Blessed' : (runtimeState.activePotion === tier ? 'Active' : 'Arm');
      button.disabled = tier === 'eternal' && runtimeState.eternalBlessing;
    });
    lootKeys.forEach(key => {
      document.getElementById(`loot-${key}-label`).textContent = `${key.replace(/([A-Z])/g, ' $1')} × ${runtimeState.loot[key] || 0}`;
    });
  }

  function paintWheelMatrix() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const radius = canvas.width / 2;
    const sectorRadians = (2 * Math.PI) / basePrizes.length;

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(currentWheelAngle);

    for (let i = 0; i < basePrizes.length; i++) {
      const item = basePrizes[i];
      const eternalColors = ['#dffcff', '#78dce8', '#f8ffff', '#75bfd8'];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 2, i * sectorRadians, (i + 1) * sectorRadians);
      
      let radialGlowGradient = ctx.createRadialGradient(0, 0, 6, 0, 0, radius);
      radialGlowGradient.addColorStop(0, runtimeState.eternalBlessing ? eternalColors[(i + 1) % eternalColors.length] : item.c1);
      radialGlowGradient.addColorStop(1, runtimeState.eternalBlessing ? eternalColors[i % eternalColors.length] : item.c2);
      ctx.fillStyle = radialGlowGradient;
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = runtimeState.eternalBlessing ? '#075d79' : '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.rotate(i * sectorRadians + sectorRadians / 2);
      ctx.fillText(runtimeState.eternalBlessing ? `◇ ${item.name}` : item.name, radius - 12, 0);
      ctx.restore();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(radius, radius, 8, 0, 2 * Math.PI);
    ctx.fillStyle = runtimeState.eternalBlessing ? '#eaffff' : '#fff7d6';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = runtimeState.eternalBlessing ? '#00b9d4' : '#c47a00';
    ctx.stroke();
  }

  function processStateProbabilityIndex() {
    let pool = [];
    basePrizes.forEach((slice, segmentIndex) => {
      let calcWeight = slice.weight;
      const luckyCycle = runtimeState.cycle % 2 === 1;
      if (slice.type === 'jackpot') calcWeight *= luckyCycle ? 1.5 : 0.6;
      if (slice.type === 'gems') calcWeight *= luckyCycle ? 1.5 : 0.85;
      if (slice.type === 'coins' && slice.val >= 35) calcWeight *= 1 + runtimeState.luckLevel * 0.12;
      if (slice.type === 'coins' && slice.val === 5 && !luckyCycle) calcWeight *= 1.35;
      if (runtimeState.eternalBlessing) {
        if (slice.type === 'jackpot') calcWeight *= 2;
        if (slice.type === 'gems') calcWeight *= 1.8;
        if (slice.type === 'coins' && slice.val >= 35) calcWeight *= 1.15;
      }

      if (runtimeState.activePotion === 'basic' && slice.name === 'Small Coins') calcWeight = 0;
      else if (runtimeState.activePotion === 'uncommon') {
        if (slice.name === 'Uncommon Bronze') calcWeight *= 3;
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
    if (isMotionActive) return;
    isMotionActive = true;
    spinBtn.disabled = true;
    tickerTray.textContent = "Rolling your fate...";

    const winIdx = processStateProbabilityIndex();
    const sectorRadians = (2 * Math.PI) / basePrizes.length;
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
        grantTargetReward(basePrizes[winIdx]);
      }
    }
    requestAnimationFrame(renderStepFrame);
  }

  function grantTargetReward(landedSlice) {
    isMotionActive = false;
    spinBtn.disabled = false;
    
    if (landedSlice.type === 'coins') {
      const payout = landedSlice.val * (1 + runtimeState.payoutLevel * 0.25);
      runtimeState.coins += payout;
      runtimeState.loot[landedSlice.name === 'Small Coins' ? 'smallCoins' : landedSlice.name === 'Coin Pouch' ? 'coinPouch' : 'rareChest']++;
      tickerTray.textContent = `Claimed: +${payout} Coins!`;
    } else if (landedSlice.type === 'gems') {
      runtimeState.gems += landedSlice.val;
      runtimeState.loot.gemCluster++;
      tickerTray.textContent = `Claimed: +${landedSlice.val} Gems!`;
    } else if (landedSlice.type === 'jackpot') {
      runtimeState.loot.divineRoyalty++;
      const roll = Math.random() * 100;
      if (roll < 1) { runtimeState.inventory.eternal++; tickerTray.textContent = 'ETERNAL DROP! A crystal potion has appeared!'; }
      else if (roll < 5) { runtimeState.inventory.secret++; tickerTray.textContent = 'SECRET DROP! A Secret Potion has appeared!'; }
      else if (roll < 40) { runtimeState.inventory.uncommon++; tickerTray.textContent = 'JACKPOT! Uncommon Potion unlocked!'; }
      else if (roll < 70) { runtimeState.inventory.rare++; tickerTray.textContent = 'JACKPOT! Rare Potion unlocked!'; }
      else if (roll < 90) { runtimeState.inventory.mythic++; tickerTray.textContent = 'JACKPOT! Mythic Potion unlocked!'; }
      else if (roll < 98) { runtimeState.inventory.legendary++; tickerTray.textContent = 'JACKPOT! Legendary Potion unlocked!'; }
      else { runtimeState.inventory.divine++; tickerTray.textContent = 'UNREAL LAND! Divine Potion unlocked!'; }
    }

    if (runtimeState.activePotion) {
      runtimeState.inventory[runtimeState.activePotion]--;
      runtimeState.activePotion = null;
    }
    runtimeState.rolls++;
    if (runtimeState.rolls >= 10) {
      runtimeState.rolls = 0;
      runtimeState.cycle++;
      tickerTray.textContent += runtimeState.cycle % 2 === 1 ? ' New lucky cycle!' : ' New risky cycle!';
    }
    refreshDisplayHUD();
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
    const cost = type === 'luck' ? 25 + runtimeState.luckLevel * 25 : 40 + runtimeState.payoutLevel * 35;
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
    if (runtimeState.gems < cost) {
      tickerTray.textContent = `You need ${cost - runtimeState.gems} more gems.`;
      return;
    }
    runtimeState.gems -= cost;
    runtimeState.inventory[tier]++;
    tickerTray.textContent = `${tier} Potion added to your inventory!`;
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function buyEternalPotion() {
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

  function sellPotion(tier) {
    if (runtimeState.activePotion === tier) {
      tickerTray.textContent = 'Unequip that potion before selling it.';
      return;
    }
    if (isMotionActive || runtimeState.inventory[tier] <= 0) {
      tickerTray.textContent = `No ${tier} Potions available to sell.`;
      return;
    }
    runtimeState.inventory[tier]--;
    runtimeState.gems += sellValues[tier];
    tickerTray.textContent = `${tier} Potion sold for ${sellValues[tier]} gems.`;
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
    document.getElementById(`sell-${tier}`).addEventListener('click', () => sellPotion(tier));
  });
  document.getElementById('btn-eternal').addEventListener('click', useEternalPotion);
  document.getElementById('sell-eternal').addEventListener('click', () => sellPotion('eternal'));
  document.querySelectorAll('[data-sell-item]').forEach(button => {
    button.addEventListener('click', () => sellLoot(button.dataset.sellItem, Number(button.dataset.sellValue)));
  });
});




