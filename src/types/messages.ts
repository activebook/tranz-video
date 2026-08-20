/**
 * tranz-video - Discriminated Union Inter-Process Communication (IPC) Types
 */

import type { AppConfig, EndpointProfile, LearningMode } from './config';

export interface BoundingRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type ExtensionMessage =
  | { type: 'CAPTURE_FRAME' }
  | { type: 'TRANSLATE_IMAGE'; dataUrl: string; rect?: BoundingRect | undefined; dpr?: number | undefined }
  | { type: 'TRANSLATE_FRAME'; rect: BoundingRect; dpr: number }
  | { type: 'GET_CONFIG' }
  | { type: 'SAVE_CONFIG'; config: Partial<AppConfig> }
  | { type: 'TEST_CONNECTION'; config: EndpointProfile };

export interface CaptureFrameResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

export interface TranslateImageResponse {
  success: boolean;
  text?: string;
  learningMode?: LearningMode;
  targetLanguage?: string;
  error?: string;
}

export interface GetConfigResponse {
  success: boolean;
  config: AppConfig;
}

export interface SaveConfigResponse {
  success: boolean;
}

export interface TestConnectionResponse {
  success: boolean;
  status: number;
  latency: number;
  reply?: string;
  error?: string;
}

export type TabActionMessage =
  | { action: 'TRIGGER_TRANSLATE' };
