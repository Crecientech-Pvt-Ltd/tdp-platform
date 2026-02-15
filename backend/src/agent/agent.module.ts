import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  imports: [ConfigModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
