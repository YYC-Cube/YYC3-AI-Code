/**
 * @file DevToolsPage.tsx
 * @description DevTools hub — access FlameGraph, EnvVars, CodeTranslator panels
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 */

import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Flame, Shield, FileCode, ArrowLeft, Wrench,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useLiquidGlass } from '../utils/liquid-glass'
import { FlameGraph } from './designer/FlameGraph'
import { EnvVarsPanel } from './designer/EnvVarsPanel'
import { CodeTranslator } from './designer/CodeTranslator'

type DevTab = 'flame' | 'envvars' | 'translator'

const DEV_TABS: { key: DevTab; icon: React.ElementType; label: string; desc: string }[] = [
  { key: 'flame', icon: Flame, label: 'Flame Graph', desc: 'Performance profiling' },
  { key: 'envvars', icon: Shield, label: 'Env Variables', desc: 'Environment management' },
  { key: 'translator', icon: FileCode, label: 'Code Translator', desc: 'AI language translation' },
]

export function DevToolsPage() {
  const navigate = useNavigate()
  const { isLG } = useLiquidGlass()
  const [activeTab, setActiveTab] = useState<DevTab>('flame')

  const accentText = isLG ? 'text-emerald-400' : 'text-violet-400'
  const accentBg = isLG ? 'bg-emerald-500/10' : 'bg-violet-500/10'

  return (
    <div className="h-screen flex flex-col bg-[#0a0a14] text-white">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Wrench className={`w-4 h-4 ${accentText}`} />
            <span className="text-sm text-white/80">Developer Tools</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
          {DEV_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
                activeTab === tab.key
                  ? `${accentBg} ${accentText}`
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="w-20" /> {/* spacer */}
      </div>

      {/* ── Panel ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'flame' && <FlameGraph />}
        {activeTab === 'envvars' && <EnvVarsPanel />}
        {activeTab === 'translator' && <CodeTranslator />}
      </div>
    </div>
  )
}
