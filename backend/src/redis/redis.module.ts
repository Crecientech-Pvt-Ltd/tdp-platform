import { RedisService } from "@/redis/redis.service";
import { Module } from "@nestjs/common";

@Module({
	providers: [RedisService],
	exports: [RedisService],
})
export class RedisModule {}
