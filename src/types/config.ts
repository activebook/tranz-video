/**
 * tranz-video - Configuration and Domain Data Model Types
 */

export type LearningMode = 'bilingual' | 'furigana' | 'vocabulary' | 'target_only';

export type HudEffect = 'translucent' | 'glassmorphism' | 'opaque' | 'transparent_glow';

export interface EndpointProfile {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  apiKey: string;
  temperature: number;
}

export interface HudThemeConfig {
  sourceFontSize: number;
  sourceColor: string;
  furiganaFontSize: number;
  furiganaColor: string;
  targetFontSize: number;
  targetColor: string;
  hudBgColor: string;
  hudOpacity: number;
  hudEffect: HudEffect;
}

export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  isMinimized: boolean;
  isVisible: boolean;
}

export interface AppConfig {
  activeEndpointId: string;
  endpoints: EndpointProfile[];
  endpoint: string;
  model: string;
  apiKey: string;
  temperature: number;
  targetLanguage: string;
  learningMode: LearningMode;
  systemPrompt: string;
  userPromptTemplate: string;
  autoPause: boolean;
  extensionEnabled: boolean;
  hudTheme: HudThemeConfig;
  windowGeometry: WindowGeometry;
}

export const DEFAULT_ENDPOINTS: readonly EndpointProfile[] = [
  {
    id: 'ep-local',
    name: 'Local Proxy / Ollama',
    endpoint: 'http://127.0.0.1:8045/v1',
    model: 'gemini-3.1-flash-lite',
    apiKey: '',
    temperature: 0.2
  },
  {
    id: 'ep-gemini',
    name: 'Google Gemini (OpenAI Compatible)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3.5-flash-lite',
    apiKey: '',
    temperature: 0.2
  },
  {
    id: 'ep-openai',
    name: 'OpenAI Direct',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-5.6-luna',
    apiKey: '',
    temperature: 0.2
  },
  {
    id: 'ep-openrouter',
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1',
    model: 'qwen/qwen3.8-27b',
    apiKey: '',
    temperature: 0.2
  }
];

export const DEFAULT_CONFIG: AppConfig = {
  activeEndpointId: 'ep-local',
  endpoints: [...DEFAULT_ENDPOINTS],
  endpoint: 'http://127.0.0.1:8045/v1',
  model: 'gemini-3.1-flash-lite',
  apiKey: '',
  temperature: 0.2,
  targetLanguage: 'en',
  learningMode: 'bilingual',
  systemPrompt: `You are an expert visual translator and language-learning tutor.
Your task is to transcribe on-screen text from video frames and translate it accurately into the requested target language.
Adhere strictly to the requested structural markers. Do not add conversational filler, preambles, or markdown notes outside the requested structure.
Preserve the natural reading order, UI labels, and character dialogue hierarchy.`,
  userPromptTemplate: `Detect and transcribe all visible on-screen text in this video frame, then translate it into {TARGET_LANGUAGE}.
{MODE_INSTRUCTIONS}`,
  autoPause: true,
  extensionEnabled: true,
  hudTheme: {
    sourceFontSize: 18,
    sourceColor: '#38bdf8',
    furiganaFontSize: 16,
    furiganaColor: '#fbbf24',
    targetFontSize: 14,
    targetColor: '#ffffff',
    hudBgColor: '#0a0e16',
    hudOpacity: 88,
    hudEffect: 'translucent'
  },
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

export const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  'en': 'English',
  'zh-Hans': 'Simplified Chinese (简体中文)',
  'zh-Hant': 'Traditional Chinese (繁體中文)',
  'ja': 'Japanese (日本語)',
  'ko': 'Korean (한국어)',
  'es': 'Spanish (Español)',
  'fr': 'French (Français)'
};
