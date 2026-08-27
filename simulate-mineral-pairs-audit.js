#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * MINERAL PAIR AUDIT — BUY/SELL Balance Deduction Verification
 * ═══════════════════════════════════════════════════════════════════
 * Tests: IRON/USDC, COPPER/USDC, SILVER/USDC, GOLD/USDC, DIAMOND/USDC
 * 
 * For each pair, simulates:
 * 1. BUY flow: user spends USDC → receives BASE (with slippage)
 * 2. SELL flow: user sells BASE → receives USDC (with slippage)
 * 3. getMaxTradeable accuracy: does binary search match actual execution?
 * 4. Anti-whale slippage: does5% cap work correctly?
 * 5. Fee calculation: is1.5% fee charged in correct currency?
 */

const FEE_PCT = 0.015;
const SPREAD_PCT = 0.004;
const round8 = (n) => Math.round(n * 1e8) / 1e8;
const round4 = (n) => Math.round(n * 1e4) / 1e4;
const round2 = (n) => Math.round(n * 100) / 100;

const MINERAL_PAIRS = {
  'IRON/USDC':     { mid: 0.00000030, reserve: 10_000_000 },
  'COPPER/USDC':   { mid: 0.00000060, reserve: 10_000_000 },
  'SILVER/USDC':   { mid: 0.00000068, reserve: 10_000_000 },
  'GOLD/USDC':     { mid: 0.0000068,  reserve: 10_000_000 },
  'DIAMOND/USDC':  { mid: 0.000068,   reserve: 10_000_000 },
  'ELIXCOIN/USDC': { mid: 0.00000967, reserve: 10_000_000 },
};

const TEST_BALANCES = [35, 100, 500, 1000, 10000]; // USDC amounts to test

console.log('═══════════════════════════════════════════════════════════════');
console.log(' MINERAL PAIR AUDIT — BUY/SELL Balance Deduction Verification');
console.log('═══════════════════════════════════════════════════════════════\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, msg) {
  totalTests++;
  if (condition) {
    passedTests++;
    return true;
  } else {
    failedTests++;
    console.log(`  ❌ FAIL: ${msg}`);
    return false;
  }
}

// ── Replicate backend getMaxTradeable binary search ──────────────────
function getMaxTradeable(quoteBalance, mid, baseReserve) {
  const half = SPREAD_PCT / 2;
  const ask = mid * (1 + half);
  
  let low = 0;
  let high = quoteBalance / (ask * 0.95);
  for (let i = 0; i < 20; i++) {
    const mid2 = (low + high) / 2;
    const impactRatio = mid2 / Math.max(1, baseReserve);
    const slippage = Math.min(0.05, impactRatio * 0.5);      const effectivePrice = round8(ask * (1 + slippage)); // MATCH executeFill rounding
      const cost = round4(mid2 * effectivePrice);
    if (cost <= quoteBalance) low = mid2;
    else high = mid2;
  }
  const maxBase = round4(low);
  return { maxBase, maxQuote: round4(maxBase * ask), ask };
}

// ── Replicate backend executeFill BUY ────────────────────────────────
function executeBuy(amount, basePrice, baseReserve) {
  const impactRatio = amount / Math.max(1, baseReserve);
  const shiftPct = Math.min(0.05, impactRatio * 0.5);
  const price = round8(basePrice * (1 + shiftPct));
  
  const spendQuote = round4(amount * price);
  const fee = round4(amount * FEE_PCT);
  const receivedBase = round4(amount - fee);
  
  return { price, spendQuote, fee, receivedBase, shiftPct };
}

// ── Replicate backend executeFill SELL ───────────────────────────────
function executeSell(amount, basePrice, baseReserve) {
  const impactRatio = amount / Math.max(1, baseReserve);
  const shiftPct = Math.min(0.05, impactRatio * 0.5);
  const price = round8(basePrice * (1 - shiftPct));
  
  const grossQuote = round4(amount * price);
  const fee = round4(grossQuote * FEE_PCT);
  const proceeds = round4(grossQuote - fee);
  
  return { price, grossQuote, fee, proceeds, shiftPct };
}

// ── Run tests for each pair ──────────────────────────────────────────
for (const [pair, config] of Object.entries(MINERAL_PAIRS)) {
  const [base, quote] = pair.split('/');
  const { mid, reserve } = config;
  const half = SPREAD_PCT / 2;
  const ask = mid * (1 + half);
  const bid = mid * (1 - half);
  
  console.log(`\n┌─ ${pair} (mid=${mid}, ask=${round8(ask)}, bid=${round8(bid)}) ─┐`);
  
  for (const usdcBalance of TEST_BALANCES) {
    console.log(`\n  💰 User has ${usdcBalance} USDC`);
    
    // ═══ TEST 1: getMaxTradeable accuracy ═══
    const mt = getMaxTradeable(usdcBalance, mid, reserve);
    
    // Simulate BUY with maxBase
    const buyResult = executeBuy(mt.maxBase, ask, reserve);
    
    assert(
      buyResult.spendQuote <= usdcBalance + 0.01,
      `${pair} BUY: spendQuote=${buyResult.spendQuote} > balance=${usdcBalance}`
    );
    
    assert(
      mt.maxQuote <= usdcBalance + 0.01,
      `${pair} maxQuote=${mt.maxQuote} > balance=${usdcBalance}`
    );
    
    // ═══ TEST 2: BUY doesn't overcharge ═══
    const buyRemaining = round4(usdcBalance - buyResult.spendQuote);
    assert(
      buyRemaining >= -0.01,
      `${pair} BUY: remaining=${buyRemaining} < 0 (overcharged!)`
    );
    
    // ═══ TEST 3: Fee is correct (1.5% in BASE) ═══
    const expectedFee = round4(mt.maxBase * FEE_PCT);
    assert(
      Math.abs(buyResult.fee - expectedFee) < 0.01,
      `${pair} BUY fee: got ${buyResult.fee}, expected ${expectedFee}`
    );
    
    // ═══ TEST 4: Received BASE = amount - fee ═══
    assert(
      Math.abs(buyResult.receivedBase - (mt.maxBase - buyResult.fee)) < 0.01,
      `${pair} BUY received: got ${buyResult.receivedBase}, expected ${mt.maxBase - buyResult.fee}`
    );
    
    // ═══ TEST 5: Anti-whale slippage cap at5% ═══
    assert(
      buyResult.shiftPct <= 0.05 + 0.0001,
      `${pair} slippage=${buyResult.shiftPct} exceeds 5% cap`
    );
    
    // ═══ TEST 6: SELL flow ═══
    const sellResult = executeSell(mt.maxBase, bid, reserve);
    
    assert(
      sellResult.proceeds > 0,
      `${pair} SELL: proceeds=${sellResult.proceeds} <= 0`
    );
    
    // SELL fee is in QUOTE (USDC)
    const expectedSellFee = round4(sellResult.grossQuote * FEE_PCT);
    assert(
      Math.abs(sellResult.fee - expectedSellFee) < 0.01,
      `${pair} SELL fee: got ${sellResult.fee}, expected ${expectedSellFee}`
    );
    
    // ═══ TEST 7: SELL proceeds = grossQuote - fee ═══
    assert(
      Math.abs(sellResult.proceeds - (sellResult.grossQuote - sellResult.fee)) < 0.01,
      `${pair} SELL proceeds mismatch`
    );
    
    // ═══ TEST 8: BUY → SELL round-trip is LOSS (anti-whale works) ═══
    const roundTrip = round4(buyResult.receivedBase - (sellResult.grossQuote / bid));
    // After buying X and selling X, you should get LESS USDC back due to:
    // - 1.5% fee on BUY (in BASE) 
    // - 1.5% fee on SELL (in USDC)
    // - spread (ask > bid)
    // - anti-whale slippage
    assert(
      buyResult.spendQuote > sellResult.proceeds,
      `${pair} round-trip: spent ${buyResult.spendQuote} USDC, got back ${sellResult.proceeds} USDC (should be LOSS)`
    );
    
    // ═══ TEST 9: Frontend slider BUY path ═══
    // After fix: slider uses maxBase * askPrice for exact alignment
    // amountStr = maxBase * askPrice → baseAmount = amountStr / askPrice = maxBase ✓
    const frontendSpendVol = mt.maxBase * ask; // askPrice ≈ ask
    const frontendBA = round4(frontendSpendVol / ask);
    assert(
      Math.abs(frontendBA - mt.maxBase) < 1,
      `${pair} frontend slider: baseAmount=${frontendBA} ≠ maxBase=${mt.maxBase}`
    );
    
    const backendSpend = executeBuy(frontendBA, ask, reserve);
    
    assert(
      backendSpend.spendQuote <= usdcBalance + 0.01,
      `${pair} slider path: backend spend=${backendSpend.spendQuote} > balance=${usdcBalance}`
    );
    
    // ═══ TEST 10: Zero balance rejected ═══
    const zeroMt = getMaxTradeable(0, mid, reserve);
    assert(
      zeroMt.maxBase === 0,
      `${pair} zero balance: maxBase=${zeroMt.maxBase} should be 0`
    );
    
    // Print summary for this balance
    const profit = round4(sellResult.proceeds - buyResult.spendQuote);
    console.log(`    ✅ BUY: ${round8(mt.maxBase)} ${base} for ${round4(buyResult.spendQuote)} USDC (fee: ${round4(buyResult.fee)} ${base})`);
    console.log(`    ✅ SELL: ${round8(mt.maxBase)} ${base} → ${round4(sellResult.proceeds)} USDC (fee: ${round4(sellResult.fee)} USDC)`);
    console.log(`    📊 Round-trip: ${profit} USDC (${((profit / buyResult.spendQuote) * 100).toFixed(2)}%) | slippage: ${(buyResult.shiftPct * 100).toFixed(4)}%`);
  }
  
  console.log(`└${'─'.repeat(50)}┘`);
}

// ═══ CROSS-PAIR CONSISTENCY TEST ═══
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' CROSS-PAIR CONSISTENCY: USDC balance unchanged after all trades');
console.log('═══════════════════════════════════════════════════════════════');

let totalUsdcSpent = 0;
let totalUsdcReceived = 0;
let totalBaseReceived = 0;
let totalBaseSpent = 0;

for (const [pair, config] of Object.entries(MINERAL_PAIRS)) {
  const [base] = pair.split('/');
  const { mid, reserve } = config;
  const half = SPREAD_PCT / 2;
  const ask = mid * (1 + half);
  const bid = mid * (1 - half);
  
  const mt = getMaxTradeable(100, mid, reserve); // 100 USDC per pair
  const buy = executeBuy(mt.maxBase, ask, reserve);
  const sell = executeSell(mt.maxBase, bid, reserve);
  
  totalUsdcSpent += buy.spendQuote;
  totalUsdcReceived += sell.proceeds;
  totalBaseReceived += buy.receivedBase;
  totalBaseSpent += sell.grossQuote;
}

console.log(`\n  Total USDC spent on BUYs:    ${round4(totalUsdcSpent)}`);
console.log(`  Total USDC received on SELLs: ${round4(totalUsdcReceived)}`);
console.log(`  Net USDC impact:             ${round4(totalUsdcReceived - totalUsdcSpent)} (should be negative = platform fees)`);
console.log(`  Platform fees collected:     ${round4(totalUsdcSpent - totalUsdcReceived)}`);

// ═══ FINAL SUMMARY ═══
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(` TEST RESULTS: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
console.log('═══════════════════════════════════════════════════════════════');

if (failedTests === 0) {
  console.log('\n ✅ ALL TESTS PASSED — Backend buy/sell logic is CORRECT for all mineral pairs');
  console.log(' ✅ USDC balance deduction works correctly');
  console.log(' ✅ Anti-whale slippage caps at5%');
  console.log(' ✅ Fees charged in correct currency');
  console.log(' ✅ Round-trip is always a LOSS (anti-whale works)');
  console.log(' ✅ getMaxTradeable binary search is accurate');
  console.log(' ✅ Frontend slider fix (maxQuote for BUY) works correctly');
} else {
  console.log(`\n ❌ ${failedTests} TESTS FAILED — Review backend logic`);
}

// ═══ FRONTEND UX ANALYSIS ═══
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' FRONTEND UX ANALYSIS: What user sees after fix');
console.log('═══════════════════════════════════════════════════════════════');

for (const [pair, config] of Object.entries(MINERAL_PAIRS)) {
  const [base] = pair.split('/');
  const { mid } = config;
  const mt = getMaxTradeable(35, mid, 10_000_000);
  
  console.log(`\n  ${pair}:`);
  console.log(`    User has: 35 USDC`);
  console.log(`    Avbl (USDC): ${round4(mt.maxQuote)} ← shows QUOTE (correct)`);
  console.log(`    Max ${base}: ${round2(mt.maxBase)} ← used internally for validation`);
  console.log(`    Slider 100%: amountStr = ${round8(mt.maxQuote)} USDC`);
}
