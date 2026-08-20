"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelingService = exports.LEVEL_BENEFITS = exports.STAR_XP_PER_TIER = exports.hasEnoughMaterials = exports.getMilestoneRequirement = exports.isMilestoneLevel = exports.xpRequiredForLevel = exports.getLevelMultiplier = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const TOTAL_XP = 100_000;
const MAX_LEVEL = 100;
const getLevelMultiplier = (level) => {
    const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
    const baseMultiplier = 1 + (clamped - 1) * 0.01;
    const milestoneBonus = Math.floor(clamped / 5) * 0.10;
    return Math.round((baseMultiplier + milestoneBonus) * 100) / 100;
};
exports.getLevelMultiplier = getLevelMultiplier;
const xpRequiredForLevel = (level) => {
    if (level <= 1)
        return 0;
    return 500 + level * 10;
};
exports.xpRequiredForLevel = xpRequiredForLevel;
const MILESTONE_BASE = [
    { level: 5, common: 3, medium: 0, rare: 0 },
    { level: 10, common: 5, medium: 2, rare: 0 },
    { level: 15, common: 5, medium: 3, rare: 0 },
    { level: 20, common: 5, medium: 4, rare: 1 },
    { level: 25, common: 5, medium: 5, rare: 2 },
    { level: 30, common: 5, medium: 5, rare: 3 },
    { level: 35, common: 5, medium: 6, rare: 4 },
    { level: 40, common: 5, medium: 6, rare: 5 },
    { level: 45, common: 5, medium: 7, rare: 6 },
    { level: 50, common: 5, medium: 7, rare: 8 },
    { level: 55, common: 6, medium: 8, rare: 10 },
    { level: 60, common: 6, medium: 9, rare: 12 },
    { level: 65, common: 6, medium: 10, rare: 14 },
    { level: 70, common: 7, medium: 11, rare: 16 },
    { level: 75, common: 7, medium: 12, rare: 18 },
    { level: 80, common: 7, medium: 13, rare: 20 },
    { level: 85, common: 8, medium: 14, rare: 22 },
    { level: 90, common: 8, medium: 15, rare: 24 },
    { level: 95, common: 8, medium: 16, rare: 26 },
    { level: 100, common: 10, medium: 20, rare: 30 },
];
const isMilestoneLevel = (level) => {
    return level % 5 === 0 && level >= 5;
};
exports.isMilestoneLevel = isMilestoneLevel;
const getMilestoneRequirement = (level) => {
    if (!(0, exports.isMilestoneLevel)(level))
        return null;
    const req = MILESTONE_BASE.find(m => m.level === level);
    return req || null;
};
exports.getMilestoneRequirement = getMilestoneRequirement;
const hasEnoughMaterials = (userMaterials, requirement) => {
    const COMMON_MATERIALS = [
        'Rusty Nail', 'Wooden Handle', 'Iron Shard', 'Copper Wire', 'Flint Stone',
        'Hemp Rope', 'Leather Strap', 'Clay Mold', 'Tin Plate', 'Bone Fragment',
        'Sandstone Grit', 'Charcoal Lump', 'Glass Shard', 'Rubber Grip', 'Brass Rivet',
        'Canvas Wrap', 'Iron Bolt', 'Slate Chip', 'Twine Coil', 'Wax Seal',
        'Stone Wheel', 'Bronze Pin', 'Ash Plank', 'Cloth Strip', 'Pig Iron Ingot',
    ];
    const MEDIUM_MATERIALS = [
        'Steel Alloy', 'Silver Filament', 'Copper Coil', 'Magnet Core', 'Quartz Crystal',
        'Reinforced Spring', 'Tempered Glass', 'Gold Plating', 'Titanium Screw', 'Carbon Fiber',
        'Enchanted Rune', 'Sapphire Lens', 'Power Cell', 'Hydraulic Pump', 'Servo Motor',
        'Platinum Wire', 'Crystal Gear', 'Obsidian Blade', 'Neon Capacitor', 'Phantom Core',
        'Emerald Driver', 'Chrono Spring', 'Plasma Coil', 'Arcane Alloy', 'Magnetic Array',
    ];
    const RARE_MATERIALS = [
        'Void Diamond', 'Phoenix Feather', 'Dragon Scale', 'Celestial Core', 'Quantum Shard',
        'Starforged Ingot', 'Infinity Crystal', 'Thunder Essence', 'Abyss Pearl', 'Solar Fragment',
        'Lunar Prism', 'Chaos Ember', 'Titan Heart', 'Etherium Wire', 'Rift Anchor',
        'Frost Nova Core', 'Pyroclasm Gem', 'Nebula Dust', 'Singularity Bolt', 'Godslayer Alloy',
        'Timeless Gear', 'Dimension Key', 'Eternity Matrix', 'Primordial Ore', 'Omega Circuit',
    ];
    let haveCommon = 0;
    let haveMedium = 0;
    let haveRare = 0;
    for (const [name, count] of Object.entries(userMaterials)) {
        if (COMMON_MATERIALS.includes(name))
            haveCommon += count;
        else if (MEDIUM_MATERIALS.includes(name))
            haveMedium += count;
        else if (RARE_MATERIALS.includes(name))
            haveRare += count;
    }
    const missing = {};
    if (haveCommon < requirement.common)
        missing.COMMON = requirement.common - haveCommon;
    if (haveMedium < requirement.medium)
        missing.MEDIUM = requirement.medium - haveMedium;
    if (haveRare < requirement.rare)
        missing.RARE = requirement.rare - haveRare;
    return {
        enough: Object.keys(missing).length === 0,
        missing,
    };
};
exports.hasEnoughMaterials = hasEnoughMaterials;
const cumulativeXpToLevel = (level) => {
    let total = 0;
    for (let l = 2; l <= level; l++) {
        total += (0, exports.xpRequiredForLevel)(l);
    }
    return total;
};
exports.STAR_XP_PER_TIER = {
    Common: 100,
    Medium: 200,
    Rare: 500,
    COMMON: 100,
    MEDIUM: 200,
    RARE: 500,
};
const PICKAXE_UNLOCK_LEVELS = {
    Uncommon: 15,
    Rare: 25,
    Epic: 40,
    Legendary: 55,
    Mythic: 70,
};
exports.LEVEL_BENEFITS = [
    { level: 1, title: "Welcome Miner!", description: "Start your mining journey" },
    { level: 5, title: "Apprentice Miner", description: "Unlock Medium stones more often" },
    { level: 10, title: "Journeyman Miner", description: "+10% resource bonus on all saves" },
    { level: 15, title: "Skilled Miner", description: "Unlock Rare case boxes + FREE Uncommon Pickaxe!", pickaxeGrant: "Uncommon" },
    { level: 20, title: "Expert Miner", description: "+20% resource bonus on all saves" },
    { level: 25, title: "Veteran Miner", description: "Unlock Epic stones + FREE Rare Pickaxe!", pickaxeGrant: "Rare" },
    { level: 30, title: "Master Miner", description: "+30% resource bonus on all saves" },
    { level: 35, title: "Elite Miner", description: "Double daily login bonus" },
    { level: 40, title: "Champion Miner", description: "Unlock Legendary stones + FREE Epic Pickaxe!", pickaxeGrant: "Epic" },
    { level: 45, title: "Hero Miner", description: "+40% resource bonus on all saves" },
    { level: 50, title: "Legendary Miner", description: "Permanent +5% drop rate bonus" },
    { level: 55, title: "Mythic Miner", description: "FREE Legendary Pickaxe! 🔥", pickaxeGrant: "Legendary" },
    { level: 60, title: "Titan Miner", description: "+50% resource bonus on all saves" },
    { level: 65, title: "Cosmic Miner", description: "Free repair once per day" },
    { level: 70, title: "Divine Miner", description: "FREE Mythic Pickaxe! ⚡ + Permanent +10% drop rate", pickaxeGrant: "Mythic" },
    { level: 75, title: "Immortal Miner", description: "+60% resource bonus on all saves" },
    { level: 80, title: "Celestial Miner", description: "Free repair twice per day" },
    { level: 85, title: "Transcendent Miner", description: "Permanent +15% drop rate bonus" },
    { level: 90, title: "Supreme Miner", description: "+75% resource bonus on all saves" },
    { level: 95, title: "Eternal Miner", description: "Permanent +20% drop rate bonus" },
    { level: 100, title: "Ascended Miner", description: "MAX LEVEL! All benefits unlocked 🏆" },
];
let LevelingService = class LevelingService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async getUserLevel(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user) {
            return { success: false, error: "User not found" };
        }
        const currentXp = user.exp || 0;
        const level = user.level || 1;
        const pendingStars = user.pendingStars || 0;
        const lockedLevel = user.lockedLevel || null;
        const materials = user.materials || {};
        const xpForCurrentLevel = cumulativeXpToLevel(level);
        const xpForNextLevel = level >= MAX_LEVEL ? xpForCurrentLevel : cumulativeXpToLevel(level + 1);
        const xpInLevel = currentXp - xpForCurrentLevel;
        const xpNeeded = level >= MAX_LEVEL ? 0 : (0, exports.xpRequiredForLevel)(level + 1);
        const progress = level >= MAX_LEVEL ? 1 : (xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1);
        const currentBenefit = [...exports.LEVEL_BENEFITS].reverse().find(b => level >= b.level);
        const multiplier = (0, exports.getLevelMultiplier)(level);
        const nextMultiplier = level < MAX_LEVEL ? (0, exports.getLevelMultiplier)(level + 1) : multiplier;
        const milestoneRequirement = lockedLevel ? (0, exports.getMilestoneRequirement)(lockedLevel) : null;
        const materialCheck = milestoneRequirement ? (0, exports.hasEnoughMaterials)(materials, milestoneRequirement) : null;
        const COMMON_MATERIALS = [
            'Rusty Nail', 'Wooden Handle', 'Iron Shard', 'Copper Wire', 'Flint Stone',
            'Hemp Rope', 'Leather Strap', 'Clay Mold', 'Tin Plate', 'Bone Fragment',
            'Sandstone Grit', 'Charcoal Lump', 'Glass Shard', 'Rubber Grip', 'Brass Rivet',
            'Canvas Wrap', 'Iron Bolt', 'Slate Chip', 'Twine Coil', 'Wax Seal',
            'Stone Wheel', 'Bronze Pin', 'Ash Plank', 'Cloth Strip', 'Pig Iron Ingot',
        ];
        const MEDIUM_MATERIALS = [
            'Steel Alloy', 'Silver Filament', 'Copper Coil', 'Magnet Core', 'Quartz Crystal',
            'Reinforced Spring', 'Tempered Glass', 'Gold Plating', 'Titanium Screw', 'Carbon Fiber',
            'Enchanted Rune', 'Sapphire Lens', 'Power Cell', 'Hydraulic Pump', 'Servo Motor',
            'Platinum Wire', 'Crystal Gear', 'Obsidian Blade', 'Neon Capacitor', 'Phantom Core',
            'Emerald Driver', 'Chrono Spring', 'Plasma Coil', 'Arcane Alloy', 'Magnetic Array',
        ];
        const RARE_MATERIALS = [
            'Void Diamond', 'Phoenix Feather', 'Dragon Scale', 'Celestial Core', 'Quantum Shard',
            'Starforged Ingot', 'Infinity Crystal', 'Thunder Essence', 'Abyss Pearl', 'Solar Fragment',
            'Lunar Prism', 'Chaos Ember', 'Titan Heart', 'Etherium Wire', 'Rift Anchor',
            'Frost Nova Core', 'Pyroclasm Gem', 'Nebula Dust', 'Singularity Bolt', 'Godslayer Alloy',
            'Timeless Gear', 'Dimension Key', 'Eternity Matrix', 'Primordial Ore', 'Omega Circuit',
        ];
        let totalCommon = 0;
        let totalMedium = 0;
        let totalRare = 0;
        for (const [name, count] of Object.entries(materials)) {
            if (COMMON_MATERIALS.includes(name))
                totalCommon += count;
            else if (MEDIUM_MATERIALS.includes(name))
                totalMedium += count;
            else if (RARE_MATERIALS.includes(name))
                totalRare += count;
        }
        return {
            success: true,
            level,
            exp: currentXp,
            xpForNextLevel: xpNeeded,
            xpInLevel: Math.max(0, xpInLevel),
            progress,
            maxLevel: MAX_LEVEL,
            totalXp: TOTAL_XP,
            currentBenefit: currentBenefit || exports.LEVEL_BENEFITS[0],
            multiplier,
            nextMultiplier,
            pendingStars,
            lockedLevel,
            milestoneRequirement,
            materialCheck,
            materialCounts: { common: totalCommon, medium: totalMedium, rare: totalRare },
        };
    }
    async getLevelBenefits() {
        return {
            success: true,
            benefits: exports.LEVEL_BENEFITS,
            maxLevel: MAX_LEVEL,
            totalXp: TOTAL_XP,
        };
    }
    async grantPickaxesOnLevelUp(telegramId, oldLevel, newLevel) {
        const granted = [];
        for (const [pickaxe, unlockLevel] of Object.entries(PICKAXE_UNLOCK_LEVELS)) {
            if (newLevel >= unlockLevel && oldLevel < unlockLevel) {
                const updated = await this.userModel
                    .findOneAndUpdate({
                    telegramId,
                    ownedPickaxes: { $nin: [pickaxe] },
                }, {
                    $addToSet: { ownedPickaxes: { $each: ["Common", pickaxe] } },
                }, { returnDocument: "after" })
                    .exec();
                if (updated) {
                    granted.push(pickaxe);
                }
            }
        }
        return granted;
    }
    async awardStoneXp(telegramId, tier) {
        const starCount = Math.floor(Math.random() * 5) + 1;
        const xpPerStar = exports.STAR_XP_PER_TIER[tier] || 100;
        const xpAwarded = starCount * xpPerStar;
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        const oldLevel = user?.level || 1;
        const oldXp = user?.exp || 0;
        const newXp = oldXp + xpAwarded;
        let newLevel = 1;
        let xpRemaining = newXp;
        for (let l = 2; l <= MAX_LEVEL; l++) {
            const needed = (0, exports.xpRequiredForLevel)(l);
            if (xpRemaining >= needed) {
                xpRemaining -= needed;
                newLevel = l;
            }
            else {
                break;
            }
        }
        if (newLevel >= MAX_LEVEL)
            newLevel = MAX_LEVEL;
        const levelUp = newLevel > oldLevel;
        let finalLevel = newLevel;
        let pendingStars = 0;
        let lockedLevel = null;
        if (levelUp) {
            for (let l = oldLevel + 1; l <= newLevel; l++) {
                if ((0, exports.isMilestoneLevel)(l)) {
                    finalLevel = l - 1;
                    lockedLevel = l;
                    pendingStars = starCount;
                    break;
                }
            }
        }
        const updateFields = { exp: newXp };
        if (finalLevel !== oldLevel || !lockedLevel) {
            updateFields.level = finalLevel;
        }
        if (lockedLevel) {
            updateFields.lockedLevel = lockedLevel;
            updateFields.pendingStars = starCount;
        }
        await this.userModel
            .findOneAndUpdate({ telegramId }, { $set: updateFields })
            .exec();
        let pickaxeGrants = [];
        if (finalLevel > oldLevel) {
            try {
                pickaxeGrants = await this.grantPickaxesOnLevelUp(telegramId, oldLevel, finalLevel);
            }
            catch { }
        }
        return { starCount, xpAwarded, level: oldLevel, levelUp: finalLevel > oldLevel, newLevel: finalLevel, pickaxeGrants, pendingStars, lockedLevel };
    }
    async awardCaseXp(telegramId, tier) {
        return this.awardStoneXp(telegramId, tier);
    }
    async craftLevel(telegramId) {
        const user = await this.userModel.findOne({ telegramId }).lean().exec();
        if (!user) {
            return { success: false, error: "User not found" };
        }
        const lockedLevel = user.lockedLevel;
        if (!lockedLevel) {
            return { success: false, error: "No level is locked. Keep mining!" };
        }
        const requirement = (0, exports.getMilestoneRequirement)(lockedLevel);
        if (!requirement) {
            return { success: false, error: "Invalid milestone level" };
        }
        const materials = user.materials || {};
        const check = (0, exports.hasEnoughMaterials)(materials, requirement);
        if (!check.enough) {
            return { success: false, error: "Not enough materials. Keep mining case boxes!" };
        }
        const pendingStars = user.pendingStars || 0;
        const newLevel = lockedLevel;
        const update = {
            $set: {
                level: newLevel,
                lockedLevel: null,
                pendingStars: 0,
            },
        };
        const materialDecrement = {};
        const COMMON_MATERIALS = [
            'Rusty Nail', 'Wooden Handle', 'Iron Shard', 'Copper Wire', 'Flint Stone',
            'Hemp Rope', 'Leather Strap', 'Clay Mold', 'Tin Plate', 'Bone Fragment',
            'Sandstone Grit', 'Charcoal Lump', 'Glass Shard', 'Rubber Grip', 'Brass Rivet',
            'Canvas Wrap', 'Iron Bolt', 'Slate Chip', 'Twine Coil', 'Wax Seal',
            'Stone Wheel', 'Bronze Pin', 'Ash Plank', 'Cloth Strip', 'Pig Iron Ingot',
        ];
        const MEDIUM_MATERIALS = [
            'Steel Alloy', 'Silver Filament', 'Copper Coil', 'Magnet Core', 'Quartz Crystal',
            'Reinforced Spring', 'Tempered Glass', 'Gold Plating', 'Titanium Screw', 'Carbon Fiber',
            'Enchanted Rune', 'Sapphire Lens', 'Power Cell', 'Hydraulic Pump', 'Servo Motor',
            'Platinum Wire', 'Crystal Gear', 'Obsidian Blade', 'Neon Capacitor', 'Phantom Core',
            'Emerald Driver', 'Chrono Spring', 'Plasma Coil', 'Arcane Alloy', 'Magnetic Array',
        ];
        const RARE_MATERIALS = [
            'Void Diamond', 'Phoenix Feather', 'Dragon Scale', 'Celestial Core', 'Quantum Shard',
            'Starforged Ingot', 'Infinity Crystal', 'Thunder Essence', 'Abyss Pearl', 'Solar Fragment',
            'Lunar Prism', 'Chaos Ember', 'Titan Heart', 'Etherium Wire', 'Rift Anchor',
            'Frost Nova Core', 'Pyroclasm Gem', 'Nebula Dust', 'Singularity Bolt', 'Godslayer Alloy',
            'Timeless Gear', 'Dimension Key', 'Eternity Matrix', 'Primordial Ore', 'Omega Circuit',
        ];
        let commonNeeded = requirement.common;
        for (const [name, count] of Object.entries(materials)) {
            if (commonNeeded <= 0)
                break;
            if (COMMON_MATERIALS.includes(name) && count > 0) {
                const deduct = Math.min(count, commonNeeded);
                materialDecrement[`materials.${name}`] = -deduct;
                commonNeeded -= deduct;
            }
        }
        let mediumNeeded = requirement.medium;
        for (const [name, count] of Object.entries(materials)) {
            if (mediumNeeded <= 0)
                break;
            if (MEDIUM_MATERIALS.includes(name) && count > 0) {
                const deduct = Math.min(count, mediumNeeded);
                materialDecrement[`materials.${name}`] = -deduct;
                mediumNeeded -= deduct;
            }
        }
        let rareNeeded = requirement.rare;
        for (const [name, count] of Object.entries(materials)) {
            if (rareNeeded <= 0)
                break;
            if (RARE_MATERIALS.includes(name) && count > 0) {
                const deduct = Math.min(count, rareNeeded);
                materialDecrement[`materials.${name}`] = -deduct;
                rareNeeded -= deduct;
            }
        }
        await this.userModel
            .findOneAndUpdate({ telegramId }, { ...update, $inc: materialDecrement })
            .exec();
        let pickaxeGrants = [];
        try {
            pickaxeGrants = await this.grantPickaxesOnLevelUp(telegramId, newLevel - 1, newLevel);
        }
        catch { }
        return {
            success: true,
            newLevel,
            materialsUsed: materialDecrement,
        };
    }
};
exports.LevelingService = LevelingService;
exports.LevelingService = LevelingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LevelingService);
//# sourceMappingURL=leveling.service.js.map