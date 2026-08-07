const fs = require('fs');

// Patch User Schema
let schema = fs.readFileSync('src/users/schemas/user.schema.ts', 'utf8');
if (!schema.includes('totalAdRevenueGeneratedUSD')) {
    schema = schema.replace(
        /@Prop\({ default: 0 }\)\n  adTickets: number;/g,
        `@Prop({ default: 0 })\n  adTickets: number;\n\n  @Prop({ default: 0 })\n  totalAdRevenueGeneratedUSD: number;`
    );
    fs.writeFileSync('src/users/schemas/user.schema.ts', schema);
}

// Patch Controller
let controller = fs.readFileSync('src/users/users.controller.ts', 'utf8');
if (!controller.includes('@Query(\'payout\')')) {
    controller = controller.replace(
        /@Query\('ymid'\) ymid: string/g,
        `@Query('ymid') ymid: string,\n        @Query('payout') payout?: string`
    );
    controller = controller.replace(
        /await this.usersService.registerMonetagTicket\(userid\);/g,
        `const payoutUSD = parseFloat(payout || "0") || 0;\n        await this.usersService.registerMonetagTicket(userid, payoutUSD);`
    );
    fs.writeFileSync('src/users/users.controller.ts', controller);
}

// Patch Service
let service = fs.readFileSync('src/users/users.service.ts', 'utf8');
if (!service.includes('payoutUSD: number = 0')) {
    service = service.replace(
        /async registerMonetagTicket\(telegramId: string\) \{/g,
        `async registerMonetagTicket(telegramId: string, payoutUSD: number = 0) {`
    );
    service = service.replace(
        /\{ \$inc: \{ adTickets: 1 \} \}/g,
        `{ $inc: { adTickets: 1, totalAdRevenueGeneratedUSD: payoutUSD } }`
    );
    // Patch Admin Dashboard Stats
    service = service.replace(
        /\{ elixirBalance: 1 \}/g,
        `{ elixirBalance: 1, totalAdRevenueGeneratedUSD: 1 }`
    );
    service = service.replace(
        /const totalElixir = users.reduce\(\(sum, u\) => sum \+ \(u.elixirBalance \|\| 0\), 0\);/g,
        `const totalElixir = users.reduce((sum, u) => sum + (u.elixirBalance || 0), 0);\n        const totalAdRevenueUSD = users.reduce((sum, u) => sum + (u.totalAdRevenueGeneratedUSD || 0), 0);`
    );
    service = service.replace(
        /totalElixir, \/\/ Pass raw Total Elixir/g,
        `totalElixir, \/\/ Pass raw Total Elixir\n            totalAdRevenueUSD,`
    );
    fs.writeFileSync('src/users/users.service.ts', service);
}

console.log('Backend patched!');
