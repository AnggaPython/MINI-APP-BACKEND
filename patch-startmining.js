const fs = require('fs');

let content = fs.readFileSync('src/users/users.service.ts', 'utf8');

if (content.includes('|| user.adTickets < 1) return { user: null, error: \'⚠️ ANTI-CHEAT')) {
    content = content.replace(
        /if \(\!user \|\| user.adTickets < 1\) return \{ user: null, error: '⚠️ ANTI-CHEAT: Your ad claim was rejected by Monetag Servers.' \};/g,
        `if (!user) return { user: null, error: 'User not found.' };`
    );
}

if (content.includes('$inc: { adTickets: -1 }')) {
    content = content.replace(
        /\{ \$set: \{ miningStartDate: new Date\(\), isMiningBoosted: false, isMiningNotified: false \}, \$inc: \{ adTickets: -1 \} \}/g,
        `{ $set: { miningStartDate: new Date(), isMiningBoosted: false, isMiningNotified: false } }`
    );
}

fs.writeFileSync('src/users/users.service.ts', content);
console.log('Backend Start Mining Patched!');

