document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spin-btn');
  const tickerTray = document.getElementById('ticker-tray');
  const tabWheel = document.getElementById('tab-wheel');
  const tabInv = document.getElementById('tab-inv');
  const viewWheel = document.getElementById('view-wheel');
  const viewInventory = document.getElementById('view-inventory');
  const coinLabel = document.getElementById('coins-val');
  const gemLabel = document.getElementById('gems-val');
  const balLabel = document.getElementById('bal-val');
  const buffBanner = document.getElementById('buff-banner');
  const buffTitle = document.getElementById('buff-title');
  const buffPurge = document.getElementById('buff-purge');

  let runtimeState = {
    coins: 50,
    gems: 0,
    balance: 0.00,
    inventory: { basic: 0, rare: 0, mythic: 0, legendary: 0, divine: 0 },
    activePotion: null
  };

  const basePrizes = [
    { name: 'Common Trash', weight: 50, type: 'coins', val: 5, c1: '#1b1633', c2: '#120e24' },
    { name: 'Bronze Cache', weight: 24, type: 'coins', val: 35, c1: '#8a5a36', c2: '#5e3c23' },
    { name: 'Silver Vault', weight: 14, type: 'coins', val: 80, c1: '#9ba1b0', c2: '#686d7a' },
    { name: 'Mythic Core', weight: 8, type: 'gems', val: 3, c1: '#7924bf', c2: '#531687' },
    { name: 'Balance Slip', weight: 3, type: 'balance', val: 0.75, c1: '#00b35e', c2: '#00733c' },
    { name: 'DIVINE ROYALTY', weight: 1, type: 'jackpot', val: 0, c1: '#00b3b3', c2: '#007373' }
  ];

  let currentWheelAngle = 0;
  let isMotionActive = false;

  chrome.storage.local.get(['arcaneMasterState'], (store) => {
    if (store.arcaneMasterState) { runtimeState = store.arcaneMasterState; }
    refreshDisplayHUD();
    paintWheelMatrix();
  });

  function saveStateToLocalDisk() {
    chrome.storage.local.set({ arcaneMasterState: runtimeState });
  }

  tabWheel.addEventListener('click', () => {
    tabWheel.classList.add('active'); tabInv.classList.remove('active');
    viewWheel.classList.add('active'); viewInventory.classList.remove('active');
  });
  tabInv.addEventListener('click', () => {
    tabInv.classList.add('active'); tabWheel.classList.remove('active');
    viewInventory.classList.add('active'); viewWheel.classList.remove('active');
  });

  function refreshDisplayHUD() {
    coinLabel.textContent = runtimeState.coins;
    gemLabel.textContent = runtimeState.gems;
    balLabel.textContent = `$${runtimeState.balance.toFixed(2)}`;
    ['basic', 'rare', 'mythic', 'legendary', 'divine'].forEach(tier => {
      document.getElementById(`qty-${tier}`).textContent = runtimeState.inventory[tier];
      document.getElementById(`row-${tier}`).classList.toggle('active', runtimeState.activePotion === tier);
    });
    if (runtimeState.activePotion) {
      buffBanner.style.display = 'flex';
      buffTitle.textContent = `${runtimeState.activePotion.toUpperCase()} POTION`;
      buffTitle.style.color = `var(--color-${runtimeState.activePotion})`;
    } else {
      buffBanner.style.display = 'none';
    }
  }

  function paintWheelMatrix() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const radius = canvas.width / 2;
    const sectorRadians = (2 * Math.PI) / basePrizes.length;
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(currentWheelAngle);
    for (let i = 0; i < basePrizes.length; i++) {
      const item = basePrizes[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 2, i * sectorRadians, (i + 1) * sectorRadians);
      let radialGlowGradient = ctx.createRadialGradient(0, 0, 8, 0, 0, radius);
      radialGlowGradient.addColorStop(0, item.c1);
      radialGlowGradient.addColorStop(1, item.c2);
      ctx.fillStyle = radialGlowGradient;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.stroke();
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.rotate(i * sectorRadians + sectorRadians / 2);
      ctx.fillText(item.name, radius - 16, 0);
      ctx.restore();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(radius, radius, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#06040d';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff0055';
    ctx.stroke();
  }
  function processStateProbabilityIndex() {
    let pool = [];
    basePrizes.forEach((slice, segmentIndex) => {
      let calcWeight = slice.weight;
      if (runtimeState.activePotion === 'basic' && slice.name === 'Common Trash') calcWeight = 0;
      else if (runtimeState.activePotion === 'rare') {
        if (slice.type === 'gems' || slice.type === 'balance') calcWeight *= 2;
      } else if (runtimeState.activePotion === 'mythic') {
        if (slice.type === 'jackpot') calcWeight *= 3;
        if (slice.type === 'gems') calcWeight *= 2;
      } else if (runtimeState.activePotion === 'legendary') {
        if (slice.type === 'jackpot') calcWeight *= 5;
        if (slice.type === 'balance') calcWeight *= 3;
      } else if (runtimeState.activePotion === 'divine') {
        if (slice.type === 'jackpot') calcWeight *= 10;
        if (slice.type === 'balance') calcWeight *= 5;
      }
      for (let i = 0; i < calcWeight; i++) pool.push(segmentIndex);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function beginMotionSequence() {
    if (isMotionActive) return;
    isMotionActive = true;
    spinBtn.disabled = true;
    tickerTray.textContent = "Querying cosmic patterns...";
    const winIdx = processStateProbabilityIndex();
    const sectorRadians = (2 * Math.PI) / basePrizes.length;
    const sliceTargetArc = (3.5 * Math.PI - (winIdx * sectorRadians + sectorRadians / 2)) % (2 * Math.PI);
    const continuousRotations = (Math.floor(Math.random() * 3) + 7) * 2 * Math.PI;
    const finalRotationalTarget = continuousRotations + sliceTargetArc;
    let operationalRotation = currentWheelAngle % (2 * Math.PI);
    let initialTimestamp = null;
    const spinLifespan = 4400;
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
    if (landedSlice.type === 'coins') runtimeState.coins += landedSlice.val;
    else if (landedSlice.type === 'gems') runtimeState.gems += landedSlice.val;
    else if (landedSlice.type === 'balance') runtimeState.balance += landedSlice.val;
    else if (landedSlice.type === 'jackpot') {
      runtimeState.coins += 5000; runtimeState.gems += 150; runtimeState.balance += 25.00;
    }
    tickerTray.textContent = `Claimed: ${landedSlice.name}!`;
    if (runtimeState.activePotion) {
      runtimeState.inventory[runtimeState.activePotion]--;
      runtimeState.activePotion = null;
    }
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function clearChestTransaction(tier) {
    if (isMotionActive) return;
    let cost = 0, currencyKey = 'coins';
    if (tier === 'wooden') cost = 50;
    else if (tier === 'reinforced') cost = 150;
    else if (tier === 'mythic') { cost = 10; currencyKey = 'gems'; }
    if (runtimeState[currencyKey] < cost) {
      tickerTray.textContent = "Transaction failed: Insufficient currency vault logs.";
      return;
    }
    runtimeState[currencyKey] -= cost;
    let roll = Math.random() * 100;
    let message = "";
    if (tier === 'wooden') {
      if (roll < 70) { runtimeState.inventory.basic++; message = "Extracted: Basic Potion"; }
      else { runtimeState.inventory.rare++; message = "Lucky Loot: Rare Potion"; }
    } else if (tier === 'reinforced') {
      if (roll < 55) { runtimeState.inventory.rare++; message = "Extracted: Rare Potion"; }
      else if (roll < 90) { runtimeState.inventory.mythic++; message = "Loot Drop: Mythic Potion"; }
      else { runtimeState.inventory.legendary++; message = "Legendary Drop: Legendary Potion"; }
    } else if (tier === 'mythic') {
      if (roll < 60) { runtimeState.inventory.mythic += 2; message = "Extracted: 2x Mythic Potions"; }
      else if (roll < 92) { runtimeState.inventory.legendary++; message = "Loot Drop: Legendary Potion"; }
      else { runtimeState.inventory.divine++; message = "🌌 ASTRAL ANOMALY: Divine Potion!"; }
    }
    tickerTray.textContent = message;
    refreshDisplayHUD();
    saveStateToLocalDisk();
  }

  function toggleInventoryBuff(tier) {
    if (isMotionActive) return;
    if (runtimeState.inventory[tier] <= 0) {
      tickerTray.textContent = `Stock verification failed: Zero ${tier} potions owned.`;
      return;
    }
    runtimeState.activePotion = (runtimeState.activePotion === tier) ? null : tier;
    tickerTray.textContent = runtimeState.activePotion ? `${tier} potion active for next roll.` : "Potion unequipped.";
    refreshDisplayHUD();
  }

  spinBtn.addEventListener('click', beginMotionSequence);
  buffPurge.addEventListener('click', () => { runtimeState.activePotion = null; refreshDisplayHUD(); });
  document.getElementById('box-wooden').addEventListener('click', () => clearChestTransaction('wooden'));
  document.getElementById('box-reinforced').addEventListener('click', () => clearChestTransaction('reinforced'));
  document.getElementById('box-mythic').addEventListener('click', () => clearChestTransaction('mythic'));
  ['basic', 'rare', 'mythic', 'legendary', 'divine'].forEach(tier => {
    document.getElementById(`btn-${tier}`).addEventListener('click', () => toggleInventoryBuff(tier));
  });
  paintWheelMatrix();
});


