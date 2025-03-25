import { useEffect } from 'react'

export const useDisablePinch = () => {
  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    const preventGesture = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel', preventZoom, { passive: false })
    window.addEventListener('touchmove', preventGesture, { passive: false })

    return () => {
      window.removeEventListener('wheel', preventZoom)
      window.removeEventListener('touchmove', preventGesture)
    }
  }, [])
}
