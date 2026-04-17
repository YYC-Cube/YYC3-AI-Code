/**
 * @file SplashScreen.tsx
 * @description YYC³ 首屏加载动画 - 品牌标识 · 标语动画 · 平滑过渡
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-04-07
 * @status active
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags splash, animation, brand, loading
 */

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import logoImage from '/yyc3-white.png'
import { createLogger } from '../utils/logger'

const log = createLogger('SplashScreen')

interface SplashScreenProps {
  onComplete: () => void
  minDuration?: number
}

export function SplashScreen({ onComplete, minDuration = 3000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'slogan-zh' | 'slogan-en' | 'fadeout'>('logo')
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    log.info('SplashScreen mounted', { minDuration })

    const timeline = [
      { delay: 0, phase: 'logo' as const },
      { delay: 800, phase: 'slogan-zh' as const },
      { delay: 1800, phase: 'slogan-en' as const },
      { delay: 2800, phase: 'fadeout' as const },
      { delay: 3500, phase: 'complete' as const },
    ]

    const timers: ReturnType<typeof setTimeout>[] = []

    timeline.forEach(({ delay, phase: targetPhase }) => {
      const timer = setTimeout(() => {
        if (targetPhase === 'complete') {
          log.info('SplashScreen complete')
          onComplete()
        } else {
          setPhase(targetPhase)
        }
      }, delay)
      timers.push(timer)
    })

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / minDuration) * 100, 100)
      setProgress(newProgress)
    }, 50)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(progressInterval)
    }
  }, [onComplete, minDuration])

  const sloganZh = '万象归元于云枢 | 深栈智启新纪元'
  const sloganEn = 'All things converge in cloud pivot; Deep stacks ignite a new era of intelligence'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 25%, #0f172a 50%, #1e293b 75%, #0a0e27 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 300 + 100,
                  height: Math.random() * 300 + 100,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `radial-gradient(circle, ${
                    ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][i % 5]
                  } 0%, transparent 70%)`,
                  filter: 'blur(60px)',
                }}
                animate={{
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="mb-12"
          >
            <motion.img
              src={logoImage}
              alt="YYC³ Logo"
              className="w-64 h-auto md:w-80 lg:w-96"
              style={{
                filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))',
              }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {phase !== 'logo' && (
              <motion.div
                key="slogan-zh"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="text-center mb-6"
              >
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {sloganZh.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="text-2xl md:text-3xl lg:text-4xl font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 0 30px rgba(96, 165, 250, 0.3)',
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {(phase === 'slogan-en' || phase === 'fadeout') && (
              <motion.div
                key="slogan-en"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="text-center mb-12"
              >
                <motion.p
                  className="text-sm md:text-base lg:text-lg text-gray-400 font-light tracking-wide"
                  style={{
                    textShadow: '0 0 20px rgba(156, 163, 175, 0.2)',
                  }}
                >
                  {sloganEn}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="relative h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
            <motion.p
              className="text-center text-xs text-gray-500 mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              正在初始化智能编程环境...
            </motion.p>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <p className="text-xs text-gray-600">
            © 2026 YYC³ AI · YanYuCloudCube Team
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SplashScreen
