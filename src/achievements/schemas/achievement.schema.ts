import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AchievementDocument = Achievement & Document;

@Schema({ timestamps: true })
export class Achievement {
    @Prop({ required: true })
    telegramId: string;

    @Prop({ required: true })
    achievementId: number;

    @Prop({ default: 0 })
    progress: number;

    @Prop({ default: false })
    claimed: boolean;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);
AchievementSchema.index({ telegramId: 1, achievementId: 1 }, { unique: true });
