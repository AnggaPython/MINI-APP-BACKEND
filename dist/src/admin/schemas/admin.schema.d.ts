import { HydratedDocument } from "mongoose";
export type AdminDocument = HydratedDocument<Admin>;
export declare class Admin {
    username: string;
    passwordHash: string;
    role: string;
    lastLogin: Date | null;
    lastIp: string | null;
    profitBalances: Record<string, number>;
    withdrawLimits: Record<string, number>;
    sessionToken: string | null;
    tokenExpiresAt: Date | null;
}
export declare const AdminSchema: any;
