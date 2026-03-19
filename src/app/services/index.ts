/**
 * @file index.ts
 * @description Services 统一导出
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 */

// AI Services
export { AICodeService, getAICodeService, CodeGenerationRequest, CodeGenerationResponse } from './aiCodeService';
export type { CodeGenerationRequest, CodeGenerationResponse } from './aiCodeService';

// Realtime Services
export { WebSocketService, getWebSocketService, WSMessage, WSConnectionStatus } from './websocketService';
export type { WSMessage, WSConnectionStatus, WSMessageType } from './websocketService';

// Quality Services
export { ErrorDetectionService, getErrorDetectionService, CodeError, AnalysisResult } from './errorDetectionService';
export type { CodeError, AnalysisResult } from './errorDetectionService';

// Suggestion Services
export { SuggestionService, getSuggestionService, CodeSuggestion, UserStyleProfile } from './suggestionService';
export type { CodeSuggestion, UserStyleProfile } from './suggestionService';
