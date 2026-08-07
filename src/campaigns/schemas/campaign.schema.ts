import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign {
    @Prop({ required: true })
    creatorTelegramId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    category: string; // e.g 'Telegram', 'X', 'YouTube', 'Custom'

    @Prop({ required: false })
    url: string; // The URL to visit

    @Prop({ required: true })
    rewardPerClick: number;

    @Prop({ required: true })
    totalBudget: number;

    @Prop({ required: true })
    remainingBudget: number;

    @Prop({ required: true, default: 'active' }) // active, paused, exhausted
    status: string;

    @Prop({ required: true, default: true })
    oneUserLifetime: boolean;

    @Prop({ required: true, default: false })
    autoRenew: boolean;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
