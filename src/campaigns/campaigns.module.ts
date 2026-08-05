import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { UsersModule } from '../users/users.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Campaign.name, schema: CampaignSchema }]),
        forwardRef(() => UsersModule),
        forwardRef(() => AchievementsModule),
        forwardRef(() => AdminModule)
    ],
    controllers: [CampaignsController],
    providers: [CampaignsService]
})
export class CampaignsModule { }
