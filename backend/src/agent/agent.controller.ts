import { BadRequestException, Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AgentService } from './agent.service';

type AgentRequest = {
  prompt?: string;
};

/**
 * REST controller for agent prompt handling.
 */
@Controller('api/agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Get()
  /**
   * Simple health check endpoin for the Agentic Part.
   * @returns Plain text confirmation.
   */
  async getHello(): Promise<string> {
    return 'Agentic Side here!';
  }

  @Post('respond')
  /**
   * Handle a prompt by forwarding it to the agent service.
   * @param body Request body with a prompt string.
   * @returns Agent response payload with text and tool call summary.
   */
  async respond(@Body() body: AgentRequest) {
    this.logger.log('Agent /respond request received');
    const prompt = body?.prompt?.trim();
    if (!prompt) {
      this.logger.warn('Agent /respond rejected: missing prompt');
      throw new BadRequestException('Prompt is required.');
    }

    try {
      this.logger.log(`Agent /respond prompt length=${prompt.length}`);
      return await this.agentService.respond(prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent request failed';
      this.logger.error(`Agent /respond failed: ${message}`);
      throw new BadRequestException(message);
    }
  }
}
