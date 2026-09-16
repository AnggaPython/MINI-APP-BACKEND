import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Campaign, CampaignDocument } from "./schemas/campaign.schema";
import { UsersService } from "../users/users.service";
import { AchievementsService } from "../achievements/achievements.service";
import { AdminService } from "../admin/admin.service";

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
    @Inject(forwardRef(() => AchievementsService))
    private achievementsService: AchievementsService,
    @Inject(forwardRef(() => AdminService)) private adminService: AdminService,
  ) {}

  async createCampaign(data: {
    creatorTelegramId: string;
    title: string;
    description: string;
    category: string;
    rewardPerClick: number;
    totalBudget: number;
    url?: string;
    oneUserLifetime?: boolean;
    autoRenew?: boolean;
  }) {
    if (data.totalBudget < 10000) {
      throw new BadRequestException("Minimum budget is 10,000 ELIXIR");
    }

    this.validateCampaignUrl(data.url, data.category);

    const isWeb = data.category.toUpperCase().includes("WEB");
    let minReward = isWeb ? 30 : 50;

    if (data.oneUserLifetime) {
      minReward = Math.ceil(minReward * 1.5);
    }

    if (data.rewardPerClick < minReward) {
      throw new BadRequestException(
        `Minimum Cost Per Action for this category is ${minReward} ELIXIR`,
      );
    }

    const deducted = await this.usersService.debitElixir(
      data.creatorTelegramId,
      data.totalBudget,
    );
    if (!deducted) {
      return {
        success: false,
        error: "Insufficient Elixir balance to launch campaign",
      };
    }

    const campaign = new this.campaignModel({
      ...data,
      remainingBudget: data.totalBudget,
      status: "active",
    });

    await campaign.save();

    await this.achievementsService.setProgressMax(data.creatorTelegramId, [6]);

    return { success: true, campaign };
  }

  async getActiveCampaigns(telegramId: string) {
    const user = await this.usersService.findByTelegramId(telegramId);
    let completed: string[] = [];
    if (user && user.completedTasks) {
      completed = user.completedTasks.filter((id) =>
        /^[0-9a-fA-F]{24}$/.test(id),
      );
    }

    // Return active campaigns that the user HAS NOT completed
    return this.campaignModel
      .find({
        status: "active",
        _id: { $nin: completed },
      })
      .sort({ rewardPerClick: -1, createdAt: -1 })
      .limit(50)
      .exec();
  }

  async getMyCampaigns(creatorTelegramId: string) {
    return this.campaignModel
      .find({ creatorTelegramId })
      .sort({ createdAt: -1 })
      .exec();
  }

  private validateCampaignUrl(urlString: string | undefined, category: string) {
    if (!urlString)
      throw new BadRequestException("Target URL is strictly required.");
    const cat = category.toUpperCase();

    try {
      let urlToParse = urlString.trim();
      if (
        !urlToParse.startsWith("http://") &&
        !urlToParse.startsWith("https://")
      ) {
        urlToParse = "https://" + urlToParse;
      }
      const parsedUrl = new URL(urlToParse);

      if (cat === "WEB") {
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new BadRequestException(
            "Web URL must use HTTP/HTTPS protocol.",
          );
        }
      } else if (["CHANNEL", "GROUP", "BOT"].includes(cat)) {
        if (
          !["t.me", "telegram.me"].includes(parsedUrl.hostname.toLowerCase())
        ) {
          throw new BadRequestException(
            `Invalid Telegram Link. You must use a valid t.me link for ${cat} campaigns!`,
          );
        }
        if (parsedUrl.pathname.length < 2) {
          throw new BadRequestException(
            `Telegram Username or ID is missing from the URL.`,
          );
        }
      }
    } catch (e: any) {
      throw new BadRequestException(
        e.message.includes("Invalid")
          ? "Malformed URL formulation detected."
          : e.message,
      );
    }
  }

  private activeTaskStarts = new Map<string, number>();

  async startTask(telegramId: string, campaignId: string) {
    const key = `${telegramId}_${campaignId}`;
    this.activeTaskStarts.set(key, Date.now());
    return { success: true };
  }

  async verifyTelegramMembership(
    telegramId: string,
    url: string,
  ): Promise<boolean | null> {
    if (!url) return null;
    const match = url.match(/t\.me\/([a-zA-Z0-9_]+)/i);
    if (!match) return null;
    const username = match[1];

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return null;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=@${username}&user_id=${telegramId}`,
      );
      const data = await res.json();

      if (data.ok) {
        const status = data.result.status;
        if (["member", "administrator", "creator"].includes(status))
          return true;
        return false;
      }

      if (
        data.error_code === 400 &&
        data.description.includes("chat not found")
      ) {
        // Feature explicitly disabled or bot is not admin. Graceful proxy.
        return null;
      }
      return false;
    } catch (e) {
      return null;
    }
  }

  async completeTask(telegramId: string, campaignId: string) {
    const campaign = await this.campaignModel.findOne({
      _id: campaignId,
      status: "active",
    });
    if (!campaign)
      return { success: false, error: "Campaign not found or inactive" };

    let requires20sFallback = true;

    if (["CHANNEL", "GROUP"].includes(campaign.category.toUpperCase())) {
      const isMember = await this.verifyTelegramMembership(
        telegramId,
        campaign.url,
      );
      if (isMember === false) {
        // Strictly rejected: User explicitly left or didn't join!
        return {
          success: false,
          error: "NOT_VERIFIED",
          message: `please follow ${campaign.category.toLowerCase()} for received your elixir reward`,
        };
      }
      if (isMember === true) {
        // Strictly Valided! Bypass cooldown instantly!
        requires20sFallback = false;
      }
      // If isMember === null (Not Admin), it drops into requires20sFallback peacefully.
    }

    // Note: 'BOT' Category inherently ignores API verification and relies safely on the 20s Cooldown Proxy!

    if (requires20sFallback) {
      const key = `${telegramId}_${campaignId}`;
      const startTime = this.activeTaskStarts.get(key);

      if (!startTime || Date.now() - startTime < 20000) {
        return {
          success: false,
          error: "COOLDOWN_ACTIVE",
          message:
            "You must wait 20 seconds after interacting with the target before claiming the reward.",
        };
      }
      // Clear cache after consumption
      this.activeTaskStarts.delete(key);
    }

    if (campaign.remainingBudget < campaign.rewardPerClick) {
      // Attempt Auto-Renew
      if (campaign.autoRenew) {
        const topUpDeducted = await this.usersService.debitElixir(
          campaign.creatorTelegramId,
          10000,
        );
        if (topUpDeducted) {
          await this.campaignModel.updateOne(
            { _id: campaignId },
            { $inc: { totalBudget: 10000, remainingBudget: 10000 } },
          );
          campaign.remainingBudget += 10000;
        } else {
          await this.campaignModel.updateOne(
            { _id: campaignId },
            { $set: { status: "exhausted", autoRenew: false } },
          );
          return {
            success: false,
            error:
              "Campaign exhausted and auto-renew failed (insufficient balance)",
          };
        }
      } else {
        await this.campaignModel.updateOne(
          { _id: campaignId },
          { $set: { status: "exhausted" } },
        );
        return { success: false, error: "Campaign exhausted" };
      }
    }

    // Safely deduct from campaign
    const deductRes = await this.campaignModel.findOneAndUpdate(
      { _id: campaignId, remainingBudget: { $gte: campaign.rewardPerClick } },
      { $inc: { remainingBudget: -campaign.rewardPerClick } },
      { returnDocument: "after" },
    );

    if (!deductRes) {
      return { success: false, error: "Failed to process campaign budget" };
    }

    // Auto-exhaust logic
    if (deductRes.remainingBudget < deductRes.rewardPerClick) {
      await this.campaignModel.updateOne(
        { _id: campaignId },
        { $set: { status: "exhausted" } },
      );
    }

    // 2. Add to User profile securely avoiding double clicks (Distribute 35% to User)
    const userCut = deductRes.rewardPerClick * 0.35;
    const credited = await this.usersService.creditRewardAndLogTask(
      telegramId,
      userCut,
      campaignId,
    );

    if (!credited) {
      // Rollback the campaign deduction in case of cheat/duplicate to not burn advertiser funds
      await this.campaignModel.updateOne(
        { _id: campaignId },
        { $inc: { remainingBudget: deductRes.rewardPerClick } },
      );
      return {
        success: false,
        error: "Reward already claimed or user invalid",
      };
    }

    // 3. Grant 10% margin to Upline if exists (strictly 10% OF THE DOWNLINE'S NET EARNINGS)
    const user = await this.usersService.findByTelegramId(telegramId);
    if (user && user.referredBy) {
      const uplineCut = userCut * 0.1;
      await this.usersService.creditReferralBonus(
        user.referredBy,
        uplineCut,
        user.username || `USER_${user.telegramId.substring(0, 5)}...`,
        "Airdrop Ad",
      );
    }

    // Return remaining profit bounds strictly to admin:
    // if user and referredby exists, User takes 35%, logic is not deducting upline from admin, but strictly from remaining budget overhead.
    // Actually since `userCut` is 35% of budget, `uplineCut` is 3.5% of budget (10% of 35%).
    // Admin gets 100% - 35% (User) - 3.5% (Upline) = 61.5% !
    const adminMargin =
      deductRes.rewardPerClick * (user && user.referredBy ? 0.615 : 0.65);
    await this.adminService.addProfit(
      "ELIXIR",
      adminMargin,
      "CAMPAIGN_FEE",
      telegramId,
    );

    await this.achievementsService.incrementProgress(telegramId, [2, 3, 4], 1);

    return { success: true, reward: userCut };
  }

  async updateCampaign(
    campaignId: string,
    callerTelegramId: string,
    data: { title?: string; description?: string; url?: string },
  ) {
    const existing = await this.campaignModel.findById(campaignId);
    if (!existing) return { success: false, error: "Campaign not found" };

    // Only the owner may edit their campaign. A foreign id answers exactly like a
    // missing one so the route cannot be used to enumerate campaigns.
    if (String(existing.creatorTelegramId) !== String(callerTelegramId)) {
      return { success: false, error: "Campaign not found" };
    }

    if (data.url) {
      try {
        this.validateCampaignUrl(data.url, existing.category);
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    // Explicit allow-list. Budget, reward, status and ownership are server-owned:
    // they may only change through the audited funding path, never through an edit.
    const patch: Record<string, string> = {};
    if (typeof data.title === "string") patch.title = data.title;
    if (typeof data.description === "string") patch.description = data.description;
    if (typeof data.url === "string") patch.url = data.url;
    if (Object.keys(patch).length === 0) {
      return { success: false, error: "Nothing to update" };
    }

    const updated = await this.campaignModel.findOneAndUpdate(
      { _id: campaignId, creatorTelegramId: callerTelegramId },
      { $set: patch },
      { returnDocument: "after" },
    );
    if (!updated) return { success: false, error: "Campaign not found" };
    return { success: true, campaign: updated };
  }

  async addBudget(campaignId: string, amount: number, telegramId: string) {
    if (!Number.isFinite(amount) || amount < 10000)
      return { success: false, error: "Minimum top-up is 10,000 ELIXIR" };
    if (amount > 1_000_000)
      return { success: false, error: "Maximum top-up is 1,000,000 ELIXIR" };

    // Only the owner may fund their own campaign.
    const owned = await this.campaignModel.exists({
      _id: campaignId,
      creatorTelegramId: telegramId,
    });
    if (!owned) return { success: false, error: "Campaign not found" };

    const deducted = await this.usersService.debitElixir(telegramId, amount);
    if (!deducted)
      return { success: false, error: "Insufficient Elixir balance" };

    const campaign = await this.campaignModel.findOneAndUpdate(
      { _id: campaignId },
      { $inc: { totalBudget: amount, remainingBudget: amount } },
      { returnDocument: "after" },
    );

    if (!campaign) {
      await this.usersService.creditRewardAndLogTask(
        telegramId,
        amount,
        "ROLLBACK_" + Date.now(),
      );
      return { success: false, error: "Campaign not found" };
    }

    if (
      campaign.status === "exhausted" &&
      campaign.remainingBudget >= campaign.rewardPerClick
    ) {
      campaign.status = "active";
      await campaign.save();
    }

    return { success: true, campaign };
  }
}
