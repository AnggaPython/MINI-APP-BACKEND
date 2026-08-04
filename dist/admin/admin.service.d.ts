import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { Admin } from './schemas/admin.schema';
export declare class AdminService implements OnModuleInit {
    private adminModel;
    constructor(adminModel: Model<Admin>);
    onModuleInit(): Promise<void>;
    authenticate(username: string, passwordString: string, ip?: string): Promise<{
        error: string;
        success?: undefined;
        token?: undefined;
        role?: undefined;
    } | {
        success: boolean;
        token: string;
        role: string;
        error?: undefined;
    }>;
}
