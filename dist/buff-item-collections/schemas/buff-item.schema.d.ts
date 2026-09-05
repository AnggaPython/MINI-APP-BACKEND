import { Document } from "mongoose";
export type BuffItemDocument = BuffItem & Document;
export type BuffType = "ATK" | "ECONOMY" | "DURABILITY" | "DROPRATE";
export type BuffRarity = "COMMON" | "MEDIUM" | "RARE" | "ULTRA_RARE";
export declare class BuffItem {
    buffId: string;
    collectionItemId: string;
    buffType: BuffType;
    rarity: BuffRarity;
    buffValue: number;
    buffUnit: "flat" | "percent";
    name: string;
    description: string;
    icon: string;
}
export declare const BuffItemSchema: any;
