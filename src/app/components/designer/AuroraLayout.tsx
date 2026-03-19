import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers, Puzzle, Database, Server, Sparkles, TestTube,
  Radio, Settings, ChevronLeft, ChevronRight, Save, Code,
  Sun, Moon, ChevronDown, Undo2, Redo2, Search, Zap,
  Eye, Wifi, WifiOff, Cpu, Clock, Users, Magnet,
  HardDrive, Rocket, BookOpen, Figma, AlertTriangle,
  Droplets, Flame, X, Lock, ShieldAlert, ChevronUp,
  Shield
} from 'lucide-react';
import yyc3Logo from '/yyc3-logo-blue.png';
import { useDesigner, type NavSection } from '../../store';
import { Tooltip } from './Tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { useActivityBarNav } from './hooks/useFlyoutMenu';
import { SharedFlyoutMenu, type FlyoutStyleConfig } from './hooks/FlyoutMenuRenderer';

/* ================================================================
   Aurora Background with Floating Particles
   ================================================================ */

function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const ripplesRef = useRef<{ x: number; y: number; birth: number; color: number[] }[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Lazy init Web Audio context for ripple sound
  const playRippleSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      // Short watery "plop" via filtered noise + sine ping
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      oscGain.gain.setValueAtTime(0.03, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(oscGain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      // Noise burst for splash texture
      const bufSize = ctx.sampleRate * 0.08;
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1200 + Math.random() * 600;
      bpf.Q.value = 1.5;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.06, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noiseSrc.connect(bpf).connect(noiseGain).connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.12);
    } catch { /* Audio not available — silent fallback */ }
  }, []);

  // Dynamic aurora light bands via Canvas with mouse interaction + click ripple
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Click ripple
    const rippleColors = [[0, 255, 135], [96, 239, 255], [168, 85, 247], [0, 200, 100]];
    const onMouseDown = (e: MouseEvent) => {
      const ripples = ripplesRef.current;
      const color = rippleColors[Math.floor(Math.random() * rippleColors.length)];
      ripples.push({ x: e.clientX, y: e.clientY, birth: performance.now(), color });
      // Cap to 6 simultaneous ripples
      if (ripples.length > 6) ripples.shift();
      playRippleSound();
    };
    window.addEventListener('mousedown', onMouseDown);

    // Aurora band parameters
    const bands = [
      { baseY: 0.25, amplitude: 60, wavelength: 600, speed: 0.0003, color1: [0, 255, 135], color2: [96, 239, 255], opacity: 0.07, thickness: 120, mouseInfluence: 0.08 },
      { baseY: 0.40, amplitude: 45, wavelength: 500, speed: 0.00025, color1: [96, 239, 255], color2: [168, 85, 247], opacity: 0.05, thickness: 100, mouseInfluence: 0.12 },
      { baseY: 0.55, amplitude: 55, wavelength: 700, speed: 0.00035, color1: [168, 85, 247], color2: [0, 255, 135], opacity: 0.04, thickness: 140, mouseInfluence: 0.06 },
      { baseY: 0.15, amplitude: 35, wavelength: 400, speed: 0.0002, color1: [0, 200, 100], color2: [0, 180, 255], opacity: 0.03, thickness: 80, mouseInfluence: 0.10 },
    ];

    const drawBand = (t: number, band: typeof bands[number], mx: number, my: number) => {
      const { baseY, amplitude, wavelength, speed, color1, color2, opacity, thickness, mouseInfluence } = band;

      // Mouse displacement: bands shift toward cursor with smooth influence
      const mouseYOffset = (my - baseY) * h * mouseInfluence;
      const mouseXPhaseShift = (mx - 0.5) * mouseInfluence * 4;
      const yCenter = h * baseY + mouseYOffset;
      const phase = t * speed + mouseXPhaseShift;

      // Mouse proximity boosts opacity slightly
      const dist = Math.abs(my - baseY);
      const proximityBoost = Math.max(0, 1 - dist * 3) * 0.03;

      const points: [number, number][] = [];
      for (let x = -20; x <= w + 20; x += 4) {
        // Mouse creates a local attraction field
        const xNorm = x / w;
        const dxMouse = xNorm - mx;
        const localPull = Math.exp(-(dxMouse * dxMouse) * 12) * mouseInfluence * h * 0.15;

        const y = yCenter
          + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude
          + Math.sin((x / (wavelength * 0.6)) * Math.PI * 2 + phase * 1.3) * (amplitude * 0.4)
          + Math.cos((x / (wavelength * 1.5)) * Math.PI * 2 - phase * 0.7) * (amplitude * 0.25)
          - localPull;
        points.push([x, y]);
      }

      // Draw band as a gradient-filled path
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      const r1 = color1[0], g1 = color1[1], b1 = color1[2];
      const r2 = color2[0], g2 = color2[1], b2 = color2[2];
      const op = opacity + proximityBoost;
      grad.addColorStop(0, 'rgba(' + r1 + ',' + g1 + ',' + b1 + ',' + op + ')');
      grad.addColorStop(0.3, 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + (op * 1.2) + ')');
      grad.addColorStop(0.6, 'rgba(' + r1 + ',' + g1 + ',' + b1 + ',' + (op * 0.8) + ')');
      grad.addColorStop(1, 'rgba(' + r2 + ',' + g2 + ',' + b2 + ',' + op + ')');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1] - thickness / 2);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1] - thickness / 2);
      }
      for (let i = points.length - 1; i >= 0; i--) {
        ctx.lineTo(points[i][0], points[i][1] + thickness / 2);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Draw click ripples
    const RIPPLE_DURATION = 1200; // ms
    const RIPPLE_MAX_RADIUS = 200;
    const drawRipples = (now: number) => {
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = now - r.birth;
        if (age > RIPPLE_DURATION) {
          ripples.splice(i, 1);
          continue;
        }
        const progress = age / RIPPLE_DURATION;
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const radius = eased * RIPPLE_MAX_RADIUS;
        const alpha = (1 - progress) * 0.12;

        // Draw 2 concentric rings
        for (let ring = 0; ring < 2; ring++) {
          const rr = radius * (1 - ring * 0.3);
          const aa = alpha * (1 - ring * 0.4);
          ctx.beginPath();
          ctx.arc(r.x, r.y, Math.max(0, rr), 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(' + r.color[0] + ',' + r.color[1] + ',' + r.color[2] + ',' + aa + ')';
          ctx.lineWidth = 1.5 - ring * 0.5;
          ctx.stroke();
        }

        // Inner glow fill
        const glowGrad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, radius);
        glowGrad.addColorStop(0, 'rgba(' + r.color[0] + ',' + r.color[1] + ',' + r.color[2] + ',' + (alpha * 0.3) + ')');
        glowGrad.addColorStop(0.5, 'rgba(' + r.color[0] + ',' + r.color[1] + ',' + r.color[2] + ',' + (alpha * 0.1) + ')');
        glowGrad.addColorStop(1, 'rgba(' + r.color[0] + ',' + r.color[1] + ',' + r.color[2] + ',0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = (t: number) => {
      // Smooth lerp of mouse position for organic feel
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.04;
      m.y += (m.targetY - m.y) * 0.04;

      ctx.clearRect(0, 0, w, h);
      for (const band of bands) {
        drawBand(t, band, m.x, m.y);
      }
      // Render ripples on top of bands
      drawRipples(performance.now());
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [playRippleSound]);

  // Also keep CSS particles for sparkle effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const particles: HTMLDivElement[] = [];

    // Original green particles
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'aurora-particle';
      const size = 4 + Math.random() * 8;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';
      p.style.animationDelay = (Math.random() * 25) + 's';
      p.style.animationDuration = (18 + Math.random() * 12) + 's';
      container.appendChild(p);
      particles.push(p);
    }

    // Glow particles (pulsing halo)
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('div');
      p.className = 'aurora-particle-glow';
      const size = 10 + Math.random() * 16;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';
      p.style.animationDelay = (Math.random() * 20) + 's';
      container.appendChild(p);
      particles.push(p);
    }

    // Cyan particles
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'aurora-particle-cyan';
      const size = 3 + Math.random() * 6;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';
      p.style.animationDelay = (Math.random() * 22) + 's';
      p.style.animationDuration = (16 + Math.random() * 10) + 's';
      container.appendChild(p);
      particles.push(p);
    }

    // Purple particles
    for (let i = 0; i < 4; i++) {
      const p = document.createElement('div');
      p.className = 'aurora-particle-purple';
      const size = 5 + Math.random() * 10;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';
      p.style.animationDelay = (Math.random() * 18) + 's';
      container.appendChild(p);
      particles.push(p);
    }

    // Sparkles (tiny bright dots)
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div');
      s.className = 'aurora-sparkle';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 5) + 's';
      s.style.animationDuration = (2 + Math.random() * 3) + 's';
      container.appendChild(s);
      particles.push(s);
    }

    // Light rays (vertical penetration beams)
    for (let i = 0; i < 3; i++) {
      const ray = document.createElement('div');
      ray.className = 'aurora-light-ray';
      ray.style.left = (15 + i * 30 + Math.random() * 10) + '%';
      ray.style.top = '0';
      ray.style.width = (40 + Math.random() * 60) + 'px';
      ray.style.height = '100%';
      ray.style.animationDelay = (i * 4 + Math.random() * 3) + 's';
      ray.style.animationDuration = (10 + Math.random() * 6) + 's';
      container.appendChild(ray);
      particles.push(ray);
    }

    return () => { particles.forEach(p => p.remove()); };
  }, []);

  return (
    <div ref={containerRef} className="aurora-bg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}

/* ================================================================
   Aurora Toolbar (top bar)
   ================================================================ */

function AuroraToolbar() {
  const {
    projectName, toggleTheme, theme, viewMode, setViewMode,
    syncStatus, undo, redo, canUndo, canRedo,
    toggleConflictResolver, conflicts, openModelSettings,
    uiTheme, setUITheme, currentUserIdentity,
  } = useDesigner();

  const userRole = currentUserIdentity?.role || 'editor';
  const isReadOnly = userRole === 'viewer' || userRole === 'guest';
  const roleMeta = AURORA_ROLE_META[userRole] || AURORA_ROLE_META.editor;

  return (
    <header
      className="h-12 flex items-center px-4 gap-2 shrink-0 z-50 select-none aurora-glass-medium aurora-shimmer aurora-glass-caustics"
      style={{ borderBottom: '1px solid rgba(0,255,135,0.06)', borderRadius: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-3">
        <img src={yyc3Logo} alt="YYC³" className="w-7 h-7 rounded-xl object-contain" />
        <div className="flex items-center gap-1 cursor-pointer group">
          <span className="text-[13px] text-white/90 group-hover:text-white transition-colors">{projectName}</span>
          <ChevronDown className="w-3 h-3 text-white/30" />
        </div>
      </div>

      <div className="w-px h-5 bg-white/[0.06] mx-1" />

      {/* History */}
      <Tooltip label="撤销" shortcut="⌘Z">
        <button onClick={undo} disabled={!canUndo}
          className={`p-2 rounded-xl transition-all ${canUndo ? 'text-white/50 hover:text-[#00ff87] hover:bg-[#00ff87]/[0.08]' : 'text-white/15 cursor-not-allowed'}`}>
          <Undo2 className="w-4 h-4" />
        </button>
      </Tooltip>
      <Tooltip label="重做" shortcut="⌘⇧Z">
        <button onClick={redo} disabled={!canRedo}
          className={`p-2 rounded-xl transition-all ${canRedo ? 'text-white/50 hover:text-[#60efff] hover:bg-[#60efff]/[0.08]' : 'text-white/15 cursor-not-allowed'}`}>
          <Redo2 className="w-4 h-4" />
        </button>
      </Tooltip>

      <div className="w-px h-5 bg-white/[0.06] mx-1" />

      {/* View mode */}
      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.03]">
        {([
          { mode: 'design' as const, icon: Layers, label: '设计' },
          { mode: 'preview' as const, icon: Eye, label: '预览' },
          { mode: 'code' as const, icon: Code, label: '代码' },
        ]).map(({ mode, icon: Icon, label }) => (
          <Tooltip key={mode} label={label}>
            <button onClick={() => setViewMode(mode)}
              className={`p-2 rounded-lg transition-all ${
                viewMode === mode
                  ? 'bg-[#00ff87]/[0.12] text-[#00ff87] shadow-sm'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
              }`}>
              <Icon className="w-4 h-4" />
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-xl aurora-glass text-white/30 hover:text-white/50 hover:bg-white/[0.06] transition-all text-[12px] w-64">
          <Search className="w-4 h-4" />
          <span>搜索组件、面板...</span>
          <div className="ml-auto flex items-center gap-0.5">
            <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded-md text-[10px] text-white/25">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded-md text-[10px] text-white/25">K</kbd>
          </div>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]">
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === 'synced' ? 'bg-[#00ff87] shadow-[0_0_8px_rgba(0,255,135,0.4)]'
            : syncStatus === 'pending' ? 'bg-[#60efff] animate-pulse shadow-[0_0_8px_rgba(96,239,255,0.4)]'
            : 'bg-[#ff6b6b] animate-pulse shadow-[0_0_8px_rgba(255,107,107,0.4)]'
          }`} />
          <span className={syncStatus === 'conflict' ? 'text-[#ff6b6b] cursor-pointer' : 'text-white/30'}
            onClick={syncStatus === 'conflict' ? toggleConflictResolver : undefined}>
            {syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '同步中' : `冲突 (${conflicts.filter(c => !c.resolved).length})`}
          </span>
        </div>

        <div className="w-px h-5 bg-white/[0.06]" />

        <Tooltip label={isReadOnly ? '只读模式 — 无法保存' : '保存'} shortcut={isReadOnly ? undefined : '⌘S'}>
          <button
            disabled={isReadOnly}
            className={`p-2 rounded-xl transition-all ${
              isReadOnly
                ? 'text-white/10 cursor-not-allowed'
                : 'text-white/40 hover:text-[#00ff87] hover:bg-[#00ff87]/[0.08]'
            }`}
          >
            {isReadOnly ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </button>
        </Tooltip>

        <Tooltip label={theme === 'dark' ? '切换亮色' : '切换暗色'}>
          <button onClick={toggleTheme} className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </Tooltip>

        {/* Theme cycle */}
        <Tooltip label="切换主题风格">
          <button
            onClick={() => setUITheme(uiTheme === 'aurora' ? 'classic' : uiTheme === 'classic' ? 'liquid-glass' : 'aurora')}
            className="p-2 rounded-xl text-white/40 hover:text-[#00ff87] hover:bg-[#00ff87]/[0.08] transition-all"
          >
            <Flame className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip label="模型设置">
          <button onClick={openModelSettings} className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip label="用户中心">
          <div className="flex items-center gap-1.5 ml-1">
            {/* Role badge */}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${roleMeta.bg}`}>
              <Shield className={`w-2.5 h-2.5 ${roleMeta.color}`} />
              <span className={`text-[9px] ${roleMeta.color}`}>{roleMeta.label}</span>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer aurora-btn-primary" style={{ padding: 0 }}>
              <span className="text-[11px] text-[#0a1a12]">YC</span>
            </div>
          </div>
        </Tooltip>
      </div>
    </header>
  );
}

/* ================================================================
   Aurora Activity Bar with Flyout (keyboard-navigable)
   ================================================================ */

interface AuroraSubItem {
  id: string;
  label: string;
  icon: React.ElementType;
  desc: string;
  gradient: string;
  action: (ctx: any) => void;
}

interface AuroraNavItem {
  section: NavSection;
  icon: React.ElementType;
  label: string;
  gradient: string;
  getSubItems: () => AuroraSubItem[];
}

const AURORA_NAV: AuroraNavItem[] = [
  {
    section: 'design', icon: Layers, label: '设计画布', gradient: 'from-green-400 to-cyan-400',
    getSubItems: () => [
      { id: 'canvas', label: '画布编辑器', icon: Layers, desc: '主设计画布', gradient: 'from-green-400 to-cyan-400', action: c => c.setViewMode('design') },
      { id: 'preview', label: '实时预览', icon: Eye, desc: '预览所有面板', gradient: 'from-cyan-400 to-blue-400', action: c => c.setViewMode('preview') },
      { id: 'code', label: '代码模式', icon: Code, desc: '查看生成代码', gradient: 'from-amber-400 to-orange-400', action: c => c.setViewMode('code') },
    ],
  },
  {
    section: 'components', icon: Puzzle, label: '组件面板', gradient: 'from-purple-400 to-pink-400',
    getSubItems: () => [],
  },
  {
    section: 'data', icon: Database, label: '数据管理', gradient: 'from-cyan-400 to-teal-400',
    getSubItems: () => [
      { id: 'schema', label: '数据库管理', icon: Database, desc: 'Schema Explorer', gradient: 'from-cyan-400 to-teal-400', action: c => c.toggleSchemaExplorer() },
    ],
  },
  {
    section: 'infra', icon: Server, label: '基础设施', gradient: 'from-amber-400 to-orange-400',
    getSubItems: () => [
      { id: 'backend', label: '后端架构', icon: Server, desc: '五标签页', gradient: 'from-amber-400 to-orange-400', action: c => c.toggleBackendArch() },
      { id: 'storage', label: '宿主机存储', icon: HardDrive, desc: '六标签页', gradient: 'from-blue-400 to-cyan-400', action: c => c.toggleHostStorage() },
      { id: 'deploy', label: '配置即部署', icon: Rocket, desc: '五步部署', gradient: 'from-green-400 to-emerald-400', action: c => c.toggleDeployPanel() },
      { id: 'manual', label: '部署手册', icon: BookOpen, desc: '三标签页', gradient: 'from-amber-400 to-yellow-400', action: c => c.toggleDeployManual() },
    ],
  },
  {
    section: 'ai', icon: Sparkles, label: 'AI 智能', gradient: 'from-purple-400 to-pink-400',
    getSubItems: () => [
      { id: 'assist', label: 'AI 助手', icon: Sparkles, desc: '属性建议 / 代码片段', gradient: 'from-purple-400 to-pink-400', action: c => c.toggleAI() },
      { id: 'figma', label: 'Figma 设计指南', icon: Figma, desc: '五标签页', gradient: 'from-violet-400 to-purple-400', action: c => c.toggleFigmaGuide() },
      { id: 'codegen', label: '代码生成引擎', icon: Code, desc: '代码预览', gradient: 'from-indigo-400 to-blue-400', action: c => c.toggleCodePreview() },
    ],
  },
  {
    section: 'quality', icon: TestTube, label: '质量保障', gradient: 'from-emerald-400 to-green-400',
    getSubItems: () => [
      { id: 'quality', label: '质量面板', icon: TestTube, desc: '五标签页', gradient: 'from-emerald-400 to-green-400', action: c => c.toggleQualityPanel() },
    ],
  },
  {
    section: 'collab', icon: Radio, label: 'CRDT 协同', gradient: 'from-cyan-400 to-blue-400',
    getSubItems: () => [
      { id: 'crdt', label: 'CRDT 协同', icon: Radio, desc: '四标签页', gradient: 'from-cyan-400 to-blue-400', action: c => c.toggleCRDTPanel() },
      { id: 'conflicts', label: '冲突解析器', icon: AlertTriangle, desc: '查看/解决冲突', gradient: 'from-red-400 to-pink-400', action: c => c.toggleConflictResolver() },
      { id: 'simulate', label: '模拟冲突', icon: Zap, desc: '生成测试冲突', gradient: 'from-amber-400 to-orange-400', action: c => c.simulateConflict() },
    ],
  },
  {
    section: 'settings', icon: Settings, label: '设置', gradient: 'from-gray-400 to-gray-300',
    getSubItems: () => [
      { id: 'models', label: '模型管理', icon: Settings, desc: 'AI 模型配置', gradient: 'from-gray-400 to-gray-300', action: c => c.openModelSettings() },
      { id: 'theme', label: '主题切换', icon: Sun, desc: '暗色/亮色', gradient: 'from-amber-400 to-yellow-400', action: c => c.toggleTheme() },
      { id: 'glass', label: '液态玻璃主题', icon: Droplets, desc: '切换视觉风格', gradient: 'from-purple-400 to-blue-400', action: c => c.setUITheme('liquid-glass') },
    ],
  },
];

/* ---------- Aurora Flyout Menu ---------- */

function AuroraFlyout({
  items, navItem, ctx, onClose, anchorRect,
}: {
  items: AuroraSubItem[];
  navItem: AuroraNavItem;
  ctx: any;
  onClose: () => void;
  anchorRect: DOMRect | null;
}) {
  const styleConfig: FlyoutStyleConfig = {
    containerClass: 'aurora-glass-medium aurora-light-bleed',
    containerMinHeight: 200,
    containerShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
    containerBorderColor: 'rgba(0,255,135,0.1)',
    headerBorder: '1px solid rgba(0,255,135,0.06)',
    headerIconClass: `w-5 h-5 rounded-md bg-gradient-to-br ${navItem.gradient} flex items-center justify-center`,
    headerIconColor: 'text-[#0a1a12]',
    headerLabelClass: 'text-[11px] text-white/60 tracking-wide',
    searchWrapperClass: 'flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-[#00ff87]/[0.06] focus-within:border-[#00ff87]/20 transition-colors',
    searchIconClass: 'text-white/20',
    searchInputClass: 'bg-transparent text-[11px] text-white/70 placeholder:text-white/20 outline-none w-full',
    searchClearClass: 'text-white/20 hover:text-white/50',
    historyContainerClass: 'mt-1 py-1 rounded-lg bg-white/[0.03] border border-[#00ff87]/[0.04]',
    historyLabelClass: 'text-[9px] text-white/20',
    historyClearBtnClass: 'text-[9px] text-white/15 hover:text-[#00ff87]/40 transition-colors',
    historyItemClass: 'flex items-center gap-1.5 px-2 py-1 hover:bg-[#00ff87]/[0.04] rounded cursor-pointer group',
    historyIconClass: 'text-white/15',
    historyTextClass: 'text-[10px] text-white/40 group-hover:text-white/60 flex-1 truncate',
    historyDeleteClass: 'text-white/10 hover:text-white/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
    itemBtnClass: 'hover:bg-[#00ff87]/[0.06] focus:bg-[#00ff87]/[0.08] focus:outline-none',
    itemFocusRing: 'focus:ring-1 focus:ring-[#00ff87]/30',
    itemIconWrapperClass: 'bg-gradient-to-br opacity-70 group-hover:opacity-100 transition-opacity',
    itemIconClass: 'text-[#0a1a12]',
    itemLabelClass: 'text-[11px] text-white/60 group-hover:text-white/80 transition-colors',
    itemDescClass: 'text-[9px] text-white/20 truncate',
    emptyClass: 'text-[10px] text-white/20 text-center py-3',
    arrowClass: 'bg-[#001a0f]/50',
    arrowStyle: { border: '1px solid rgba(0,255,135,0.1)', borderTop: 'none', borderRight: 'none' },
    leftOffset: 56,
  };

  return (
    <SharedFlyoutMenu
      items={items}
      navItem={{ icon: navItem.icon, label: navItem.label, gradient: navItem.gradient }}
      ctx={ctx}
      onClose={onClose}
      anchorRect={anchorRect}
      style={styleConfig}
    />
  );
}

/* ---------- Aurora Activity Bar ---------- */

function AuroraActivityBar() {
  const ctx = useDesigner();
  const { activeNavSection, setActiveNavSection, secondaryNavOpen, toggleSecondaryNav, syncStatus, conflicts, crdtPeers } = ctx;

  const { openFlyout, anchorRect, handleNavClick, closeFlyout, setButtonRef } = useActivityBarNav<AuroraNavItem>({
    ctx,
    setActiveNavSection,
  });
  const unresolvedConflicts = conflicts.filter(c => !c.resolved).length;

  const mainItems = AURORA_NAV.filter(n => n.section !== 'settings');
  const settingsItem = AURORA_NAV.find(n => n.section === 'settings')!;

  return (
    <>
      <nav
        className="w-[48px] flex flex-col items-center py-2 gap-0.5 shrink-0 select-none z-40 aurora-glass aurora-glass-caustics"
        style={{ borderRight: '1px solid rgba(0,255,135,0.06)', borderRadius: 0 }}
      >
        <div className="flex flex-col items-center gap-1 flex-1">
          {mainItems.map(navItem => {
            const { section, icon: Icon, label, gradient } = navItem;
            const isActive = activeNavSection === section;
            const hasFlyout = openFlyout === section;
            return (
              <Tooltip key={section} label={label} side="bottom">
                <button
                  ref={setButtonRef(section)}
                  onClick={() => handleNavClick(section, navItem)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${
                    isActive
                      ? 'bg-[#00ff87]/[0.1] border-[#00ff87]/20 text-[#00ff87]'
                      : 'border-transparent text-white/25 hover:text-white/50 hover:border-[#00ff87]/10 hover:bg-[#00ff87]/[0.04]'
                  } ${hasFlyout ? 'ring-1 ring-[#00ff87]/20' : ''}`}
                >
                  <Icon className="w-[16px] h-[16px]" />
                  {isActive && !hasFlyout && (
                    <div className={`absolute -left-[5px] top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-r-full bg-gradient-to-b ${gradient}`} />
                  )}
                  {section === 'collab' && (crdtPeers.length > 0 || unresolvedConflicts > 0) && (
                    <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-[#0a1a12] ${
                      unresolvedConflicts > 0 ? 'bg-[#ff6b6b]' : 'bg-[#00ff87]'
                    }`}>
                      {unresolvedConflicts > 0 ? unresolvedConflicts : crdtPeers.length + 1}
                    </div>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className="w-5 h-px bg-[#00ff87]/[0.06] my-1" />

        <Tooltip label={secondaryNavOpen ? '收起组件' : '展开组件'} side="bottom">
          <button onClick={toggleSecondaryNav}
            className="w-9 h-7 rounded-lg flex items-center justify-center text-white/15 hover:text-[#00ff87]/60 hover:bg-[#00ff87]/[0.04] transition-all border border-transparent hover:border-[#00ff87]/10">
            {secondaryNavOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>

        <Tooltip label={settingsItem.label} side="bottom">
          <button
            ref={setButtonRef(settingsItem.section)}
            onClick={() => handleNavClick(settingsItem.section, settingsItem)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${
              activeNavSection === 'settings'
                ? 'bg-white/[0.06] border-white/[0.1] text-white/60'
                : 'border-transparent text-white/20 hover:text-white/40 hover:border-white/[0.08] hover:bg-white/[0.04]'
            } ${openFlyout === 'settings' ? 'ring-1 ring-white/[0.1]' : ''}`}
          >
            <Settings className="w-[16px] h-[16px]" />
          </button>
        </Tooltip>
      </nav>

      {/* Flyout */}
      <AnimatePresence>
        {openFlyout && (() => {
          const navItem = AURORA_NAV.find(n => n.section === openFlyout);
          if (!navItem) return null;
          const subItems = navItem.getSubItems();
          if (subItems.length === 0) return null;
          return (
            <AuroraFlyout key={openFlyout} items={subItems} navItem={navItem} ctx={ctx} onClose={closeFlyout} anchorRect={anchorRect} />
          );
        })()}
      </AnimatePresence>
    </>
  );
}

/* ================================================================
   Aurora RBAC Role Meta
   ================================================================ */

const AURORA_ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  owner: { label: '所有者', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  admin: { label: '管理员', color: 'text-rose-400', bg: 'bg-rose-500/15' },
  editor: { label: '编辑者', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/[0.12]' },
  viewer: { label: '观察者', color: 'text-white/40', bg: 'bg-white/[0.06]' },
  guest: { label: '访客', color: 'text-white/25', bg: 'bg-white/[0.04]' },
};

/* ================================================================
   Aurora Status Bar — enhanced with Peer List Popup & RBAC
   ================================================================ */

function AuroraStatusBar() {
  const { syncStatus, aiTokensUsed, panels, components, snapEnabled, subCanvasPanelId, crdtPeers, crdtDocVersion, currentUserIdentity } = useDesigner();
  const [peerListOpen, setPeerListOpen] = useState(false);
  const peerListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!peerListOpen) return;
    const handler = (e: MouseEvent) => {
      if (peerListRef.current && !peerListRef.current.contains(e.target as Node)) {
        setPeerListOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [peerListOpen]);

  const userRole = currentUserIdentity?.role || 'editor';
  const isReadOnly = userRole === 'viewer' || userRole === 'guest';

  return (
    <footer
      className="h-8 flex items-center px-4 gap-4 shrink-0 select-none aurora-glass-medium aurora-glass-caustics"
      style={{ borderTop: '1px solid rgba(0,255,135,0.06)', borderRadius: 0 }}
    >
      {/* RBAC Read-only indicator */}
      {isReadOnly && (
        <>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/[0.08] border border-amber-500/15">
            <ShieldAlert className="w-3 h-3 text-amber-400/70" />
            <span className="text-[9px] text-amber-400/70">
              {userRole === 'viewer' ? '观察者' : '访客'}只读模式
            </span>
            <Lock className="w-2.5 h-2.5 text-amber-400/40" />
          </div>
          <div className="w-px h-3 bg-[#00ff87]/[0.06]" />
        </>
      )}

      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          syncStatus === 'synced' ? 'bg-[#00ff87] shadow-[0_0_6px_rgba(0,255,135,0.5)]'
          : syncStatus === 'pending' ? 'bg-[#60efff] animate-pulse'
          : 'bg-[#ff6b6b] animate-pulse'
        }`} />
        {syncStatus === 'synced' ? <Wifi className="w-3 h-3 text-[#00ff87]/60" /> : <WifiOff className="w-3 h-3 text-[#60efff]/60" />}
        <span className="text-[10px] text-white/30">CRDT {syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '同步中' : '冲突'}</span>
      </div>
      <div className="w-px h-3 bg-[#00ff87]/[0.06]" />
      <div className="flex items-center gap-1.5">
        <Database className="w-3 h-3 text-white/20" />
        <span className="text-[10px] text-white/30">{panels.length} 面板 {components.length} 组件</span>
      </div>
      <div className="w-px h-3 bg-[#00ff87]/[0.06]" />
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-[#a855f7]/40" />
        <span className="text-[10px] text-white/30">AI: {aiTokensUsed.toLocaleString()} tokens</span>
      </div>
      <div className="w-px h-3 bg-[#00ff87]/[0.06]" />

      {/* Interactive Peer List */}
      <div className="relative" ref={peerListRef}>
        <Tooltip label={`${crdtPeers.length + 1} 位协作者在线 · 点击查看`} side="top">
          <button
            onClick={() => setPeerListOpen(prev => !prev)}
            className="flex items-center gap-1.5 cursor-pointer hover:bg-[#00ff87]/[0.04] rounded px-1.5 py-0.5 transition-all"
          >
            <Users className="w-3 h-3 text-white/20" />
            <span className="text-[10px] text-white/30">{crdtPeers.length + 1} 在线</span>
            <div className="flex -space-x-1">
              {crdtPeers.slice(0, 4).map(p => (
                <div key={p.id} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color, border: '1px solid #0e1a14' }} />
              ))}
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#00ff87] to-[#60efff]" style={{ border: '1px solid #0e1a14' }} />
            </div>
            {peerListOpen
              ? <ChevronDown className="w-2.5 h-2.5 text-white/20" />
              : <ChevronUp className="w-2.5 h-2.5 text-white/20" />}
          </button>
        </Tooltip>

        {/* Peer List Popover */}
        {peerListOpen && (
          <div
            className="absolute bottom-full left-0 mb-1.5 w-[280px] aurora-glass-medium border border-[#00ff87]/[0.1] rounded-xl overflow-hidden z-[200]"
            style={{ boxShadow: '0 -8px 32px -8px rgba(0,0,0,0.6), 0 0 60px -20px rgba(0,255,135,0.08)' }}
          >
            <div className="px-3 py-2 border-b border-[#00ff87]/[0.06] flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#00ff87]" />
              <span className="text-[11px] text-white/60">在线协作者</span>
              <span className="text-[9px] text-white/20 ml-auto">CRDT v{crdtDocVersion}</span>
            </div>

            <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-0.5">
              {/* Self */}
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#00ff87]/[0.04] border border-[#00ff87]/10">
                <div className="relative shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: currentUserIdentity?.avatarColor || '#00ff87' }}
                  >
                    {currentUserIdentity?.displayName?.[0] || '我'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00ff87] border-2" style={{ borderColor: '#0e1a14' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/90 truncate">{currentUserIdentity?.displayName || '你'}</span>
                    <span className="text-[8px] text-[#00ff87] opacity-60">本机</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] px-1.5 py-0 rounded ${AURORA_ROLE_META[userRole].bg} ${AURORA_ROLE_META[userRole].color}`}>
                      {AURORA_ROLE_META[userRole].label}
                    </span>
                    <span className="text-[9px] text-white/20">
                      <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                      {isReadOnly ? '只读浏览中' : '活跃编辑中'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Peers */}
              {crdtPeers.map(peer => {
                const isOnline = Date.now() - peer.lastSeen < 30000;
                const cursorPanel = peer.cursor?.panelId ? panels.find(p => p.id === peer.cursor?.panelId) : null;
                const cursorComp = peer.cursor?.componentId ? components.find(c => c.id === peer.cursor?.componentId) : null;
                const roleMeta = AURORA_ROLE_META[peer.role || 'editor'];

                return (
                  <div key={peer.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#00ff87]/[0.03] transition-all">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: peer.color }}>
                        {peer.name[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isOnline ? 'bg-[#00ff87]' : 'bg-white/20'}`} style={{ borderColor: '#0e1a14' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-white/60 truncate">{peer.name}</span>
                        {peer.lockedPanelId && <Lock className="w-2.5 h-2.5 text-amber-400/60 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0 rounded ${roleMeta.bg} ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                        {cursorPanel ? (
                          <span className="text-[9px] text-white/20 truncate">
                            <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                            {cursorPanel.name}{cursorComp ? ` › ${cursorComp.label}` : ''}
                          </span>
                        ) : (
                          <span className="text-[9px] text-white/20">{isOnline ? '在线空闲' : '已离线'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-3 py-1.5 border-t border-[#00ff87]/[0.06] flex items-center justify-between">
              <span className="text-[9px] text-white/20">Awareness Protocol · yjs v13.6</span>
              <span className="text-[9px] text-white/20">{crdtPeers.filter(p => Date.now() - p.lastSeen < 30000).length + 1} 活跃</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />
      {subCanvasPanelId && (
        <>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#00ff87]/60" />
            <span className="text-[10px] text-[#00ff87]/40">子画布模式</span>
          </div>
          <div className="w-px h-3 bg-[#00ff87]/[0.06]" />
        </>
      )}
      <div className="flex items-center gap-1">
        <Magnet className={`w-3 h-3 ${snapEnabled ? 'text-[#00ff87]/50' : 'text-white/10'}`} />
        <span className={`text-[10px] ${snapEnabled ? 'text-[#00ff87]/30' : 'text-white/15'}`}>Snap {snapEnabled ? 'ON' : 'OFF'}</span>
      </div>
      <div className="w-px h-3 bg-[#00ff87]/[0.06]" />
      <div className="flex items-center gap-1.5">
        <Flame className="w-3 h-3 text-[#00ff87]/30" />
        <span className="text-[10px] text-white/25">Aurora v1.0</span>
      </div>
      <div className="w-px h-3 bg-[#00ff87]/[0.06]" />
      <div className="flex items-center gap-1.5">
        <Cpu className="w-3 h-3 text-white/20" />
        <span className="text-[10px] text-white/25">React 18 + TS</span>
      </div>
    </footer>
  );
}

/* ================================================================
   AuroraLayout — drop-in replacement
   ================================================================ */

import { ComponentPalette } from './ComponentPalette';
import { PanelCanvas } from './PanelCanvas';
import { Inspector } from './Inspector';
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

export function AuroraLayout() {
  const { activeNavSection, secondaryNavOpen } = useDesigner();
  const showComponentPalette = activeNavSection === 'components' && secondaryNavOpen;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-white relative aurora-theme">
      <AuroraBackground />
      <div className="relative z-10 flex flex-col h-full">
        <AuroraToolbar />
        <div className="flex flex-1 min-h-0">
          <AuroraActivityBar />
          {showComponentPalette && <ComponentPalette />}
          <PanelCanvas />
          <CodePreview />
          <AIAssistant />
          <Inspector />
        </div>
        <AuroraStatusBar />
      </div>
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
    </div>
  );
}