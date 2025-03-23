// hooks/useImagePreloader.ts
import { useState, useEffect } from 'react'

export function useImagePreloader(imageUrl: string | undefined) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      setIsLoaded(false)
      return
    }

    setIsLoaded(false)
    setError(null)

    const img = new Image()

    img.onload = () => {
      setIsLoaded(true)
    }

    img.onerror = (e) => {
      setError(e as unknown as Error)
    }

    img.src = imageUrl

    // Cleanup function
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageUrl])

  return { isLoaded, error }
}
