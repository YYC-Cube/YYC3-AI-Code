import { useMemo } from 'react';
import { useDesigner } from '../../../store';

/**
 * Centralized theme tokens for shared components (ComponentPalette, AIAssistant,
 * Inspector, CodePreview, PanelCanvas, and modal overlays).
 *
 * Each token is a CSS class string (or inline style object) that adapts to the
 * active `uiTheme` ('classic' | 'liquid-glass' | 'aurora').
 *
 * Usage:  const t = useThemeTokens();
 *         <div className={t.panelBg}>...</div>
 */
export interface ThemeTokens {
  // ── Surface / Container ──
  panelBg: string;               // side panels (Palette, Inspector, AI)
  panelBorder: string;           // border on side panels
  panelShadow: string;           // box-shadow style string
  headerBg: string;              // panel header area
  sectionBorder: string;         // inner section dividers

  // ── Accent colors ──
  accent: string;                // primary accent text color class
  accentBg: string;              // accent background (buttons, badges)
  accentBorder: string;          // accent border class
  accentGradient: string;        // gradient for prominent elements
  accentHoverBg: string;         // hover background with accent

  // ── Inputs ──
  inputBg: string;               // input background
  inputBorder: string;           // input border
  inputFocusBorder: string;      // input focus border
  inputText: string;             // input text

  // ── Interactive ──
  hoverBg: string;               // general hover state bg
  activeBg: string;              // active/pressed state
  activeTabBorder: string;       // active tab indicator
  activeTabText: string;         // active tab text

  // ── Text ──
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;

  // ── AI-specific ──
  aiIconBg: string;              // AI avatar bubble
  aiIconColor: string;
  aiBubbleBg: string;            // AI message bubble
  userBubbleBg: string;          // User message bubble
  codeBg: string;                // code block bg
  codeAccent: string;            // code text

  // ── Badges / status ──
  badgeBg: string;
  badgeText: string;

  // ── Category tag colors (same across themes) ──
  categoryColors: Record<string, string>;

  // ── Suggestion card ──
  suggestionBg: string;
  suggestionBorder: string;
  suggestionAccent: string;

  // ── Button primary ──
  btnPrimary: string;
  btnPrimaryHover: string;

  // ── Separator ──
  separator: string;

  // ── Scrollbar (class to add on scroll container) ──
  scrollClass: string;

  // ── Modal / Overlay ──
  modalBg: string;            // modal surface bg
  modalBorder: string;        // modal border
  modalShadow: string;        // modal box-shadow
  overlayBg: string;          // backdrop overlay

  // ── Context Menu ──
  ctxBg: string;
  ctxBorder: string;
  ctxShadow: string;

  // ── Canvas (PanelCanvas) ──
  canvasBg: string;               // inline style background-color for canvas area
  canvasCardBg: string;           // panel card normal bg (inline color)
  canvasCardSelectedBg: string;   // panel card selected bg (inline color)
  canvasGlow1: string;            // primary ambient glow (CSS color)
  canvasGlow2: string;            // secondary ambient glow (CSS color)
  canvasGridDot: string;          // dot-grid color
  canvasGuideColor: string;       // 12-col guide border (CSS color)

  // ── Status indicators ──
  statusSyncedDot: string;        // bg class for synced status dot
  statusPendingDot: string;       // bg class for pending status dot
  statusConflictDot: string;      // bg class for conflict status dot
  statusSyncedIcon: string;       // text class for synced icon
  statusPendingIcon: string;      // text class for pending icon
  snapActiveText: string;         // text class for snap-on indicator
  dangerHover: string;            // hover classes for destructive actions
  surfaceInset: string;           // subtle inset bg (unbound event cards, etc.)
  surfaceInsetBorder: string;     // subtle inset border
  peerBorderColor: string;        // border color for peer avatar dots (CSS color)

  // ── RBAC Role tokens ──
  roleOwner: string;              // text class for owner role
  roleOwnerBg: string;            // bg class for owner badge
  roleAdmin: string;              // text class for admin role
  roleAdminBg: string;            // bg class for admin badge
  roleEditor: string;             // text class for editor role
  roleEditorBg: string;           // bg class for editor badge
  roleViewer: string;             // text class for viewer role
  roleViewerBg: string;           // bg class for viewer badge
  roleGuest: string;              // text class for guest role
  roleGuestBg: string;           // bg class for guest badge
  readOnlyOverlay: string;        // bg class for read-only overlay mask
  readOnlyBorder: string;         // border class for read-only indicators
  readOnlyBanner: string;         // bg class for read-only banner
  readOnlyText: string;           // text class for read-only labels
  rollbackBg: string;             // bg class for rollback action
  rollbackBorder: string;         // border class for rollback action
  rollbackText: string;           // text class for rollback action
  timelineTrack: string;          // bg class for timeline track line
  timelineDot: string;            // bg class for timeline dot (default)
  rbacDeniedBg: string;           // bg class for RBAC permission denied card
  rbacDeniedBorder: string;       // border class for RBAC permission denied
  rbacDeniedText: string;         // text class for RBAC denied message
}

const CLASSIC_CATEGORY: Record<string, string> = {
  basic: 'text-blue-400',
  form: 'text-emerald-400',
  data: 'text-amber-400',
  media: 'text-pink-400',
  advanced: 'text-purple-400',
};

const LG_CATEGORY: Record<string, string> = {
  basic: 'text-sky-300',
  form: 'text-teal-300',
  data: 'text-amber-300',
  media: 'text-pink-300',
  advanced: 'text-violet-300',
};

const AURORA_CATEGORY: Record<string, string> = {
  basic: 'text-[#60efff]',
  form: 'text-[#00ff87]',
  data: 'text-amber-300',
  media: 'text-pink-300',
  advanced: 'text-[#a855f7]',
};

export function useThemeTokens(): ThemeTokens {
  const { uiTheme } = useDesigner();

  return useMemo((): ThemeTokens => {
    switch (uiTheme) {
      case 'liquid-glass':
        return {
          panelBg: 'lg-glass',
          panelBorder: 'border-white/[0.06]',
          panelShadow: '1px 0 0 rgba(255,255,255,0.03), 4px 0 20px -4px rgba(0,0,0,0.2)',
          headerBg: '',
          sectionBorder: 'border-white/[0.06]',

          accent: 'text-violet-400',
          accentBg: 'bg-violet-500/20',
          accentBorder: 'border-violet-500/20',
          accentGradient: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
          accentHoverBg: 'hover:bg-white/[0.08]',

          inputBg: 'bg-white/[0.06]',
          inputBorder: 'border-white/[0.08]',
          inputFocusBorder: 'focus:border-violet-400/30 focus-within:border-violet-400/30',
          inputText: 'text-white/80',

          hoverBg: 'hover:bg-white/[0.08]',
          activeBg: 'bg-white/[0.1]',
          activeTabBorder: 'border-violet-400',
          activeTabText: 'text-violet-300',

          textPrimary: 'text-white/90',
          textSecondary: 'text-white/60',
          textTertiary: 'text-white/35',
          textMuted: 'text-white/20',

          aiIconBg: 'bg-violet-500/20',
          aiIconColor: 'text-violet-300',
          aiBubbleBg: 'bg-white/[0.04]',
          userBubbleBg: 'bg-violet-500/10',
          codeBg: 'bg-black/20',
          codeAccent: 'text-violet-300/80',

          badgeBg: 'bg-white/[0.06]',
          badgeText: 'text-white/25',

          categoryColors: LG_CATEGORY,

          suggestionBg: 'bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.08]',
          suggestionBorder: 'border-violet-500/10',
          suggestionAccent: 'text-violet-300',

          btnPrimary: 'bg-violet-500',
          btnPrimaryHover: 'hover:bg-violet-600',

          separator: 'bg-white/[0.06]',

          scrollClass: '',

          modalBg: 'lg-glass',
          modalBorder: 'border-white/[0.1]',
          modalShadow: '0 16px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          overlayBg: 'bg-black/50 backdrop-blur-sm',

          ctxBg: 'bg-[#1e1f32]/95 backdrop-blur-xl',
          ctxBorder: 'border-white/[0.1]',
          ctxShadow: '0 12px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px -20px rgba(139,92,246,0.08)',

          canvasBg: 'rgba(24,20,44,0.35)',
          canvasCardBg: 'rgba(30,26,54,0.45)',
          canvasCardSelectedBg: 'rgba(36,30,62,0.58)',
          canvasGlow1: 'rgba(139,92,246,0.07)',
          canvasGlow2: 'rgba(217,70,239,0.05)',
          canvasGridDot: 'rgba(255,255,255,0.04)',
          canvasGuideColor: 'rgba(139,92,246,0.05)',

          statusSyncedDot: 'bg-emerald-300',
          statusPendingDot: 'bg-violet-300 animate-pulse',
          statusConflictDot: 'bg-red-300 animate-pulse',
          statusSyncedIcon: 'text-emerald-300/60',
          statusPendingIcon: 'text-violet-300/60',
          snapActiveText: 'text-violet-300',
          dangerHover: 'hover:text-red-300 hover:bg-red-400/10',
          surfaceInset: 'bg-white/[0.02]',
          surfaceInsetBorder: 'border-white/[0.04]',
          peerBorderColor: '#1e1f32',

          roleOwner: 'text-amber-400',
          roleOwnerBg: 'bg-amber-500/15',
          roleAdmin: 'text-rose-400',
          roleAdminBg: 'bg-rose-500/15',
          roleEditor: 'text-violet-400',
          roleEditorBg: 'bg-violet-500/15',
          roleViewer: 'text-white/40',
          roleViewerBg: 'bg-white/[0.06]',
          roleGuest: 'text-white/25',
          roleGuestBg: 'bg-white/[0.04]',
          readOnlyOverlay: 'bg-black/[0.04]',
          readOnlyBorder: 'border-amber-400/20',
          readOnlyBanner: 'bg-amber-500/[0.06]',
          readOnlyText: 'text-amber-400/70',
          rollbackBg: 'bg-orange-500/15',
          rollbackBorder: 'border-orange-500/20',
          rollbackText: 'text-orange-400',
          timelineTrack: 'bg-violet-500/10',
          timelineDot: 'bg-violet-400',
          rbacDeniedBg: 'bg-red-500/[0.06]',
          rbacDeniedBorder: 'border-red-500/15',
          rbacDeniedText: 'text-red-400/70',
        };

      case 'aurora':
        return {
          panelBg: 'aurora-glass',
          panelBorder: 'border-[#00ff87]/[0.08]',
          panelShadow: '1px 0 0 rgba(0,255,135,0.03), 4px 0 20px -4px rgba(0,0,0,0.3)',
          headerBg: '',
          sectionBorder: 'border-[#00ff87]/[0.06]',

          accent: 'text-[#00ff87]',
          accentBg: 'bg-[#00ff87]/[0.1]',
          accentBorder: 'border-[#00ff87]/[0.15]',
          accentGradient: 'bg-gradient-to-br from-[#00ff87] to-[#60efff]',
          accentHoverBg: 'hover:bg-[#00ff87]/[0.06]',

          inputBg: 'bg-white/[0.04]',
          inputBorder: 'border-[#00ff87]/[0.08]',
          inputFocusBorder: 'focus:border-[#00ff87]/20 focus-within:border-[#00ff87]/20',
          inputText: 'text-white/80',

          hoverBg: 'hover:bg-[#00ff87]/[0.06]',
          activeBg: 'bg-[#00ff87]/[0.1]',
          activeTabBorder: 'border-[#00ff87]',
          activeTabText: 'text-[#00ff87]',

          textPrimary: 'text-white/90',
          textSecondary: 'text-white/60',
          textTertiary: 'text-white/30',
          textMuted: 'text-white/15',

          aiIconBg: 'bg-[#00ff87]/[0.15]',
          aiIconColor: 'text-[#00ff87]',
          aiBubbleBg: 'bg-white/[0.03]',
          userBubbleBg: 'bg-[#00ff87]/[0.06]',
          codeBg: 'bg-black/20',
          codeAccent: 'text-[#60efff]/80',

          badgeBg: 'bg-white/[0.04]',
          badgeText: 'text-white/20',

          categoryColors: AURORA_CATEGORY,

          suggestionBg: 'bg-gradient-to-br from-[#00ff87]/[0.06] to-[#60efff]/[0.06]',
          suggestionBorder: 'border-[#00ff87]/[0.1]',
          suggestionAccent: 'text-[#00ff87]',

          btnPrimary: 'bg-[#00ff87]',
          btnPrimaryHover: 'hover:bg-[#00e67a]',

          separator: 'bg-[#00ff87]/[0.06]',

          scrollClass: 'aurora-theme',

          modalBg: 'aurora-glass',
          modalBorder: 'border-[#00ff87]/[0.1]',
          modalShadow: '0 16px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,135,0.06), 0 0 80px -30px rgba(0,255,135,0.08)',
          overlayBg: 'bg-black/50 backdrop-blur-sm',

          ctxBg: 'bg-[#0e1a14]/95 backdrop-blur-xl',
          ctxBorder: 'border-[#00ff87]/[0.1]',
          ctxShadow: '0 12px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,135,0.04), 0 0 60px -20px rgba(0,255,135,0.08)',

          canvasBg: 'rgba(10,24,18,0.35)',
          canvasCardBg: 'rgba(16,32,22,0.45)',
          canvasCardSelectedBg: 'rgba(20,38,28,0.58)',
          canvasGlow1: 'rgba(0,255,135,0.07)',
          canvasGlow2: 'rgba(96,239,255,0.05)',
          canvasGridDot: 'rgba(255,255,255,0.04)',
          canvasGuideColor: 'rgba(0,255,135,0.05)',

          statusSyncedDot: 'bg-[#00ff87]',
          statusPendingDot: 'bg-[#60efff] animate-pulse',
          statusConflictDot: 'bg-red-400 animate-pulse',
          statusSyncedIcon: 'text-[#00ff87]/60',
          statusPendingIcon: 'text-[#60efff]/60',
          snapActiveText: 'text-[#00ff87]',
          dangerHover: 'hover:text-red-400 hover:bg-red-500/10',
          surfaceInset: 'bg-white/[0.02]',
          surfaceInsetBorder: 'border-[#00ff87]/[0.04]',
          peerBorderColor: '#0e1a14',

          roleOwner: 'text-amber-400',
          roleOwnerBg: 'bg-amber-500/15',
          roleAdmin: 'text-rose-400',
          roleAdminBg: 'bg-rose-500/15',
          roleEditor: 'text-[#00ff87]',
          roleEditorBg: 'bg-[#00ff87]/[0.12]',
          roleViewer: 'text-white/40',
          roleViewerBg: 'bg-white/[0.06]',
          roleGuest: 'text-white/25',
          roleGuestBg: 'bg-white/[0.04]',
          readOnlyOverlay: 'bg-black/[0.04]',
          readOnlyBorder: 'border-amber-400/20',
          readOnlyBanner: 'bg-amber-500/[0.06]',
          readOnlyText: 'text-amber-400/70',
          rollbackBg: 'bg-orange-500/15',
          rollbackBorder: 'border-orange-500/20',
          rollbackText: 'text-orange-400',
          timelineTrack: 'bg-[#00ff87]/[0.08]',
          timelineDot: 'bg-[#00ff87]',
          rbacDeniedBg: 'bg-red-500/[0.06]',
          rbacDeniedBorder: 'border-red-500/15',
          rbacDeniedText: 'text-red-400/70',
        };

      default: // classic
        return {
          panelBg: 'bg-[#12131a]',
          panelBorder: 'border-white/[0.06]',
          panelShadow: '1px 0 0 rgba(255,255,255,0.02), 4px 0 20px -4px rgba(0,0,0,0.3)',
          headerBg: '',
          sectionBorder: 'border-white/[0.06]',

          accent: 'text-indigo-400',
          accentBg: 'bg-indigo-500/20',
          accentBorder: 'border-indigo-500/20',
          accentGradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
          accentHoverBg: 'hover:bg-white/[0.06]',

          inputBg: 'bg-white/[0.04]',
          inputBorder: 'border-white/[0.06]',
          inputFocusBorder: 'focus:border-indigo-500/30 focus-within:border-indigo-500/30',
          inputText: 'text-white/70',

          hoverBg: 'hover:bg-white/[0.06]',
          activeBg: 'bg-white/[0.08]',
          activeTabBorder: 'border-indigo-400',
          activeTabText: 'text-indigo-400',

          textPrimary: 'text-white/80',
          textSecondary: 'text-white/60',
          textTertiary: 'text-white/30',
          textMuted: 'text-white/20',

          aiIconBg: 'bg-indigo-500/20',
          aiIconColor: 'text-indigo-400',
          aiBubbleBg: 'bg-white/[0.03]',
          userBubbleBg: 'bg-violet-500/10',
          codeBg: 'bg-black/20',
          codeAccent: 'text-indigo-300/80',

          badgeBg: 'bg-white/[0.04]',
          badgeText: 'text-white/20',

          categoryColors: CLASSIC_CATEGORY,

          suggestionBg: 'bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.08]',
          suggestionBorder: 'border-indigo-500/10',
          suggestionAccent: 'text-indigo-400',

          btnPrimary: 'bg-indigo-500',
          btnPrimaryHover: 'hover:bg-indigo-600',

          separator: 'bg-white/[0.06]',

          scrollClass: '',

          modalBg: 'bg-[#1a1b2e]',
          modalBorder: 'border-white/[0.08]',
          modalShadow: '0 16px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px -30px rgba(99,102,241,0.1)',
          overlayBg: 'bg-black/60',

          ctxBg: 'bg-[#1a1b2e]',
          ctxBorder: 'border-white/[0.1]',
          ctxShadow: '0 12px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px -20px rgba(99,102,241,0.08)',

          canvasBg: 'rgba(13,14,20,0.6)',
          canvasCardBg: 'rgba(22,24,34,0.5)',
          canvasCardSelectedBg: 'rgba(22,24,34,0.9)',
          canvasGlow1: 'rgba(99,102,241,0.03)',
          canvasGlow2: 'rgba(168,85,247,0.02)',
          canvasGridDot: 'rgba(255,255,255,0.03)',
          canvasGuideColor: 'rgba(99,102,241,0.03)',

          statusSyncedDot: 'bg-emerald-400',
          statusPendingDot: 'bg-amber-400 animate-pulse',
          statusConflictDot: 'bg-red-400 animate-pulse',
          statusSyncedIcon: 'text-emerald-400/60',
          statusPendingIcon: 'text-amber-400/60',
          snapActiveText: 'text-cyan-400',
          dangerHover: 'hover:text-red-400 hover:bg-red-500/10',
          surfaceInset: 'bg-white/[0.02]',
          surfaceInsetBorder: 'border-white/[0.04]',
          peerBorderColor: '#0d0e14',

          roleOwner: 'text-amber-400',
          roleOwnerBg: 'bg-amber-500/15',
          roleAdmin: 'text-rose-400',
          roleAdminBg: 'bg-rose-500/15',
          roleEditor: 'text-indigo-400',
          roleEditorBg: 'bg-indigo-500/15',
          roleViewer: 'text-white/40',
          roleViewerBg: 'bg-white/[0.06]',
          roleGuest: 'text-white/25',
          roleGuestBg: 'bg-white/[0.04]',
          readOnlyOverlay: 'bg-black/[0.04]',
          readOnlyBorder: 'border-amber-400/20',
          readOnlyBanner: 'bg-amber-500/[0.06]',
          readOnlyText: 'text-amber-400/70',
          rollbackBg: 'bg-orange-500/15',
          rollbackBorder: 'border-orange-500/20',
          rollbackText: 'text-orange-400',
          timelineTrack: 'bg-indigo-500/10',
          timelineDot: 'bg-indigo-400',
          rbacDeniedBg: 'bg-red-500/[0.06]',
          rbacDeniedBorder: 'border-red-500/15',
          rbacDeniedText: 'text-red-400/70',
        };
    }
  }, [uiTheme]);
}