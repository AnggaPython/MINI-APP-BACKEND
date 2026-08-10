import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserNetEquityDocument = UserNetEquity & Document;

@Schema({ timestamps: true })
export class UserNetEquity {
    @Prop({ required: true, type: String, unique: true, index: true })
    telegramId: string;

    @Prop({ type: String, default: null })
    firstName?: string | null;

    @Prop({ type: String, default: null })
    username?: string | null;

    @Prop({ required: true, type: Number, default: 0 })
    totalDepositedElixir: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalWithdrawnElixir: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalHiLoGrossWinsElixir: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalHiLoGrossLossesElixir: number;

    @Prop({ required: true, type: Number, default: 0 })
    lockedVestingElixir: number;

    @Prop({ required: true, type: Number, default: 0 })
    lockedVestingTurnoverRequired: number;

    @Prop({ required: true, type: Number, default: 0 })
    lockedVestingTurnoverDone: number;

    @Prop({ type: Date, default: null })
    lastBigWinAt?: Date | null;

    @Prop({ required: true, type: Number, default: 0 })
    totalBetsLifetime: number;

    @Prop({ required: true, type: Number, default: 0 })
    adsViewedLifetime: number;

    @Prop({ required: true, type: Number, default: 0 })
    withdrawnTodayElixir: number;

    @Prop({ type: String, default: null })
    withdrawnDayKey?: string | null;

    @Prop({ required: true, type: Number, default: 0 })
    circulationTaxAccumulated: number;

    @Prop({ type: Date, default: null })
    lastActiveAt?: Date | null;

    @Prop({ type: [{ type: Number, default: [] }] })
    whalePatternQueue?: number[];

    @Prop({ type: Number, default: 0 })
    whalePatternIndex?: number;

    @Prop({ type: Date })
    createdAt?: Date;

    @Prop({ type: Date })
    updatedAt?: Date;
}

export const UserNetEquitySchema = SchemaFactory.createForClass(UserNetEquity);
