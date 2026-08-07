const fs = require('fs');
let sFile = fs.readFileSync('src/bank/bank.service.ts', 'utf8');
let cFile = fs.readFileSync('src/bank/bank.controller.ts', 'utf8');

sFile = sFile.replace(/async toggleAutoClaim\(telegramId: string, autoClaim: boolean\) \{[\s\S]+?\}/,
`async toggleStakeConfig(telegramId: string, stakeId: string, autoClaim: boolean, autoReinvest: boolean) {
        const updateDoc: any = {};
        if (typeof autoClaim === 'boolean') updateDoc.autoClaim = autoClaim;
        if (typeof autoReinvest === 'boolean') updateDoc.autoReinvest = autoReinvest;
        if (Object.keys(updateDoc).length === 0) return { error: 'No config provided' };

        const stake = await this.stakeModel.findOneAndUpdate({ _id: stakeId, telegramId, status: 'active' }, { $set: updateDoc }, { new: true }).exec();
        if (!stake) return { error: 'Active stake not found' };
        return { success: true, stake };
    }`);

cFile = cFile.replace(/@Post\('autoclaim'\)[\s\S]+?\/\/ end maybe?/, ""); // Delete old autoclaim
cFile = cFile.replace(/@Post\('autoclaim'\)[\s\S]+?\}\n\}/, 
`@Post('stake/toggle')
    async toggleStakeConfig(@Body() body: { telegramId: string; stakeId: string; autoClaim?: boolean; autoReinvest?: boolean }) {
        if (!body.telegramId || !body.stakeId) return { error: 'Incomplete parameters' };
        return await this.bankService.toggleStakeConfig(body.telegramId, body.stakeId, body.autoClaim as any, body.autoReinvest as any);
    }
}`);

// Patch handleAutoClaim
sFile = sFile.replace(
`                    stake.lastClaimDate = now > stake.maturityDate ? stake.maturityDate : now;
                    await stake.save();

                    await this.usersService.creditRewardAndLogTask(stake.telegramId, earned, 'Yield (Auto)');

                    await new this.bankLogModel({
                        telegramId: stake.telegramId,
                        actionType: 'Claim Elixir',
                        amount: earned
                    }).save();`,
`                    stake.lastClaimDate = now > stake.maturityDate ? stake.maturityDate : now;
                    if (stake.autoReinvest) {
                        stake.amount += earned;
                        await stake.save();
                        await new this.bankLogModel({ telegramId: stake.telegramId, actionType: 'Claim Elixir', amount: earned }).save();
                    } else {
                        await stake.save();
                        await this.usersService.creditRewardAndLogTask(stake.telegramId, earned, 'Yield (Auto)');
                        await new this.bankLogModel({ telegramId: stake.telegramId, actionType: 'Claim Elixir', amount: earned }).save();
                    }`
);

// Patch claimEarnings
sFile = sFile.replace(
`                    const updatedStake = await this.stakeModel.findOneAndUpdate(
                        { _id: stake._id, lastClaimDate: stake.lastClaimDate },
                        { $set: { lastClaimDate: nextClaimDate } },
                        { new: true }
                    ).exec();

                    if (updatedStake) {
                        hasProcessedValid = true;
                        totalClaim += earned;
                    }`,
`                    if (stake.autoReinvest) {
                        const updatedStake = await this.stakeModel.findOneAndUpdate(
                            { _id: stake._id, lastClaimDate: stake.lastClaimDate },
                            { $set: { lastClaimDate: nextClaimDate }, $inc: { amount: earned } },
                            { new: true }
                        ).exec();
                        if (updatedStake) hasProcessedValid = true;
                    } else {
                        const updatedStake = await this.stakeModel.findOneAndUpdate(
                            { _id: stake._id, lastClaimDate: stake.lastClaimDate },
                            { $set: { lastClaimDate: nextClaimDate } },
                            { new: true }
                        ).exec();
                        if (updatedStake) {
                            hasProcessedValid = true;
                            totalClaim += earned;
                        }
                    }`
);

// Update getStats activeStakes map
sFile = sFile.replace(
`                pendingYield: currentYield,
                autoClaim: s.autoClaim
            };`,
`                pendingYield: currentYield,
                autoClaim: s.autoClaim,
                autoReinvest: s.autoReinvest
            };`
);


fs.writeFileSync('src/bank/bank.service.ts', sFile);
fs.writeFileSync('src/bank/bank.controller.ts', cFile);
console.log('Backend Bank Scripts Patched');
