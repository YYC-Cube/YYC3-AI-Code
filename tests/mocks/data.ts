/**
 * @file data.ts
 * @description 测试数据 - Mock 数据、测试用例
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags core,typescript
 */

export const mockUser = {
  id: 'test-user-1',
  name: '测试用户',
  email: 'test@example.com',
  avatar: '/placeholder-user.jpg',
}

export const mockProject = {
  id: 'test-project-1',
  name: '测试项目',
  description: '这是一个测试项目',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockTheme = {
  type: 'dark' as const,
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  backgroundColor: '#0f172a',
  textColor: '#f8fafc',
}

export const mockAIResponse = {
  id: 'test-ai-response-1',
  content: '这是一个AI生成的代码示例',
  timestamp: new Date().toISOString(),
  tokens: 150,
}