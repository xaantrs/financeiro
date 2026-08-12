'use client'

import { useCallback, useRef } from 'react'

/** Dispara onLongPress ao pressionar e segurar; caso contrário, dispara onClick (clique curto). */
export function useLongPress(onLongPress: () => void, onClick: () => void, ms = 450) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)

  const start = useCallback(() => {
    firedRef.current = false
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLongPress()
    }, ms)
  }, [onLongPress, ms])

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (firedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onClick()
  }, [onClick])

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: handleClick,
  }
}
