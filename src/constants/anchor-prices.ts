/**
 * Trade-spot USD anchors — single reference for valuing game coins in USD.
 *
 * Mirrors trade-spot/asset-registry.service.ts ASSET_SEEDS anchorUsdPrice.
 * Game coins have no CoinGecko listing, so these anchors are the ONLY
 * legitimate USD price. Unknown symbols must NEVER fall back to $1.0
 * (that fallback was a money printer: 1 ELIXCOIN ≈ $1 ≈ 10,000 ELIXIR).
 *
 * DIAMOND has no registry anchor; derived 10x GOLD per ELIX_RATES (10:1).
 * USDT/USDC are real stablecoins pinned at $1.
 */
export const ANCHOR_USD_PRICES: Record<string, number> = {
  USDC: 1.0,
  USDT: 1.0,
  ELIXCOIN: 0.00000967,
  IRON: 0.0000003,
  COPPER: 0.00000035,
  SILVER: 0.00000068,
  GOLD: 0.0000068,
  DIAMOND: 0.000068,
};
