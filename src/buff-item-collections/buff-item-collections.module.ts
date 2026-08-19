import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BuffItemCollectionsService } from "./buff-item-collections.service";
import { BuffItemCollectionsController } from "./buff-item-collections.controller";
import { BuffItem, BuffItemSchema } from "./schemas/buff-item.schema";
import {
  UserBuffCollection,
  UserBuffCollectionSchema,
} from "./schemas/user-buff-collection.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BuffItem.name, schema: BuffItemSchema },
      { name: UserBuffCollection.name, schema: UserBuffCollectionSchema },
    ]),
  ],
  controllers: [BuffItemCollectionsController],
  providers: [BuffItemCollectionsService],
  exports: [BuffItemCollectionsService],
})
export class BuffItemCollectionsModule {}
