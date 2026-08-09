import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StakeDocument = Stake & Document;

@Schema({ timestamps: true })
export class Stake {
    @Prop({ required: true, index: true })
    telegramId: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    durationDays: number;

    @Prop({ required: true })
    rate: number;

    @Prop({ required: true })
    stakeDate: Date;

    @Prop({ required: true })
    maturityDate: Date;

    @Prop({ required: true })
    lastClaimDate: Date;

    @Prop({ required: true, enum: ['active', 'withdrawn'], default: 'active' })
    status: string;

    @Prop({ default: false })
    autoClaim: boolean;

    @Prop({ default: false })
    autoReinvest: boolean;

    @Prop({ default: false })
    isXpClaimed: boolean;
}

export const StakeSchema = SchemaFactory.createForClass(Stake);
