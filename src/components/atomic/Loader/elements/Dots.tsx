import React from 'react'
import { cva } from 'class-variance-authority'

interface IDots {
  numDots?: number
  size?: 'small' | 'medium' | 'large'
}

export const Dots: React.FC<IDots> = ({numDots = 5, size = 'medium' }) => {
  const wrapper = cva('flex', {
    variants: {
      size: {
        small: 'space-x-1',
        medium: 'space-x-3',
        large: 'space-x-5',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  })
  const dotSize = cva('rounded-full animate-bounce bg-primary', {
    variants: {
      size: {
        small: 'w-2 h-2',
        medium: 'w-4 h-4',
        large: 'w-6 h-6',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  })
  return (
    <div className={wrapper({ size })}>
      {[...Array(numDots).keys()]
        .map((i) => i + 1)
        .map((i) => {
          const delay = `${i * 100}ms`
          return (
            <div
              key={i}
              className={dotSize({ size })}
              style={{ animationDelay: delay }}
            ></div>
          )
        })}
    </div>
  )
}
