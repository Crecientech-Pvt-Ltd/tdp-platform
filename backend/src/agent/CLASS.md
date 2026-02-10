# Agent Module

## Purpose
REST endpoints that call the OpenAI Responses API and optional MCP tools.

## Key Files
- `agent.controller.ts`
  - `POST /api/agent/respond` — send a prompt to the agent.
- `agent.service.ts`
  - Orchestrates OpenAI Responses calls and tool execution.

## Data Flow
1. Controller validates input.
2. Service builds tool list and calls OpenAI Responses.
