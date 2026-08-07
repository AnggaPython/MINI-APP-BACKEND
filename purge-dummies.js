require('dotenv').config();
const mongoose = require('mongoose');

async function purge() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");
        
        const db = mongoose.connection.db;
        const users = db.collection('users');
        
        // Find them first to display how many we are deleting
        const count = await users.countDocuments({
            $or: [
                { telegramId: { $regex: 'dummy', $options: 'i' } },
                { username: { $regex: 'dummy', $options: 'i' } },
                { firstName: { $regex: 'dummy', $options: 'i' } }
            ]
        });
        
        console.log(`Found ${count} dummy users. Exterminating...`);
        
        const result = await users.deleteMany({
            $or: [
                { telegramId: { $regex: 'dummy', $options: 'i' } },
                { username: { $regex: 'dummy', $options: 'i' } },
                { firstName: { $regex: 'dummy', $options: 'i' } }
            ]
        });
        
        console.log(`✅ EXTERMINATION COMPLETE: Wiped ${result.deletedCount} illegal crew members from the database!`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

purge();
