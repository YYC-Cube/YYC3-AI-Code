/**
 * @file LiquidGlassBackground.tsx
 * @description Animated liquid glass background with floating orbs and particles
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useEffect, useState, useMemo } from 'react'
import { useThemeStore, type ThemeLiquidGlass } from '../../stores/theme-store'

/* ============================================
   Floating Orb Component
   ============================================ */

interface OrbProps {
  size: number
  color: string
  top: string
  left: string
  delay: number
  duration: number
  variant: number
}

function FloatingOrb({ size, color, top, left, delay, duration, variant }: OrbProps) {
  const animationName = variant === 0 ? 'orbFloat' : variant === 1 ? 'orbFloat2' : 'orbFloat3'
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: `blur(${Math.max(40, size * 0.15)}px)`,
        opacity: 0.55,
        animation: `${animationName} ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform',
      }}
    />
  )
}

/* ============================================
   Particle Component
   ============================================ */

interface ParticleProps {
  x: string
  y: string
  size: number
  delay: number
  duration: number
  opacity: number
  variant: number
}

function FloatingParticle({ x, y, size, delay, duration, opacity, variant }: ParticleProps) {
  const animName = variant === 0 ? 'particleFloat' : 'particleFloat2'
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: 'rgba(255, 255, 255, 0.4)',
        opacity,
        animation: `${animName} ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform',
      }}
    />
  )
}

/* ============================================
   Main Background Component
   ============================================ */

export function LiquidGlassBackground() {
  const currentTheme = useThemeStore(s => s.currentTheme)
  const lg = currentTheme.liquidGlass
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const speed = lg?.animationSpeed ?? 1
  const baseDuration = (d: number) => d / speed

  // Generate orbs based on settings - MUST be before any conditional returns
  const orbs: OrbProps[] = useMemo(() => {
    if (!lg?.backgroundOrbs) return []
    
    const glowPrimary = lg.glowColor || 'rgba(0, 255, 135, 0.35)'
    const glowSecondary = lg.secondaryGlowColor || 'rgba(6, 182, 212, 0.3)'
    return [
      { size: 500, color: glowPrimary, top: '-10%', left: '-8%', delay: 0, duration: baseDuration(18), variant: 0 },
      { size: 420, color: glowSecondary, top: '45%', left: '65%', delay: -5, duration: baseDuration(22), variant: 1 },
      { size: 350, color: 'rgba(34, 211, 238, 0.28)', top: '70%', left: '15%', delay: -10, duration: baseDuration(20), variant: 2 },
      { size: 280, color: glowPrimary.replace(/[\d.]+\)$/, '0.2)'), top: '20%', left: '80%', delay: -3, duration: baseDuration(25), variant: 0 },
      { size: 200, color: glowSecondary.replace(/[\d.]+\)$/, '0.15)'), top: '85%', left: '50%', delay: -8, duration: baseDuration(16), variant: 1 },
    ]
  }, [lg?.enabled, lg?.backgroundOrbs, lg?.glowColor, lg?.secondaryGlowColor, speed])

  // Generate particles - MUST be before any conditional returns
  const particles: ParticleProps[] = useMemo(() => {
    if (!lg?.particles) return []
    
    const count = 18
    const result: ParticleProps[] = []
    for (let i = 0; i < count; i++) {
      const seed = (i * 137.508 + 42) % 100
      result.push({
        x: `${(seed * 1.01) % 100}%`,
        y: `${((i * 61.803 + 17) % 100)}%`,
        size: 2 + (i % 4) * 1.5,
        delay: -(i * 1.3),
        duration: baseDuration(8 + (i % 5) * 2),
        opacity: 0.15 + (i % 4) * 0.1,
        variant: i % 2,
      })
    }
    return result
  }, [lg?.enabled, lg?.particles, speed])

  // Don't render if liquid glass is not enabled
  if (!lg?.enabled) {return null}

  if (reducedMotion) {
    // Static background for reduced motion
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, ${lg.glowColor || 'rgba(0, 255, 135, 0.12)'} 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, ${lg.secondaryGlowColor || 'rgba(6, 182, 212, 0.08)'} 0%, transparent 50%)
          `,
        }}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Orbs */}
      {orbs.map((orb, i) => (
        <FloatingOrb key={`orb-${i}`} {...orb} />
      ))}

      {/* Particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={`particle-${i}`} {...p} />
      ))}
    </div>
  )
}