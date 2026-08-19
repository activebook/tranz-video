/**
 * tranz-video - Background Service Worker (Manifest V3)
 * Orchestrates viewport capture, high-DPR sub-image cropping via OffscreenCanvas,
 * and communication with OpenAI-compatible multimodal endpoints.
 */

export const DEFAULT_CONFIG = {
  endpoint: 'http://127.0.0.1:8045/v1',
  model: 'gemini-2.5-flash-lite',
  apiKey: '',
  temperature: 0.2,
  targetLanguage: 'en',
  learningMode: 'bilingual', // 'bilingual' | 'target_only'
  systemPrompt: `You are an expert visual translator and language-learning tutor.
Your task is to transcribe on-screen text from video frames and translate it accurately into the requested target language.
Adhere strictly to the requested structural markers. Do not add conversational filler, preambles, or markdown notes outside the requested structure.
Preserve the natural reading order, UI labels, and character dialogue hierarchy.`,
  userPromptTemplate: `Detect and transcribe all visible on-screen text in this video frame, then translate it into {TARGET_LANGUAGE}.
{MODE_INSTRUCTIONS}`,
  autoPause: true,
  extensionEnabled: true,
  windowGeometry: {
    x: 32,
    y: 32,
    width: 440,
    height: 360,
    zoom: 1.0,
    isMinimized: false,
    isVisible: true
  }
};

export const LANGUAGE_NAMES = {
  'en': 'English',
  'zh-Hans': 'Simplified Chinese (简体中文)',
  'zh-Hant': 'Traditional Chinese (繁體中文)',
  'ja': 'Japanese (日本語)',
  'ko': 'Korean (한국어)',
  'es': 'Spanish (Español)',
  'fr': 'French (Français)'
};

/**
 * Retrieves merged configuration from chrome.storage.local
 */
async function getConfig() {
  const stored = await chrome.storage.local.get(null);
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    windowGeometry: {
      ...DEFAULT_CONFIG.windowGeometry,
      ...(stored.windowGeometry || {})
    }
  };
}

/**
 * Builds the user prompt from template and current settings
 */
function buildUserPrompt(config) {
  const targetLangName = LANGUAGE_NAMES[config.targetLanguage] || config.targetLanguage || 'English';

  let modeInstructions = '';
  if (config.learningMode === 'target_only') {
    modeInstructions = `Output format: For each on-screen dialogue line or text block, output:
[PAIR]
[TRANS]Fluent translation in ${targetLangName}[/TRANS]
[/PAIR]`;
  } else {
    // Default: bilingual pair mode
    modeInstructions = `Output format: For each on-screen dialogue line, subtitle, or UI text block, output an interleaved pair:
[PAIR]
[SRC]Original source text transcribed verbatim[/SRC]
[TRANS]Fluent translation in ${targetLangName}[/TRANS]
[/PAIR]

If multiple text blocks exist, output sequential [PAIR] blocks in natural reading order.`;
  }

  let prompt = config.userPromptTemplate || DEFAULT_CONFIG.userPromptTemplate;
  prompt = prompt.replace(/{TARGET_LANGUAGE}/g, targetLangName);
  prompt = prompt.replace(/{MODE_INSTRUCTIONS}/g, modeInstructions);
  return prompt;
}

/**
 * Normalizes OpenAI base URL by appending /chat/completions
 */
function normalizeChatCompletionsUrl(baseUrl) {
  if (!baseUrl) {
    baseUrl = DEFAULT_CONFIG.endpoint;
  }
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  if (cleanBase.endsWith('/chat/completions')) {
    return cleanBase;
  }
  return `${cleanBase}/chat/completions`;
}

/**
 * Crops a full-tab data URL screenshot to the video bounding box scaled by DPR
 */
async function cropTabCapture(dataUrl, rect, dpr) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const safeDpr = typeof dpr === 'number' && dpr > 0 ? dpr : 1;
  const sx = Math.max(0, Math.floor(rect.left * safeDpr));
  const sy = Math.max(0, Math.floor(rect.top * safeDpr));
  const sw = Math.min(imageBitmap.width - sx, Math.ceil(rect.width * safeDpr));
  const sh = Math.min(imageBitmap.height - sy, Math.ceil(rect.height * safeDpr));

  if (sw <= 0 || sh <= 0) {
    throw new Error(`Invalid video crop geometry: width=${sw}, height=${sh}`);
  }

  const offscreen = new OffscreenCanvas(sw, sh);
  const ctx = offscreen.getContext('2d');
  ctx.drawImage(imageBitmap, sx, sy, sw, sh, 0, 0, sw, sh);

  const croppedBlob = await offscreen.convertToBlob({ type: 'image/png' });
  const arrayBuffer = await croppedBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Fast chunked binary-to-base64 conversion
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const base64 = btoa(binary);
  return `data:image/png;base64,${base64}`;
}

/**
 * Sends a vision chat completions request to the configured OpenAI-compatible endpoint
 */
async function callMultimodalApi(imageDataUrl, config) {
  const url = normalizeChatCompletionsUrl(config.endpoint);
  const userPromptText = buildUserPrompt(config);

  const headers = {
    'Content-Type': 'application/json'
  };
  if (config.apiKey && config.apiKey.trim().length > 0) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  const requestBody = {
    model: config.model || DEFAULT_CONFIG.model,
    temperature: typeof config.temperature === 'number' ? config.temperature : 0.2,
    messages: [
      {
        role: 'system',
        content: config.systemPrompt || DEFAULT_CONFIG.systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPromptText
          },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl
            }
          }
        ]
      }
    ]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const rawResponseText = await response.text().catch(() => '');

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = JSON.parse(rawResponseText);
        errorDetail = errorJson?.error?.message || (typeof errorJson?.error === 'string' ? errorJson.error : JSON.stringify(errorJson));
      } catch {
        errorDetail = rawResponseText;
      }
      throw new Error(`AI Gateway error (HTTP ${response.status}): ${errorDetail || response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(rawResponseText);
    } catch {
      throw new Error(`AI Gateway returned invalid JSON response: ${rawResponseText.slice(0, 200)}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI gateway returned an empty completion response.');
    }

    // Sanitize reasoning / thinking tags before dispatching to frontend
    return stripReasoningTags(content);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI gateway request timed out after 35 seconds.');
    }
    throw err;
  }
}

/**
 * Strips reasoning / internal thinking tags output by models (e.g. DeepSeek-R1, Qwen-Thinking, Gemini Thinking)
 */
export function stripReasoningTags(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<(think|thought|thinking)>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(think|thought|thinking)>[\s\S]*$/gi, '')
    .replace(/```(?:thought|thinking)[\s\S]*?```/gi, '')
    .replace(/^(?:thought|thinking process):\s*[\s\S]*?\n\n/i, '')
    .trim();
}

/**
 * Test connectivity against an OpenAI-compatible endpoint
 */
async function testEndpointConnection(config) {
  const url = normalizeChatCompletionsUrl(config.endpoint);
  const headers = {
    'Content-Type': 'application/json'
  };
  if (config.apiKey && config.apiKey.trim().length > 0) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model || DEFAULT_CONFIG.model,
        messages: [{ role: 'user', content: 'Ping. Respond with "pong".' }],
        max_tokens: 5
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    const rawText = await response.text().catch(() => '');

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        latency,
        error: `HTTP ${response.status}: ${rawText}`
      };
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: true,
        status: response.status,
        latency,
        reply: rawText.slice(0, 100).trim() || 'OK'
      };
    }

    const reply = data?.choices?.[0]?.message?.content || 'OK';

    return {
      success: true,
      status: response.status,
      latency,
      reply: reply.trim()
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      status: 0,
      latency: Date.now() - startTime,
      error: err.name === 'AbortError' ? 'Connection timed out after 10s' : err.message
    };
  }
}

// Global capture lock to prevent concurrency conflicts
let isProcessingCapture = false;

// Handle messages from content scripts and options UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_FRAME') {
    (async () => {
      try {
        const windowId = sender.tab?.windowId;
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
        sendResponse({ success: true, dataUrl });
      } catch (err) {
        console.error('[tranz-video] Frame capture error:', err);
        sendResponse({ success: false, error: err.message || 'Tab capture failed.' });
      }
    })();
    return true;
  }

  if (message.type === 'TRANSLATE_IMAGE') {
    (async () => {
      if (isProcessingCapture) {
        sendResponse({ success: false, error: 'A translation is already in progress.' });
        return;
      }
      isProcessingCapture = true;

      try {
        let finalImageDataUrl = message.dataUrl;
        if (message.rect && message.dpr) {
          finalImageDataUrl = await cropTabCapture(message.dataUrl, message.rect, message.dpr);
        }
        const config = await getConfig();
        const rawResponse = await callMultimodalApi(finalImageDataUrl, config);

        sendResponse({
          success: true,
          text: rawResponse,
          learningMode: config.learningMode,
          targetLanguage: config.targetLanguage
        });
      } catch (err) {
        console.error('[tranz-video] Translation error:', err);
        sendResponse({ success: false, error: err.message || 'Translation error' });
      } finally {
        isProcessingCapture = false;
      }
    })();
    return true;
  }

  if (message.type === 'TRANSLATE_FRAME') {
    (async () => {
      if (isProcessingCapture) {
        sendResponse({ success: false, error: 'A translation is already in progress.' });
        return;
      }
      isProcessingCapture = true;

      try {
        const windowId = sender.tab?.windowId;
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
        const croppedDataUrl = await cropTabCapture(dataUrl, message.rect, message.dpr);
        const config = await getConfig();
        const rawResponse = await callMultimodalApi(croppedDataUrl, config);

        sendResponse({
          success: true,
          text: rawResponse,
          learningMode: config.learningMode,
          targetLanguage: config.targetLanguage
        });
      } catch (err) {
        console.error('[tranz-video] Translation error:', err);
        sendResponse({ success: false, error: err.message || 'Unknown capture error' });
      } finally {
        isProcessingCapture = false;
      }
    })();
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_CONFIG') {
    (async () => {
      const config = await getConfig();
      sendResponse({ success: true, config });
    })();
    return true;
  }

  if (message.type === 'SAVE_CONFIG') {
    (async () => {
      await chrome.storage.local.set(message.config);
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === 'TEST_CONNECTION') {
    (async () => {
      const result = await testEndpointConnection(message.config);
      sendResponse(result);
    })();
    return true;
  }

  return false;
});

// Extension action icon click trigger
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_TRANSLATE' });
  } catch (err) {
    console.warn('[tranz-video] Failed to notify tab on action click:', err);
  }
});
