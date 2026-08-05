import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true })
export class Admin {
    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ default: 'SUPER_ADMIN' })
    role: string;

    @Prop({ default: null })
    lastLogin: Date;

    @Prop({ default: null })
    lastIp: string;

    @Prop({ type: Object, default: {} })
    profitBalances: Record<string, number>;

    @Prop({ type: Object, default: { 'PEPE': 10000000, 'USDC': 200 } })
    withdrawLimits: Record<string, number>;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
