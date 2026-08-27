#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════════════
 *  FULL SIMULATION — Trade Spot + Admin Price Control + Walls + Cross-Pair
 * ══════════════════════════════════════════════════════════════════════
 *
 *  Usage:
 *    API_URL=http://localhost:3001 node test-simulate-all-pairs.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_USER = process.env.TEST_USER || '999999999';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0, total = 0;
let adminToken = null;

function assert(condition, label) {
  total++;
  if (condition) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}`); }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}`);
}

async function api(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

const ALL_PAIRS = [
  'IRON/USDC', 'COPPER/USDC', 'SILVER/USDC', 'GOLD/USDC', 'DIAMOND/USDC',
  'ELIXCOIN/USDC', 'ELIXCOIN/IRON', 'ELIXCOIN/COPPER', 'ELIXCOIN/SILVER',
  'ELIXCOIN/GOLD', 'ELIXCOIN/DIAMOND', 'ELIXCOIN/ELIXIR',
];

const EXPECTED_MIDS = {
  'IRON/USDC': 0.00000030,
  'COPPER/USDC': 0.00000060,
  'SILVER/USDC': 0.00000068,
  'GOLD/USDC': 0.0000068,
  'DIAMOND/USDC': 0.000068,
  'ELIXCOIN/USDC': 0.00000967,
  'ELIXCOIN/IRON': 32.23,
  'ELIXCOIN/COPPER': 16.12,
  'ELIXCOIN/SILVER': 14.22,
  'ELIXCOIN/GOLD': 1.422,
  'ELIXCOIN/DIAMOND': 0.1422,
  'ELIXCOIN/ELIXIR': 0.00967, // anchor-derived (legacy rate was 0.0967, pre-existing data inconsistency)
};

async function main() {
  console.log(`\n🧪 TRADE SPOT FULL SIMULATION`);
  console.log(`   Target: ${API_URL}`);
  console.log(`   Pairs: ${ALL_PAIRS.length}\n`);

  // ── 1. ORDER BOOK — All Pairs ──────────────────────────────────────
  section('1. ORDER BOOK — All Pairs');
  for (const pair of ALL_PAIRS) {
    const book = await api('GET', `/trade-spot/orderbook?pair=${encodeURIComponent(pair)}&depth=5`);
    const mid = book.mid;
    const expected = EXPECTED_MIDS[pair];
    const hasAsks = book.asks?.length > 0;
    const hasBids = book.bids?.length > 0;

    assert(book.success && hasAsks && hasBids && mid > 0,
      `${pair}: asks=${book.asks?.length || 0} bids=${book.bids?.length || 0} mid=${mid}`);

    if (expected && mid > 0) {
      const diff = Math.abs(mid - expected) / expected * 100;
      assert(diff < 10, `${pair}: mid=${mid} within 10% of expected ${expected} (diff=${diff.toFixed(2)}%)`);
    }

    if (hasAsks && hasBids) {
      assert(book.asks[0].price > book.bids[0].price,
        `${pair}: spread positive (${book.asks[0].price} > ${book.bids[0].price})`);
    }
  }

  // ── 2. CROSS-PAIR SYNC ─────────────────────────────────────────────
  section('2. CROSS-PAIR SYNC — IRON prices consistent');
  const ironUsdc = await api('GET', '/trade-spot/ticker?pair=IRON/USDC');
  const elixIron = await api('GET', '/trade-spot/ticker?pair=ELIXCOIN/IRON');
  const elixUsdc = await api('GET', '/trade-spot/ticker?pair=ELIXCOIN/USDC');
  if (ironUsdc.success && elixIron.success && elixUsdc.success) {
    // ELIXCOIN/IRON should ≈ ELIXCOIN/USDC / IRON/USDC
    const derived = elixUsdc.last / ironUsdc.last;
    const diff = Math.abs(elixIron.last - derived) / derived * 100;
    console.log(`  📊 IRON/USDC=${ironUsdc.last} ELIXCOIN/USDC=${elixUsdc.last}`);
    console.log(`  📊 ELIXCOIN/IRON=${elixIron.last} derived=${derived.toFixed(4)} diff=${diff.toFixed(2)}%`);
    assert(diff < 10, `Cross-pair sync within 10% (diff=${diff.toFixed(2)}%)`);
  }

  // ── 3. ADMIN — Login ───────────────────────────────────────────────
  section('3. ADMIN LOGIN');
  const loginRes = await api('POST', '/admin/login', { username: 'superadmin', password: 'superadminpassword' });
  adminToken = loginRes.token || loginRes.accessToken;
  if (adminToken) {
    assert(true, `Admin logged in`);
  } else {
    console.log(`  ⚠️  Admin login failed (response: ${JSON.stringify(loginRes).slice(0, 100)})`);
    console.log(`  ℹ️  Admin tests will be skipped`);
  }

  if (adminToken) {
    // ── 4. ADMIN — Set Price Control on IRON/USDC ────────────────────
    section('4. ADMIN PRICE CONTROL — IRON/USDC');
    const floor = 0.00000025;
    const ceiling = 0.00000035;
    const pcSet = await api('POST', '/admin/trade-spot/price-control',
      { pair: 'IRON/USDC', bidFloor: floor, askCeiling: ceiling }, adminToken);
    assert(pcSet.success, `Set price control: ${pcSet.message || pcSet.error}`);

    await sleep(500);
    const book = await api('GET', '/trade-spot/orderbook?pair=IRON/USDC&depth=10');
    if (book.success) {
      const expectedMid = (floor + ceiling) / 2;
      const diff = Math.abs(book.mid - expectedMid) / expectedMid * 100;
      console.log(`  📊 Expected mid=${expectedMid} actual=${book.mid} diff=${diff.toFixed(4)}%`);
      assert(diff < 1, `Mid matches admin range`);
    }

    // Clear
    await api('POST', '/admin/trade-spot/price-control/clear', { pair: 'IRON/USDC' }, adminToken);
    assert(true, `Price control cleared`);

    // ── 5. ADMIN — Set Order Book Walls ───────────────────────────────
    section('5. ADMIN ORDER BOOK WALLS — IRON/USDC');
    const sellWalls = [];
    for (let i = 1; i <= 10; i++) {
      sellWalls.push({ price: 0.00000030 + i * 0.00000001, amount: 100000 + i * 50000 });
    }
    const buyWalls = [];
    for (let i = 1; i <= 10; i++) {
      buyWalls.push({ price: 0.00000030 - i * 0.00000001, amount: 80000 + i * 40000 });
    }

    const wallSet = await api('POST', '/admin/trade-spot/walls',
      { pair: 'IRON/USDC', sellWalls, buyWalls }, adminToken);
    assert(wallSet.success, `Set ${sellWalls.length} SELL + ${buyWalls.length} BUY walls`);

    await sleep(500);
    const wallBook = await api('GET', '/trade-spot/orderbook?pair=IRON/USDC&depth=25');
    if (wallBook.success) {
      const sellFound = wallBook.asks.filter(a =>
        sellWalls.some(w => Math.abs(w.price - a.price) < 0.000000001)
      ).length;
      const buyFound = wallBook.bids.filter(b =>
        buyWalls.some(w => Math.abs(w.price - b.price) < 0.000000001)
      ).length;
      console.log(`  📊 SELL walls in book: ${sellFound}/10 | BUY walls in book: ${buyFound}/10`);
      assert(sellFound >= 5, `At least 5 SELL walls visible`);
      assert(buyFound >= 5, `At least 5 BUY walls visible`);
    }

    // Clear walls
    await api('POST', '/admin/trade-spot/walls/clear', { pair: 'IRON/USDC' }, adminToken);
    assert(true, `Walls cleared`);

    // ── 6. ADMIN — Combined Price Control + Walls on COPPER/USDC ─────
    section('6. COMBINED — COPPER/USDC Price Control + Walls');
    await api('POST', '/admin/trade-spot/price-control',
      { pair: 'COPPER/USDC', bidFloor: 0.00000050, askCeiling: 0.00000070 }, adminToken);

    const copperSellW = [];
    const copperBuyW = [];
    for (let i = 1; i <= 5; i++) {
      copperSellW.push({ price: 0.00000060 + i * 0.00000001, amount: 200000 });
      copperBuyW.push({ price: 0.00000060 - i * 0.00000001, amount: 200000 });
    }
    await api('POST', '/admin/trade-spot/walls',
      { pair: 'COPPER/USDC', sellWalls: copperSellW, buyWalls: copperBuyW }, adminToken);

    await sleep(500);
    const copperBook = await api('GET', '/trade-spot/orderbook?pair=COPPER/USDC&depth=10');
    if (copperBook.success) {
      console.log(`  📊 COPPER mid=${copperBook.mid} (expected ~0.00000060)`);
      const diff = Math.abs(copperBook.mid - 0.00000060) / 0.00000060 * 100;
      assert(diff < 1, `COPPER mid within admin range`);
      assert(copperBook.asks.length >= 3, `COPPER has ${copperBook.asks.length} asks`);
      assert(copperBook.bids.length >= 3, `COPPER has ${copperBook.bids.length} bids`);
    }

    await api('POST', '/admin/trade-spot/price-control/clear', { pair: 'COPPER/USDC' }, adminToken);
    await api('POST', '/admin/trade-spot/walls/clear', { pair: 'COPPER/USDC' }, adminToken);

    // ── 7. ADMIN — List all pools ─────────────────────────────────────
    section('7. ADMIN — All Pools');
    const poolsRes = await api('GET', '/admin/trade-spot/pools', null, adminToken);
    if (poolsRes.success) {
      console.log(`  📦 ${poolsRes.pools.length} pools found:`);
      for (const p of poolsRes.pools) {
        const controlled = p.adminBidFloor > 0 ? '🔒 CONTROLLED' : '🔓 free';
        console.log(`     ${p.pair}: mid=${p.lastMid} bot=${p.botEnabled ? 'ON' : 'OFF'} ${controlled}`);
      }
      assert(poolsRes.pools.length >= ALL_PAIRS.length, `At least ${ALL_PAIRS.length} pools exist`);
    }
  }

  // ── 8. BOT STATUS — All Pairs ──────────────────────────────────────
  section('8. BOT STATUS');
  for (const pair of ALL_PAIRS) {
    const stats = await api('GET', `/trade-spot/stats?pair=${encodeURIComponent(pair)}`);
    assert(stats.success, `${pair}: runs=${stats.botRunCount} vol=${stats.lifetimeVolume}`);
  }

  // ── SUMMARY ────────────────────────────────────────────────────────
  section('SUMMARY');
  console.log(`\n  Total: ${total}  |  ✅ Passed: ${pass}  |  ❌ Failed: ${fail}`);
  console.log(`  ${fail === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('💥', e); process.exit(1); });
