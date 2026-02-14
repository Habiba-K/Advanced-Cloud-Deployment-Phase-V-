/**
 * Chat API helper functions for interacting with the chat endpoints.
 */

import { api } from './api-client';
import type {
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  ChatHistoryParams,
} from '@/types/chat';

/**
 * Send a message to the AI chat agent.
 *
 * @param message - The user's message text
 * @param conversationId - Optional conversation ID to continue an existing conversation
 * @returns The agent's response with conversation ID
 */
export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  const payload: ChatRequest = {
    message,
    ...(conversationId && { conversation_id: conversationId }),
  };

  const response = await api.post<ChatResponse>('/api/chat', payload);

  return response;
}

/**
 * Get conversation history with optional pagination.
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Conversation history with messages
 */
export async function getHistory(
  params?: ChatHistoryParams
): Promise<ChatHistoryResponse> {
  const queryParams = new URLSearchParams();

  if (params?.conversation_id) {
    queryParams.append('conversation_id', params.conversation_id);
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.before) {
    queryParams.append('before', params.before);
  }

  const url = `/api/chat/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await api.get<ChatHistoryResponse>(url);

  return response;
}
