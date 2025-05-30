import { AlgorithmService } from '@/algorithm/algorithm.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  ParseBoolPipe,
  ParseFloatPipe,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GraphConfigDto } from './algorithm.dto';

@Controller('algorithm')
export class AlgorithmController {
  constructor(private readonly algoService: AlgorithmService) {}

  @Get('louvain')
  async louvain(
    @Query('graphName') graphName: string,
    @Query('resolution', new ParseFloatPipe({ optional: true })) resolution = 1,
    @Query('weighted', new ParseBoolPipe({ optional: true })) weighted = true,
    @Query('minCommunitySize', new ParseIntPipe({ optional: true }))
    minCommunitySize = 1,
  ) {
    const result = await this.algoService.louvain(
      graphName,
      resolution,
      weighted,
      minCommunitySize,
    );
    if (!result)
      throw new HttpException('Graph not found', HttpStatus.NOT_FOUND);
    return result;
  }

  @Post('renew-session')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async renewSession(@Body() graphConfig: GraphConfigDto) {
    if (await this.algoService.renewSession(graphConfig)) return;
    throw new HttpException('Graph already exists', HttpStatus.CONFLICT);
  }
}
