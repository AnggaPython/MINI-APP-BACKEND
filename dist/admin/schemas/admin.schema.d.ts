import { HydratedDocument } from 'mongoose';
export type AdminDocument = HydratedDocument<Admin>;
export declare class Admin {
    username: string;
    passwordHash: string;
    role: string;
    lastLogin: Date;
    lastIp: string;
    profitBalances: Record<string, number>;
    withdrawLimits: Record<string, number>;
}
export declare const AdminSchema: any;
