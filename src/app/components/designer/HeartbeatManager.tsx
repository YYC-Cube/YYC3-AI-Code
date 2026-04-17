/**
 * @file HeartbeatManager.tsx
 * @description Invisible lifecycle component — starts/stops AI model heartbeat monitoring
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useEffect } from 'react'
import { useHeartbeatStore } from '../../stores/heartbeat-store'
import { createLogger } from '../../utils/logger'

const log = createLogger('HeartbeatManager')

/**
 * Invisible component that manages the heartbeat lifecycle.
 * Mount in DesignerPage to start monitoring, unmount to stop.
 */
export function HeartbeatManager() {
  const { startHeartbeat, stopHeartbeat } = useHeartbeatStore()

  useEffect(() => {
    log.info('HeartbeatManager mounted — starting heartbeat monitor')
    startHeartbeat()
    return () => {
      log.info('HeartbeatManager unmounting — stopping heartbeat monitor')
      stopHeartbeat()
    }
  }, [])

  return null
}