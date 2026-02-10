import { envURL } from '@/lib/utils';

export type OpenAiChatResponse = {
  text: string;
  toolCalls?: { name: string; status: 'completed' | 'failed' }[];
};

export async function chat(prompt: string): Promise<OpenAiChatResponse> {
  const baseUrl = envURL(process.env.NEXT_PUBLIC_BACKEND_URL);
  const response = await fetch(`${baseUrl}/api/agent/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Chat request failed' }));
    throw new Error(error.message || 'Chat request failed');
  }

  return response.json();
}
