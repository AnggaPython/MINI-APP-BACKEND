import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuctionHouseService } from "./auction-house.service";
import { AuctionHouseController } from "./auction-house.controller";
import { Auction, AuctionSchema } from "./schemas/auction.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { UsersModule } from "../users/users.module";
import {
  BuffItem,
  BuffItemSchema,
} from "../buff-item-collections/schemas/buff-item.schema";
import {
  UserBuffCollection,
  UserBuffCollectionSchema,
} from "../buff-item-collections/schemas/user-buff-collection.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: User.name, schema: UserSchema },
      { name: BuffItem.name, schema: BuffItemSchema },
      { name: UserBuffCollection.name, schema: UserBuffCollectionSchema },
    ]),
    UsersModule,
  ],
  controllers: [AuctionHouseController],
  providers: [AuctionHouseService],
  exports: [AuctionHouseService],
})
export class AuctionHouseModule {}
