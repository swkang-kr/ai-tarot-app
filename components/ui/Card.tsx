'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'outline'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'glass', children, ...props }, ref) => {
    const variants = {
      glass: 'bg-white/10 backdrop-blur-lg border border-white/20',
      solid: 'bg-white shadow-sm border border-gray-200',
      outline: 'bg-transparent border border-white/30'
    }

    return (
      <div
        ref={ref}
        className={`rounded-3xl p-6 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
