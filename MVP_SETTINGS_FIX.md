# YYC³ AI Code - 设置页面 MVP 修复补丁

> **文档版本**: v1.0
> **修复日期**: 2026-03-19
> **目标**: 解决“按钮无效”、“头像上传失败”、“MCP 配置缺失”等 MVP 交互问题。

---

## 📋 修复清单

1.  **账号信息**
    - ✅ 修复：头像上传按钮无效。
    - ✅ 新增：文件选择、Base64 转换、预览。
2.  **MCP 连接**
    - ✅ 修复：无法粘贴 JSON 配置。
    - ✅ 新增：JSON 导入区域、解析逻辑。
3.  **通用设置**
    - ✅ 验证：主题切换、字体选择逻辑完整（无需修改，原代码逻辑正确）。

---

## 🔧 修复步骤

### 步骤 1: 备份原文件

在 `src/app/components/settings/` 目录下，将 `SettingsPage.tsx` 备份为 `SettingsPage.tsx.bak`。

### 步骤 2: 替换 AccountSection

找到 `function AccountSection` 函数（约在第 400 行），将其整个函数体（从 `function` 到 `}`）**完全替换**为以下代码：

```tsx
/* ================================================================
   Account Section
   ================================================================ */

function AccountSection() {
  const { settings, updateUserProfile } = useSettingsStore();
  const { userProfile } = settings;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 头像上传处理
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateUserProfile({ avatar: result });
        toast.success('头像已更新');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <SectionHeader title="账号信息" subtitle="Account & Profile" />

      <SettingCard>
        <div className="flex items-start gap-4">
          {/* Avatar with Upload */}
          <div className="relative group">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-[20px]" style={{ fontWeight: 600 }}>
                {userProfile.username.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Upload Mask - Active Button */}
            <div
              onClick={handleAvatarClick}
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Upload size={16} className="text-white/80" />
            </div>
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">用户名</label>
              <SmallInput
                value={userProfile.username}
                onChange={(v) => updateUserProfile({ username: v })}
                placeholder="输入用户名"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">邮箱</label>
              <SmallInput
                value={userProfile.email}
                onChange={(v) => updateUserProfile({ email: v })}
                placeholder="输入邮箱"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">个人简介</label>
              <textarea
                value={userProfile.bio || ''}
                onChange={(e) => updateUserProfile({ bio: e.target.value })}
                placeholder="一句话介绍自己..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#667eea]/40 resize-none"
              />
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard>
        <div className="text-[11px] text-white/30 flex items-center gap-2">
          <Shield size={13} />
          <span>用户 ID: {userProfile.id}</span>
        </div>
      </SettingCard>
    </>
  );
}
```

### 步骤 3: 替换 MCPSection

找到 `function MCPSection` 函数（约在第 460 行），将其整个函数体**完全替换**为以下代码：

```tsx
/* ================================================================
   MCP Section
   ================================================================ */

function MCPSection() {
  const { settings, addMCP, updateMCP, removeMCP } = useSettingsStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [newName, setNewName] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error('请输入 MCP 名称');
      return;
    }
    const mcp: MCPConfig = {
      id: `mcp-${Date.now()}`,
      name: newName,
      type: 'manual',
      endpoint: newEndpoint || undefined,
      enabled: true,
      projectLevel: false,
    };
    addMCP(mcp);
    setNewName('');
    setNewEndpoint('');
    setShowAdd(false);
    toast.success('已添加 MCP 连接');
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.mcpServers) {
        // Support NPX/UVX config format
        let count = 0;
        Object.entries(parsed.mcpServers).forEach(([name, config]: [string, any]) => {
          const mcp: MCPConfig = {
            id: `mcp-${Date.now()}-${Math.random()}`,
            name: name,
            type: 'manual',
            endpoint: config.endpoint || `ws://localhost:3100/mcp/${name}`,
            enabled: true,
            projectLevel: false,
          };
          addMCP(mcp);
          count++;
        });
        toast.success(`成功导入 ${count} 个 MCP`);
        setJsonInput('');
        setShowJson(false);
      } else {
        toast.error('JSON 格式不正确，请确保包含 mcpServers');
      }
    } catch (e) {
      toast.error('JSON 解析失败，请检查格式');
    }
  };

  return (
    <>
      <SectionHeader title="MCP 连接管理" subtitle="Model Context Protocol" />

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="text-[11px] text-white/30">
          {settings.mcpConfigs.filter(m => m.enabled).length} / {settings.mcpConfigs.length} 已启用
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] hover:bg-white/[0.08] transition-colors"
            style={{ fontWeight: 500 }}
          >
            <FileText size={13} />
            粘贴 JSON
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#667eea]/10 text-[#667eea] text-[11px] hover:bg-[#667eea]/20 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Plus size={13} />
            添加 MCP
          </button>
        </div>
      </div>

      {/* JSON Import Form */}
      <AnimatePresence>
        {showJson && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <SettingCard className="border-[#667eea]/20">
              <div className="text-[10px] text-white/30 mb-2">
                请从 MCP Servers 的介绍页面复制配置 JSON(优先使用 NPX或 UVX 配置)，并粘贴到输入框中。
              </div>
              <div className="text-[10px] text-red-400 mb-2">
                配置前请确认来源，甄别风险
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='// 示例:\n// {\n//   "mcpServers": {\n//     "example-server": {\n//       "command": "npx",\n//       "args": ["-y", "mcp-server-example"]\n//     }\n//   }\n// }'
                rows={8}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0d0e14] border border-white/[0.08] text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#667eea]/40 resize-none font-mono"
              />
              <div className="flex gap-2 mt-3 justify-end">
                <button onClick={() => setShowJson(false)} className="px-3 py-1 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.08] transition-colors">取消</button>
                <button onClick={handleJsonImport} className="px-3 py-1 rounded-lg bg-[#667eea] text-white text-[11px] hover:bg-[#667eea]/80 transition-colors">确认</button>
              </div>
            </SettingCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <SettingCard className="border-[#667eea]/20">
              <div className="space-y-2">
                <SmallInput value={newName} onChange={setNewName} placeholder="MCP 名称" className="w-full" />
                <SmallInput value={newEndpoint} onChange={setNewEndpoint} placeholder="ws://localhost:3100/mcp/..." className="w-full" />
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="px-3 py-1 rounded-lg bg-[#667eea] text-white text-[11px] hover:bg-[#667eea]/80 transition-colors">添加</button>
                  <button onClick={() => setShowAdd(false)} className="px-3 py-1 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.08] transition-colors">取消</button>
                </div>
              </div>
            </SettingCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MCP List */}
      {settings.mcpConfigs.map((mcp) => (
        <SettingCard key={mcp.id}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mcp.enabled ? 'bg-emerald-500/15' : 'bg-white/[0.04]'}`}>
                <Plug size={14} className={mcp.enabled ? 'text-emerald-400' : 'text-white/20'} />
              </div>
              <div>
                <div className="text-[12px] text-white/80 flex items-center gap-2" style={{ fontWeight: 500 }}>
                  {mcp.name}
                  <Badge variant={mcp.type === 'market' ? 'success' : 'default'}>
                    {mcp.type === 'market' ? '市场' : '手动'}
                  </Badge>
                  {mcp.projectLevel && <Badge variant="warning">项目级</Badge>}
                </div>
                {mcp.endpoint && (
                  <div className="text-[10px] text-white/25 mt-0.5 font-mono">{mcp.endpoint}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Toggle checked={mcp.enabled} onChange={(v) => updateMCP(mcp.id, { enabled: v })} />
              <button
                onClick={() => { removeMCP(mcp.id); toast.success('已删除'); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </SettingCard>
      ))}
    </>
  );
}
```

### 步骤 4: 验证导入

确保文件顶部包含以下导入（如果缺少，请添加）：

```tsx
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, ... } from 'lucide-react'; // 确保 Upload 和 FileText 已导入
```

---

## ✅ 修复后的功能

1.  **头像上传**：点击头像遮罩 -> 选择文件 -> 自动预览。
2.  **MCP JSON 导入**：点击“粘贴 JSON” -> 展开文本框 -> 粘贴内容 -> 点击“确认” -> 自动解析并添加到列表。
3.  **数据持久化**：所有修改均通过 `useSettingsStore` 自动保存到 `localStorage`。

---

**文档结束** (EOF)
