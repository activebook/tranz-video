/**
 * tranz-video - URL Resolution & Endpoint Utilities
 */

import { DEFAULT_CONFIG } from '../types/config';

/**
 * Normalizes an OpenAI base URL by appending /chat/completions if absent.
 */
export function normalizeChatCompletionsUrl(baseUrl?: string): string {
  const endpoint = baseUrl?.trim() || DEFAULT_CONFIG.endpoint;
  const cleanBase = endpoint.replace(/\/+$/, '');
  if (cleanBase.endsWith('/chat/completions')) {
    return cleanBase;
  }
  return `${cleanBase}/chat/completions`;
}
