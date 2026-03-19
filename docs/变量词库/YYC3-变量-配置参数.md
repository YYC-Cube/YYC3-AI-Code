# YYC3 变量词库 - 配置参数

> Source: YYC-Cube/YanYuCloud @ YYC3-Design-Prompt/变量词库/

## 应用配置
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `{{APP_NAME}}` | YYC3 AI Code | 应用名称 |
| `{{APP_VERSION}}` | 1.0.0 | 应用版本号 |
| `{{APP_ENVIRONMENT}}` | development | 运行环境 |
| `{{SERVER_PORT}}` | 3201 | 服务器端口 |
| `{{API_BASE_URL}}` | http://localhost:3201/api | API 基础 URL |
| `{{API_TIMEOUT}}` | 30000 | API 请求超时(ms) |
| `{{API_RETRY_ATTEMPTS}}` | 3 | API 重试次数 |
| `{{WS_URL}}` | ws://localhost:3201 | WebSocket URL |
| `{{WS_RECONNECT_INTERVAL}}` | 5000 | WS 重连间隔(ms) |
| `{{WS_HEARTBEAT_INTERVAL}}` | 30000 | WS 心跳间隔(ms) |

## 编辑器配置
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `{{EDITOR_FONT_SIZE}}` | 14 | 编辑器字体大小 |
| `{{EDITOR_TAB_SIZE}}` | 2 | Tab 大小 |

## AI 配置
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `{{AI_DEFAULT_PROVIDER}}` | openai | 默认 AI 提供商 |
| `{{AI_DEFAULT_MODEL}}` | gpt-4 | 默认 AI 模型 |
| `{{AI_TEMPERATURE}}` | 0.7 | 温度参数 |
| `{{AI_MAX_TOKENS}}` | 4096 | 最大 tokens |
| `{{AI_STREAM_ENABLED}}` | true | 是否流式输出 |

## UI 配置
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `{{UI_THEME}}` | dark | 默认主题 |
| `{{UI_LANGUAGE}}` | zh-CN | 默认语言 |
| `{{UI_ANIMATION_DURATION}}` | 300 | 动画时长(ms) |
| `{{PERF_DEBOUNCE_DELAY}}` | 300 | 防抖延迟(ms) |
