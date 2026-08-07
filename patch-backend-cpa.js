const fs = require('fs');

let content = fs.readFileSync('src/campaigns/campaigns.service.ts', 'utf8');

// Add types
if (!content.includes('oneUserLifetime?: boolean')) {
    content = content.replace(
        /category: string, rewardPerClick: number, totalBudget: number, url\?: string/g,
        `category: string, rewardPerClick: number, totalBudget: number, url?: string, oneUserLifetime?: boolean, autoRenew?: boolean`
    );
}

// Modify logic
if (!content.includes('let minReward')) {
    content = content.replace(
        /const minReward = isWeb \? 30 : 50;/g,
        `let minReward = isWeb ? 30 : 50;\n\n        if (data.oneUserLifetime) {\n            minReward = Math.ceil(minReward * 1.5);\n        }`
    );
}

fs.writeFileSync('src/campaigns/campaigns.service.ts', content);
console.log('Backend CPA Patched!');
