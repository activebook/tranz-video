/**
 * tranz-video - String Sanitization & Security Utilities
 */

/**
 * Safely escapes HTML entities to prevent XSS injection.
 */
export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips reasoning / internal thinking tags emitted by reasoning LLMs
 * (e.g. DeepSeek-R1, Qwen-Thinking, Gemini Thinking) before parsing.
 */
export function stripReasoningTags(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<(think|thought|thinking)>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(think|thought|thinking)>[\s\S]*$/gi, '')
    .replace(/```(?:thought|thinking)[\s\S]*?```/gi, '')
    .replace(/^(?:thought|thinking process):\s*[\s\S]*?\n\n/i, '')
    .trim();
}
