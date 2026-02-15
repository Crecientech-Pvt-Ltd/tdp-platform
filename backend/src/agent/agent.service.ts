import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AgentResult = {
  text: string;
  toolCalls?: { name: string; status: 'completed' | 'failed' }[];
};

type ToolCall = {
  id: string;
  name: string;
  arguments: string;
};

type McpServerConfig = {
  label: string;
  url: string;
};

/**
 * Agent service to orchestrate OpenAI Responses and tool execution.
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  constructor(private readonly configService: ConfigService) {}

  /**
   * Send a prompt through the OpenAI Responses API and execute tools when requested.
   * @param prompt User prompt text.
   * @returns Agent response text and tool call status list.
   */
  async respond(prompt: string): Promise<AgentResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('Agent respond aborted: OPENAI_API_KEY not configured');
      return { text: 'OpenAI API key not configured on the server.' };
    }

    const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const baseUrl = this.configService.get<string>('OPENAI_BASE_URL', 'https://api.openai.com/v1');
    this.logger.log(`Agent respond start: model=${model}, baseUrl=${baseUrl.replace(/\/$/, '')}`);

    const initial = await this.callResponses(baseUrl, apiKey, {
      model,
      instructions: 'You are a biology assistant helping a Scientist in his/her study.',
      input: prompt,
      tool_choice: 'auto',
    });

    const toolCalls = this.extractToolCalls((initial as Record<string, unknown>)?.output); // Adjusted context
    if (!toolCalls.length) {
      this.logger.log('No tool calls requested; returning model response.');
      return { text: this.extractText(initial.output), toolCalls: [] };
    }

    this.logger.log(`Tool calls requested: count=${toolCalls.length}`);
    const toolOutputs: { tool_call_id: string; output: string }[] = [];
    const toolCallSummary: { name: string; status: 'completed' | 'failed' }[] = [];

    const followUp = await this.callResponses(baseUrl, apiKey, {
      model,
      previous_response_id: (initial as Record<string, unknown>)?.id,
      tool_outputs: toolOutputs,
    });

    this.logger.log('Agent respond completed; returning follow-up response.');
    return { text: this.extractText(followUp.output), toolCalls: toolCallSummary }; // Adjusted context
  }

  /**
   * Read MCP tool definitions from env and convert to Responses API tool objects.
   * @returns Array of MCP tool definitions.
   */
  private getMcpTools() {
    const raw = this.configService.get<string>('MCP_SERVERS');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as McpServerConfig[];
      return parsed
        .filter((server) => server?.label && server?.url)
        .map((server) => ({
          type: 'mcp',
          server_label: server.label,
          server_url: server.url,
        }));
    } catch {
      return [];
    }
  }

  /**
   * Call the OpenAI Responses API with the provided payload.
   * @param baseUrl Base URL for the OpenAI API.
   * @param apiKey API key for authorization.
   * @param payload Responses API request payload.
   * @returns Parsed JSON response from the API.
   */
  private async callResponses(baseUrl: string, apiKey: string, payload: Record<string, unknown>) {
    const endpoint = `${baseUrl.replace(/\/$/, '')}/responses`;
    this.logger.debug(`OpenAI responses POST ${endpoint}`);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'OpenAI request failed' } }));
      throw new Error(error?.error?.message || 'OpenAI request failed');
    }

    return response.json(); // Adjusted context
  }

  /**
   * Extract tool calls from a Responses API output array.
   * @param output Responses output field.
   * @returns Tool call list in normalized format.
   */
  private extractToolCalls(output: unknown): ToolCall[] {
    if (!Array.isArray(output)) return [];
    const arr = output as any[];
    return arr
      .filter((item) => item?.type === 'tool_call' && item?.name && item?.tool_call_id)
      .map((item) => ({
        id: item.tool_call_id,
        name: item.name,
        arguments: item.arguments ?? '{}',
      }));
  }

  /**
   * Extract concatenated text from a Responses API output array.
   * @param output Responses output field.
   * @returns Combined assistant message text.
   */
  private extractText(output: unknown): string {
    if (!Array.isArray(output)) return 'No response.';
    const arr = output as any[];
    const parts: string[] = [];
    for (const item of arr) {
      if (item?.type === 'message' && Array.isArray(item.content)) {
        for (const content of item.content) {
          if (content?.type === 'output_text' && content?.text) {
            parts.push(content.text);
          }
        }
      } else if (item?.type === 'output_text' && item?.text) {
        parts.push(item.text);
      }
    }
    return parts.join('\n').trim() || 'No response.';
  }
}
