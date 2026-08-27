const fs = require('fs');
let file = 'src/trade-spot/trade-spot.service.ts';
let txt = fs.readFileSync(file, 'utf8');

const executeFillTarget = `  private async executeFill(
    pair: string,
    telegramId: string,
    side: "BUY" | "SELL",
    amount: number,
    price: number,
    source: "BOT" | "USER",
  ) {
    if (source === "USER" && !telegramId)
      return { success: false, error: "Missing account" };

    const total = round4(amount * price);
    const pool = await this.getPool(pair);
    const [base, quote] = pair.split("/");
    const baseKey =
      base === "ELIXIR" ? "elixirBalance" : \`cryptoBalances.\${base}\`;
    const quoteKey =
      quote === "ELIXIR" ? "elixirBalance" : \`cryptoBalances.\${quote}\`;`;

const executeFillReplacement = `  private async executeFill(
    pair: string,
    telegramId: string,
    side: "BUY" | "SELL",
    amount: number,
    basePrice: number,
    source: "BOT" | "USER",
  ) {
    if (source === "USER" && !telegramId)
      return { success: false, error: "Missing account" };

    const pool = await this.getPool(pair);
    
    // [GLITCH FIX] Anti-Whale Slippage Arbitrage Defense
    // Force the execution price to immediately reflect the impact of the order size,
    // thereby destroying flat-rate arbitrage loopholes across large volumes.
    let price = basePrice;
    let shiftPct = 0;
    
    if (source === "USER") {
        const impactRatio = amount / Math.max(1, pool.baseReserve || 10_000_000);
        shiftPct = Math.min(0.05, impactRatio * 0.5); // Max 5% penalty per trade slice
        
        if (side === "BUY") {
            price = round8(basePrice * (1 + shiftPct));
        } else {
            price = round8(basePrice * (1 - shiftPct));
        }
    }

    const total = round4(amount * price);
    const [base, quote] = pair.split("/");
    const baseKey =
      base === "ELIXIR" ? "elixirBalance" : \`cryptoBalances.\${base}\`;
    const quoteKey =
      quote === "ELIXIR" ? "elixirBalance" : \`cryptoBalances.\${quote}\`;`;

txt = txt.replace(executeFillTarget, executeFillReplacement);

const newMidBuyTarget = `      // [NEW] Elastic Market Dynamics: Calculate organic price impact (Max 5% slip per transaction)
      const impactRatio = amount / Math.max(1, pool.baseReserve || 10_000_000);
      const shiftPct = Math.min(0.05, impactRatio * 0.5); // 0.5 elasticity dampener
      const newMid = round8(pool.lastMid * (1 + shiftPct));

      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: -amount,
              quoteReserve: total,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(price - pool.lastMid) * amount,
            },
            $set: {
              lastMid: newMid,
            },
          },
        )
        .exec();`;

const newMidBuyReplacement = `      // Update AMM Bounds
      const newMid = source === "USER" ? round8(pool.lastMid * (1 + shiftPct)) : pool.lastMid;

      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: -amount,
              quoteReserve: total,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(price - pool.lastMid) * amount,
            },
            $set: {
              lastMid: newMid,
            },
          },
        )
        .exec();`;

txt = txt.replace(newMidBuyTarget, newMidBuyReplacement);

const newMidSellTarget = `      // [NEW] Elastic Market Dynamics
      const impactRatio = amount / Math.max(1, pool.baseReserve || 10_000_000);
      const shiftPct = Math.min(0.05, impactRatio * 0.5);
      const newMid = round8(pool.lastMid * (1 - shiftPct));

      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: amount,
              quoteReserve: -proceeds,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(pool.lastMid - price) * amount,
            },
            $set: {
              lastMid: newMid,
            },
          },
        )
        .exec();`;

const newMidSellReplacement = `      // Update AMM Bounds
      const newMid = source === "USER" ? round8(pool.lastMid * (1 - shiftPct)) : pool.lastMid;

      await this.poolModel
        .updateOne(
          { pair },
          {
            $inc: {
              baseReserve: amount,
              quoteReserve: -proceeds,
              platformFeesAccumulated: fee,
              spreadProfitAccumulated: Math.abs(pool.lastMid - price) * amount,
            },
            $set: {
              lastMid: newMid,
            },
          },
        )
        .exec();`;

txt = txt.replace(newMidSellTarget, newMidSellReplacement);

fs.writeFileSync(file, txt);
