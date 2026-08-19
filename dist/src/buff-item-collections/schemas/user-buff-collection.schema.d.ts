import { Document } from "mongoose";
export type UserBuffCollectionDocument = UserBuffCollection & Document;
export declare class UserBuffCollection {
    telegramId: string;
    ownedBuffIds: string[];
    activeBuffIds: string[];
}
export declare const UserBuffCollectionSchema: any;
