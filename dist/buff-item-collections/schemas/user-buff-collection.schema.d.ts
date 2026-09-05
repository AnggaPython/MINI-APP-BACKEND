import { Document } from "mongoose";
export type UserBuffCollectionDocument = UserBuffCollection & Document;
export declare class ItemInstance {
    instanceId: string;
    baseItemId: string;
    acquiredAt: Date;
}
export declare const ItemInstanceSchema: any;
export declare class UserBuffCollection {
    telegramId: string;
    inventory: ItemInstance[];
    activeInstanceIds: string[];
}
export declare const UserBuffCollectionSchema: any;
