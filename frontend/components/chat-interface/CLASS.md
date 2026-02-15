# Chat Interface Module Reference

## Exports
- `ChatInterface` (default export from `ChatInterface.tsx`, re-exported in `index.ts`)
  - Main chat UI component used to collect input, render messages, and call the backend.
  - Consumes `dataContext`, optional `onSend`, and persists history to local storage.
- `buildPrompt` (named export from `prompts.ts`, re-exported in `index.ts`)
  - Helper to build the full system+context prompt string sent to the model.
- Types (from `types.ts`, re-exported in `index.ts`)
  - `ChatInterfaceProps` - props for `ChatInterface`.
  - `ChatMessage` - message shape for transcript entries.
  - `ChatRole` - allowed role values (`user`, `assistant`, `system`).

## Internal Components
- `MessageInput` (`MessageInput.tsx`)
  - Stateless input row with a submit handler.
  - Used by `ChatInterface` for composing and sending messages.
- `MessageList` (`MessageList.tsx`)
  - Renders transcript entries using Markdown and a simple empty state.
  - Used by `ChatInterface` to display messages.

## Prompt Utilities
- `SYSTEM_PROMPT`, `GENERAL_SYSTEM_PROMPT`, `GRAPH_RULES` (`prompts.ts`)
  - Template strings that define system instructions and graph interpretation rules.
- `summarizeGraph`, `safeStringify`, `hasDataContext` (`prompts.ts`)
  - Internal helpers to compact and serialize data context for prompts.

## Data Flow
1. `ChatInterface` collects input via `MessageInput`.
2. User text goes through `handleSend`, which calls `onSend` or the built-in `defaultSend`.
3. `defaultSend` builds the model prompt with `buildPrompt`, calls the backend, and appends the assistant response.

## External Dependencies
- `openaiChat` (`@/lib/api/openAi`) - backend chat route call.
