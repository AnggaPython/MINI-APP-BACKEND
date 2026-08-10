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

    @Prop({ type: Date, default: null })
    lastLogin: Date | null;

    @Prop({ type: String, default: null })
    lastIp: string | null;

    @Prop({ type: Object, default: {} })
    profitBalances: Record<string, number>;

    @Prop({ type: Object, default: { 'PEPE': 10000000, 'USDC': 200 } })
    withdrawLimits: Record<string, number>;

    @Prop({ type: String, default: null })
    sessionToken: string | null;

    @Prop({ type: Date, default: null })
    tokenExpiresAt: Date | null;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
