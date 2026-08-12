import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ required: true, index: true })
    telegramId: string;

    @Prop({ index: true })
    orderId?: string;

    @Prop({ required: true })
    type: string; // 'DEPOSIT' | 'WITHDRAW'

    @Prop({ required: true })
    coin: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true, default: 'STANDARD' })
    tier: string; // 'STANDARD' | 'ADVANCE' | 'ON-CHAIN'

    @Prop({ required: true, default: 'pending' })
    status: string; // 'pending' | 'complete' | 'reject'
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 Days TTL
