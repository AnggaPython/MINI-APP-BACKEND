import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin } from './schemas/admin.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AdminService implements OnModuleInit {
    constructor(
        @InjectModel(Admin.name) private adminModel: Model<Admin>
    ) { }

    async onModuleInit() {
        // Automatically inject the root Super Admin if none exists
        const rootAdmin = await this.adminModel.findOne({ username: 'superadmin' });
        if (!rootAdmin) {
            const defaultPassword = 'superadminpassword'; // In production, this should be an env var
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(defaultPassword, salt);

            await new this.adminModel({
                username: 'superadmin',
                passwordHash
            }).save();
            console.log('--- ROOT SUPERADMIN GENERATED: superadmin / superadminpassword ---');
        }
    }

    async authenticate(username: string, passwordString: string, ip: string = '') {
        const admin = await this.adminModel.findOne({ username }).exec();
        if (!admin) return { error: 'Invalid credentials' };

        const isMatch = await bcrypt.compare(passwordString, admin.passwordHash);
        if (!isMatch) return { error: 'Invalid credentials' };

        admin.lastLogin = new Date();
        if (ip) admin.lastIp = ip;
        await admin.save();

        // For MVP we generate a basic hex token. For production use explicit JWT mapped to Sessions.
        const fakeJwt = crypto.randomBytes(32).toString('hex');

        return {
            success: true,
            token: fakeJwt,
            role: admin.role
        };
    }
}
