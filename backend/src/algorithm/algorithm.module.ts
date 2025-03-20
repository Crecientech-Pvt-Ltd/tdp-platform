import { Module } from "@nestjs/common";
import { AlgorithmController } from "./algorithm.controller";
import { AlgorithmService } from "./algorithm.service";

@Module({
	providers: [AlgorithmService],
	controllers: [AlgorithmController],
})
export class AlgorithmModule {}
