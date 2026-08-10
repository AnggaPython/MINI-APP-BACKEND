import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfitLogDocument = ProfitLog & Document;

@Schema({ timestamps: true })
export class ProfitLog {
    @Prop({ required: true })
    coin: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    source: string;

    @Prop({ required: true })
    telegramId: string;

    @Prop({ type: Date })
    createdAt?: Date;

    @Prop({ type: Date })
    updatedAt?: Date;
}

export const ProfitLogSchema = SchemaFactory.createForClass(ProfitLog);
