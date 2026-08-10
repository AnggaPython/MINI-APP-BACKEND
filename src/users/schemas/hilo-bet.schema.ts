import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HiLoBetDocument = HiLoBet & Document;

@Schema({ timestamps: true })
export class HiLoBet {
    @Prop({ required: true })
    telegramId: string;

    @Prop({ required: true })
    betAmount: number;

    @Prop({ required: true })
    multiplier: number;

    @Prop({ required: true })
    targetType: string; // 'hi' or 'lo'

    @Prop({ required: true })
    thresholdHI: number;

    @Prop({ required: true })
    thresholdLO: number;

    @Prop({ required: true })
    rolledNumber: number;

    @Prop({ required: true })
    isWin: boolean;

    @Prop({ required: true })
    profit: number; // positive if win, negative if lose

    @Prop({ required: true })
    newBalance: number;

    @Prop({ required: true })
    serverSeed: string;

    @Prop({ required: true })
    clientSeed: string;

    @Prop({ required: true })
    hash: string;
}

export const HiLoBetSchema = SchemaFactory.createForClass(HiLoBet);
