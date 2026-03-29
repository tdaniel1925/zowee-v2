import Link from 'next/link'
import { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  href?: string
  className?: string
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  href,
  className = '',
  ...props
}: ButtonProps & (ButtonHTMLAttributes<HTMLButtonElement> | AnchorHTMLAttributes<HTMLAnchorElement>)) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-small whitespace-nowrap'

  const variants = {
    primary:
      'bg-jordyn-green text-jordyn-dark hover:bg-jordyn-green-dark active:scale-95 shadow-lg shadow-jordyn-green-glow',
    secondary:
      'bg-jordyn-dark-3 text-jordyn-light hover:bg-jordyn-dark-4 border border-white/10',
    ghost: 'text-jordyn-light hover:bg-white/5',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  )
}
