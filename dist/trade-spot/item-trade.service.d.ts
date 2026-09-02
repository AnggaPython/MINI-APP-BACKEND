import { Model } from "mongoose";
import { User } from "../users/schemas/user.schema";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";
export declare class ItemTradeService {
    private readonly userModel;
    private readonly buffCollectionsService;
    private readonly logger;
    constructor(userModel: Model<User>, buffCollectionsService: BuffItemCollectionsService);
    getItemBalance(telegramId: string, base: string): Promise<number>;
    isItem(base: string): boolean;
    isMaterial(base: string): boolean;
    grantItem(telegramId: string, base: string, qty: number): Promise<boolean>;
    deductItem(telegramId: string, base: string, qty: number): Promise<boolean>;
}
