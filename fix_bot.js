const fs = require('fs');
let file = 'src/trade-spot/trade-spot.service.ts';
let txt = fs.readFileSync(file, 'utf8');

const targetLoop = `    for (const side of sides) {
      // Create a sensible retail-sized target quote volume
      // so the bot simulates normal traders (e.g., small fractions)
      const targetQuoteVolume = Math.random() * 1.5 + 0.2;
      let amount = targetQuoteVolume / mid;

      // Hard cap the amount so MM bot doesn't spam 100M unit orders
      // which frightens casual "normie" users. Max looks around 20k-60k.
      if (amount > 80_000) {
        amount = Math.random() * 40_000 + 10_000;
      }

      amount = round2(amount);

      const price = round8(mid);`;

const replacementLoop = `    for (const side of sides) {
      // Add random organic human-like delay (2 to 8 seconds) between trades
      // so they don't print as a single robotic block.
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 6000) + 2000));

      // Calculate organic target quote volume (bolder sizes: 10 to 300 equivalent)
      const targetQuoteVolume = Math.random() * 290 + 10;
      let amount = targetQuoteVolume / mid;

      // Enforce hundreds or thousands bounds
      if (amount < 150) {
        amount = Math.random() * 850 + 150; // min 150 to 1000
      } else if (amount > 150_000) {
        amount = Math.random() * 50_000 + 20_000; // max reasonable whale chunk
      }
      
      // Use round integers for cleaner orderbook aesthetics
      amount = Math.floor(amount);

      const price = round8(mid);`;

txt = txt.replace(targetLoop, replacementLoop);
fs.writeFileSync(file, txt);
