import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../users/schemas/user.schema";
import { isItemBase, isMaterialBase, slugToMaterialName } from "./item-sync";
import { BuffItemCollectionsService } from "../buff-item-collections/buff-item-collections.service";

/**
 * Item-specific trading logic — separated from mineral/coin trading.
 *
 * Handles:
 * - Balance checking for items (material tools + buff collection items)
 * - Granting items on BUY
 * - Deducting items on SELL
 *
 * This service is called by TradeSpotService.executeFill() when the base
 * asset is an item (NOT a coin/mineral).
 */
@Injectable()
export class ItemTradeService {
  private readonly logger = new Logger(ItemTradeService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly buffCollectionsService: BuffItemCollectionsService,
  ) {}

  // ── Balance ──────────────────────────────────────────────────────────────

  /**
   * Get item balance from the correct storage.
   * Material tools → user.materials["Rusty Nail"]
   * Buff items → UserBuffCollection.inventory count
   */
  async getItemBalance(telegramId: string, base: string): Promise<number> {
    if (isMaterialBase(base)) {
      const displayName = slugToMaterialName(base);
      const user = await this.userModel.findOne({ telegramId }).lean().exec();
      const materials = (user as any)?.materials as Record<string, number> | undefined;
      return materials?.[displayName] ?? 0;
    }
    // Buff collection item
    return this.buffCollectionsService.countBuffInstances(telegramId, base.toLowerCase());
  }

  /**
   * Check if an asset is an item (not a coin/mineral).
   */
  isItem(base: string): boolean {
    return isItemBase(base);
  }

  /**
   * Check if an asset is a material tool.
   */
  isMaterial(base: string): boolean {
    return isMaterialBase(base);
  }

  // ── Grant (BUY) ─────────────────────────────────────────────────────────

  /**
   * Grant item to its proper storage after a BUY fill.
   * @returns true if successful
   */
  async grantItem(telegramId: string, base: string, qty: number): Promise<boolean> {
    if (qty <= 0) return true;
    try {
      if (isMaterialBase(base)) {
        const displayName = slugToMaterialName(base);
        await this.buffCollectionsService.grantMaterial(telegramId, displayName, qty);
      } else {
        const itemId = base.toLowerCase();
        for (let i = 0; i < qty; i++) {
          await this.buffCollectionsService.grantBuffItem(telegramId, itemId);
        }
      }
      return true;
    } catch (err) {
      this.logger.warn(`[ItemTrade] grantItem ${base}: ${(err as any)?.message}`);
      return false;
    }
  }

  // ── Deduct (SELL) ────────────────────────────────────────────────────────

  /**
   * Deduct item from its proper storage after a SELL fill.
   * @returns true if successful
   */
  async deductItem(telegramId: string, base: string, qty: number): Promise<boolean> {
    if (qty <= 0) return true;
    try {
      if (isMaterialBase(base)) {
        const displayName = slugToMaterialName(base);
        await this.buffCollectionsService.removeMaterial(telegramId, displayName, qty);
      } else {
        await this.buffCollectionsService.removeBuffItem(telegramId, base.toLowerCase(), qty);
      }
      return true;
    } catch (err) {
      this.logger.warn(`[ItemTrade] deductItem ${base}: ${(err as any)?.message}`);
      return false;
    }
  }
}
