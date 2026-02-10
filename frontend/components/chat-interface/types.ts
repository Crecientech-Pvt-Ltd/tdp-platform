export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
};

export type ChatInterfaceProps = {
  dataContext?: unknown;
  onSend?: (text: string) => Promise<string> | string;
  storageKey?: string;
  showNewChatButton?: boolean;
};
