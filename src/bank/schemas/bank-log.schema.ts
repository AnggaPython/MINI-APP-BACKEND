import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BankLogDocument = BankLog & Document;

@Schema({ timestamps: true })
export class BankLog {
    @Prop({ required: true, index: true })
    telegramId: string;

    @Prop({ required: true })
    actionType: string; // 'Deposit Vault', 'Withdraw Vault', 'Claim Elixir'

    @Prop({ required: true })
    amount: number;
}

export const BankLogSchema = SchemaFactory.createForClass(BankLog);
