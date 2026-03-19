/**
 * @file DesignerLayout.tsx
 * @description YYC3 Designer 布局组件 — 整合工具栏、组件面板、画布、属性面板、状态栏等核心 UI
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags designer,layout,ui,toolbar,palette,canvas,inspector
 */

import { GlobalToolbar } from './GlobalToolbar';
import { ActivityBar } from './ActivityBar';
import { ComponentPalette } from './ComponentPalette';
import { PanelCanvas } from './PanelCanvas';
import { Inspector } from './Inspector';
import { StatusBar } from './StatusBar';
import { ErrorBoundary } from '../ErrorBoundary';
import { AIAssistant } from './AIAssistant';
import { CodePreview } from './CodePreview';
import { ModelSettings } from './ModelSettings';
import { SchemaExplorer } from './SchemaExplorer';
import { DeployPanel } from './DeployPanel';
import { BackendArchitecture } from './BackendArchitecture';
import { HostStorage } from './HostStorage';
import { FigmaGuide } from './FigmaGuide';
import { DeployManual } from './DeployManual';
import { QualityPanel } from './QualityPanel';
import { CRDTPanel } from './CRDTPanel';
import { ConflictResolver } from './ConflictResolver';
import { CodeGeneratorDialog } from './CodeGenerator';
import { DragPreviewGhost } from './DragPreviewGhost';
import { LiquidGlassLayout } from './LiquidGlassLayout';
import { AuroraLayout } from './AuroraLayout';
import { useDesigner } from '../../store';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useDesignerCRDT } from '../../hooks/useDesignerCRDT';
import { useAppSettings } from '../../hooks/useAppSettings';
import {
  bridgeReadForDesigner, bridgeClearForDesigner,
  bridgeSendToCode,
} from '../../crossRouteBridge';
import { generateReactCode } from './CodeGenerator';
import { AnimatePresence, motion } from 'motion/react';
import { Layers } from 'lucide-react';

type UITheme = 'classic' | 'liquid-glass' | 'aurora';

const CROSSFADE_MS = 350;

function ThemeContent({ theme }: { theme: UITheme }) {
  if (theme === 'liquid-glass') return <LiquidGlassLayout />;
  if (theme === 'aurora') return <AuroraLayout />;

  // Classic theme
  return <ClassicLayout />;
}

function ClassicLayout() {
  const {
    activeNavSection, secondaryNavOpen, codePreviewOpen, toggleCodePreview,
    importDesignJSON, panels, components, addAIMessage, projectName,
  } = useDesigner();
  const showComponentPalette = activeNavSection === 'components' && secondaryNavOpen;
  const navigate = useNavigate();
  const [bridgeToast, setBridgeToast] = useState<string | null>(null);

  /* ── Read from AI Code bridge on mount ── */
  useEffect(() => {
    const payload = bridgeReadForDesigner();
    if (payload && payload.components && payload.components.length > 0) {
      // Auto-import components from AI Code System
      const maxY = panels.reduce((m, p) => Math.max(m, p.y + p.h), 0);
      const ts = Date.now();
      const rnd = () => Math.random().toString(36).slice(2, 7);
      const panelId = 'panel-bridge-' + ts + '-' + rnd();
      const newComps = payload.components.map((c, i) => ({
        id: 'comp-bridge-' + ts + '-' + i + '-' + rnd(),
        type: c.type,
        label: c.label,
        props: c.props,
        panelId,
      }));
      const newPanel = {
        id: panelId,
        name: 'AI Code Import ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'custom' as const,
        x: 0, y: maxY, w: 8, h: Math.max(4, payload.components.length * 2),
        children: newComps.map(c => c.id),
      };
      importDesignJSON(JSON.stringify({
        panels: [...panels, newPanel],
        components: [...components, ...newComps],
      }));
      addAIMessage({
        role: 'assistant',
        content: `\u2728 **\u5df2\u4ece AI Code System \u540c\u6b65** ${payload.components.length} \u4e2a\u7ec4\u4ef6\u5230\u8bbe\u8ba1\u753b\u5e03\u3002\n\n\u6e90\u6587\u4ef6\uff1a${payload.fileName || '\u672a\u547d\u540d'}\n\u7ec4\u4ef6\uff1a${payload.components.map(c => c.label).join(', ')}`,
      });
      bridgeClearForDesigner();
      setBridgeToast('\u5df2\u4ece AI Code \u540c\u6b65\u7ec4\u4ef6\u5230\u753b\u5e03');
      setTimeout(() => setBridgeToast(null), 3000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Send current canvas to AI Code System ── */
  const handleSyncToCode = useCallback(() => {
    const code = generateReactCode(panels, components, projectName);
    bridgeSendToCode({
      code,
      language: 'typescript',
      fileName: projectName.replace(/[^a-zA-Z0-9]/g, '') + '.tsx',
    });
    setBridgeToast('\u8bbe\u8ba1\u5df2\u540c\u6b65\uff0c\u6b63\u5728\u8df3\u8f6c\u5230 AI Code...');
    setTimeout(() => navigate('/ai-code'), 600);
  }, [panels, components, projectName, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d0e14] text-white">
      <GlobalToolbar onSyncToCode={handleSyncToCode} />
      <div className="flex flex-1 min-h-0">
        <ActivityBar />
        {showComponentPalette && <ComponentPalette />}
        <ErrorBoundary level="panel" name="PanelCanvas" autoRecoveryMs={3000} maxAutoRecovery={5}>
          <PanelCanvas />
        </ErrorBoundary>
        <CodePreview />
        <AIAssistant />
        <ErrorBoundary level="panel" name="Inspector" autoRecoveryMs={2000} maxAutoRecovery={5}>
          <Inspector />
        </ErrorBoundary>
      </div>
      <StatusBar />
      {/* Modal overlays */}
      <ModelSettings />
      <SchemaExplorer />
      <DeployPanel />
      <BackendArchitecture />
      <HostStorage />
      <FigmaGuide />
      <DeployManual />
      <QualityPanel />
      <CRDTPanel />
      <ConflictResolver />
      {/* Code Generator (Phase 9) */}
      {codePreviewOpen && <CodeGeneratorDialog onClose={toggleCodePreview} />}

      {/* Drag Preview Ghost — custom drag layer with snap grid */}
      <DragPreviewGhost />

      {/* Bridge sync toast */}
      <AnimatePresence>
        {bridgeToast && (
          <motion.div
            className="fixed top-14 left-1/2 -translate-x-1/2 z-[500] px-4 py-2.5 rounded-xl bg-[#1a1b26] border border-cyan-500/20 shadow-2xl flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Layers size={14} className="text-cyan-400" />
            <span className="text-[12px] text-cyan-300/80">{bridgeToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DesignerLayout() {
  const {
    uiTheme, setUITheme,
    setCurrentUserIdentity, setCRDTPeers, incrementDocVersion,
    projectName, setSyncStatus,
  } = useDesigner();

  // CRDT v2.0 — Unified real-time collaboration via useCRDTCollab (replaces deprecated useCRDTAwareness)
  useDesignerCRDT({
    projectId: projectName || 'default',
    setCurrentUserIdentity,
    setCRDTPeers,
    incrementDocVersion,
    setSyncStatus,
  });

  // Phase 12 — Bidirectional theme sync: useAppSettings ↔ store.tsx
  const { settings: appSettings, updateSetting: updateAppSetting } = useAppSettings();
  const themeSyncRef = useRef(false);

  // Direction 1: store → useAppSettings (when uiTheme changes in Designer)
  useEffect(() => {
    if (themeSyncRef.current) { themeSyncRef.current = false; return; }
    if (uiTheme !== appSettings.theme) {
      updateAppSetting('theme', uiTheme);
    }
  }, [uiTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Direction 2: useAppSettings → store (when settings change from another route via storage event)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'yyc3-ui-theme' && e.newValue) {
        const newTheme = e.newValue as UITheme;
        if (newTheme !== uiTheme) {
          themeSyncRef.current = true;
          setUITheme(newTheme);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [uiTheme, setUITheme]);

  // On mount: sync theme from appSettings if different
  useEffect(() => {
    if (appSettings.theme !== uiTheme) {
      themeSyncRef.current = true;
      setUITheme(appSettings.theme);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [displayTheme, setDisplayTheme] = useState<UITheme>(uiTheme);
  const [prevTheme, setPrevTheme] = useState<UITheme | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (uiTheme !== displayTheme) {
      // Start crossfade
      setPrevTheme(displayTheme);
      setDisplayTheme(uiTheme);
      setTransitioning(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setTransitioning(false);
        setPrevTheme(null);
      }, CROSSFADE_MS);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [uiTheme]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Outgoing theme (fading out) */}
      {transitioning && prevTheme !== null && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            animation: `themeFadeOut ${CROSSFADE_MS}ms ease-in-out forwards`,
          }}
        >
          <ThemeContent theme={prevTheme} />
        </div>
      )}
      {/* Current theme (fading in) */}
      <div
        className="absolute inset-0 z-[2]"
        style={transitioning ? {
          animation: `themeFadeIn ${CROSSFADE_MS}ms ease-in-out forwards`,
        } : undefined}
      >
        <ThemeContent theme={displayTheme} />
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes themeFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes themeFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}