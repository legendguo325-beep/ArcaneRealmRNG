document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spin-btn');
  const tickerTray = document.getElementById('ticker-tray');
  const coinLabel = document.getElementById('coins-val');
  const gemLabel = document.getElementById('gems-val');
  const balLabel = document.getElementById('bal-val');

  const defaultState = {
    coins: 50,
    gems: 0,
    balance: 0.00,
    inventory: { basic: 1, uncommon: 0, rare: 0, mythic: 0, legendary: 0, divine: 0 },
    activePotion: null
  };
  let runtimeState = structuredClone(defaultState);

  const basePrizes = [
    { name: 'Common Trash', weight: 50, type: 'coins', val: 5, c1: '#1b1633', c2: '#120e24' },
    { name: 'Uncommon Bronze', weight: 24, type: 'coins', val: 35, c1: '#1c3d27', c2: '#112417' },
    { name: 'Rare Silver', weight: 14, type: 'coins', val: 80, c1: '#182b47', c2: '#0e1929' },
    { name: 'Mythic Core', weight: 8, type: 'gems', val: 3, c1: '#371847', c2: '#1f0e29' },
    { name: 'Balance Slip', weight: 3, type: 'balance', val: 0.75, c1: '#473d18', c2: '#29230e' },
    { name: 'DIVINE ROYALTY', weight: 1, type: 'jackpot', val: 0, c1: '#184747', c2: '#0e2929' }
  ];

  let currentWheelAngle = 0;
  let isMotionActive = false;

  chrome.storage.local.get(['arcaneMasterStateV2'], (store) => {
    if (store.arcaneMasterStateV2) {
      const savedState = store.arcaneMasterStateV2;
      runtimeState = {
        ...defaultState,
        ...savedState,
        inventory: { ...defaultState.inventory, ...(savedState.inventory || {}) }
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
    balLabel.textContent = `$${runtimeState.balance.toFixed(2)}`;
    ['basic', 'uncommon', 'rare', 'mythic', 'legendary', 'divine'].forEach(tier => {
      document.getElementById(`qty-${tier}`).textContent = runtimeState.inventory[tier] || 0;
      document.getElementById(`row-${tier}`).classList.toggle('active', runtimeState.activePotion === tier);
      document.getElementById(`btn-${tier}`).textContent = runtimeState.activePotion === tier ? 'Active' : 'Arm';
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
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 2, i * sectorRadians, (i + 1) * sectorRadians);
      
      let radialGlowGradient = ctx.createRadialGradient(0, 0, 6, 0, 0, radius);
      radialGlowGradient.addColorStop(0, item.c1);
      radialGlowGradient.addColorStop(1, item.c2);
      ctx.fillStyle = radialGlowGradient;
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.rotate(i * sectorRadians + sectorRadians / 2);
      ctx.fillText(item.name, radius - 12, 0);
      ctx.restore();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(radius, radius, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#070512';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#a832ff';
    ctx.stroke();
  }

  function processStateProbabilityIndex() {
    let pool = [];
    basePrizes.forEach((slice, segmentIndex) => {
      let calcWeight = slice.weight;
      
      // Tier Luck Manipulation Table
      if (runtimeState.activePotion === 'basic' && slice.name === 'Common Trash') calcWeight = 0;
      else if (runtimeState.activePotion === 'uncommon') {
        if (slice.name === 'Uncommon Bronze') calcWeight *= 3;
      }
      else if (runtimeState.activePotion === 'rare') {
        if (slice.type === 'gems' || slice.type === 'balance') calcWeight *= 2;
      } else if (runtimeState.activePotion === 'mythic') {
        if (slice.type === 'jackpot') calcWeight *= 3;
        if (slice.type === 'gems') calcWeight *= 2;
      } else if (runtimeState.activePotion === 'legendary') {
        if (slice.type === 'jackpot') calcWeight *= 6;
        if (slice.type === 'balance') calcWeight *= 3;
      } else if (runtimeState.activePotion === 'divine') {
        if (slice.type === 'jackpot') calcWeight *= 12;
        if (slice.type === 'balance') calcWeight *= 6;
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
      runtimeState.coins += landedSlice.val;
      tickerTray.textContent = `Claimed: +${landedSlice.val} Coins!`;
    } else if (landedSlice.type === 'gems') {
      runtimeState.gems += landedSlice.val;
      tickerTray.textContent = `Claimed: +${landedSlice.val} Gems!`;
    } else if (landedSlice.type === 'balance') {
      runtimeState.balance += landedSlice.val;
      tickerTray.textContent = `Claimed: +$${landedSlice.val.toFixed(2)} Balance!`;
    } else if (landedSlice.type === 'jackpot') {
      // Jackpot event splits reward distributions down tier arrays
      const roll = Math.random() * 100;
      if (roll < 40) { runtimeState.inventory.uncommon++; tickerTray.textContent = "JACKPOT! Uncommon Potion unlocked!"; }
      else if (roll < 70) { runtimeState.inventory.rare++; tickerTray.textContent = "JACKPOT! Rare Potion unlocked!"; }
      else if (roll < 90) { runtimeState.inventory.mythic++; tickerTray.textContent = "JACKPOT! Mythic Potion unlocked!"; }
      else if (roll < 98) { runtimeState.inventory.legendary++; tickerTray.textContent = "JACKPOT! Legendary Potion unlocked!"; }
      else { runtimeState.inventory.divine++; tickerTray.textContent = "💥 UNREAL LAND! Divine Potion unlocked!"; }
    }

    // Potion exhaustion logic loops
    if (runtimeState.activePotion) {
      runtimeState.inventory[runtimeState.activePotion]--;
      runtimeState.activePotion = null;
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

  spinBtn.addEventListener('click', beginMotionSequence);
  ['basic', 'uncommon', 'rare', 'mythic', 'legendary', 'divine'].forEach(tier => {
    document.getElementById(`btn-${tier}`).addEventListener('click', () => toggleInventoryBuff(tier));
  });
});




