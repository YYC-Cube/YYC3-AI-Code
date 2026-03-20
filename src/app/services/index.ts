/**
 * @file index.ts
 * @description Services 统一导出
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 */

// AI Services
export { AICodeService, getAICodeService } from './aiCodeService';
export type { CodeGenerationRequest, CodeGenerationResponse } from './aiCodeService';

// Realtime Services
export { WebSocketService, getWebSocketService } from './websocketService';
export type { WSMessage, WSConnectionStatus, WSMessageType } from './websocketService';

// Quality Services
export { ErrorDetectionService, getErrorDetectionService } from './errorDetectionService';
export type { CodeError, AnalysisResult } from './errorDetectionService';

// Suggestion Services
export { SuggestionService, getSuggestionService } from './suggestionService';
export type { CodeSuggestion, UserStyleProfile } from './suggestionService';
