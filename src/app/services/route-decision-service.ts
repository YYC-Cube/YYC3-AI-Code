/**
 * @file route-decision-service.ts
 * @description 功能逻辑层 — 智能路由决策服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @updated 2026-03-13
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags routing, decision, logic
 */

import type { UserInput, RouteDecision, RequestContext } from '../types/architecture'
import { IntentService } from './intent-service'

export class RouteDecisionService {
  /**
   * 根据上下文决定路由目标
   * 实现智能路由决策系统: 分析用户首次交流信息的语义和意图
   */
  static decide(context: RequestContext): RouteDecision {
    const text = typeof context.userInput.content === 'string'
      ? context.userInput.content
      : ''

    // A. 判断是否启动多联式布局设计器
    if (IntentService.shouldNavigateToDesigner(text)) {
      return {
        target: 'editor',
        parameters: {
          intent: context.aiAnalysis || IntentService.recognizeIntent(context.userInput),
          sourceText: text,
          autoFocus: 'chat',
        },
        transition: { type: 'slide', duration: 300, easing: 'ease-out' },
      }
    }

    // B. 判断是否需要全屏 AI 交互模式 (deep coding assistance)
    if (IntentService.shouldEnterAIWorkbench(text)) {
      return {
        target: 'editor',
        parameters: {
          intent: context.aiAnalysis || IntentService.recognizeIntent(context.userInput),
          sourceText: text,
          autoFocus: 'ai-workbench',
          fullscreen: true,
        },
        transition: { type: 'fade', duration: 400, easing: 'ease-in-out' },
      }
    }

    // C. Settings route
    if (text.includes('设置') || text.includes('settings') || text.includes('配置')) {
      return {
        target: 'settings',
        parameters: {},
        transition: { type: 'fade', duration: 200, easing: 'ease' },
      }
    }

    // D. Default: stay on current route or go home
    return {
      target: context.currentRoute === '/' ? 'home' : 'editor',
      parameters: {},
      transition: { type: 'none', duration: 0, easing: 'linear' },
    }
  }

  /**
   * 根据 UserInput 快速判断目标路径字符串
   */
  static getTargetPath(input: UserInput, currentRoute: string): string {
    const decision = this.decide({
      userInput: input,
      currentRoute,
      sessionState: {},
    })

    const pathMap: Record<string, string> = {
      home: '/',
      editor: '/designer',
      preview: '/designer',
      settings: '/designer',
      architecture: '/architecture',
    }

    return pathMap[decision.target] || '/'
  }
}
