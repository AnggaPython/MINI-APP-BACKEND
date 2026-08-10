import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonthlyBookCycleDocument = MonthlyBookCycle & Document;

@Schema({ timestamps: true })
export class MonthlyBookCycle {
    @Prop({ required: true, type: String, unique: true })
    cycleId: string;

    @Prop({ required: true, type: Date })
    startDate: Date;

    @Prop({ type: Date, default: null })
    endDate?: Date | null;

    @Prop({ required: true, type: Boolean, default: true })
    isActive: boolean;

    @Prop({ required: true, type: Number, default: 100000 })
    startAdminTreasury: number;

    @Prop({ type: Number, default: null })
    endAdminTreasury?: number | null;

    @Prop({ required: true, type: Number, default: 0 })
    totalTaxCollected: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalBurned: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalWithdrawalFees: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalAdsRevenueElixirEquivalent: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalBets: number;

    @Prop({ required: true, type: Number, default: 0 })
    totalBetsVolume: number;

    @Prop({ required: true, type: Number, default: 0 })
    refillModeTriggeredCount: number;

    @Prop({ type: [{ type: Object }], default: [] })
    dailySeries: Array<{
        dayIndex: number;
        dateKey: string;
        adminTreasury: number;
        taxCollected: number;
        betsVolume: number;
    }>;

    @Prop({ type: Number, default: null })
    netProfitPercent?: number | null;

    @Prop({ type: Date })
    createdAt?: Date;

    @Prop({ type: Date })
    updatedAt?: Date;
}

export const MonthlyBookCycleSchema = SchemaFactory.createForClass(MonthlyBookCycle);
