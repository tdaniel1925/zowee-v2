interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'bordered'
}

export default function Card({ children, className = '', variant = 'default' }: CardProps) {
  const variants = {
    default: 'bg-jordyn-dark-2 border border-white/5',
    glass: 'bg-jordyn-dark-2/50 backdrop-blur-xl border border-white/10',
    bordered: 'bg-jordyn-dark-3 border border-jordyn-green/20',
  }

  return (
    <div className={`rounded-large p-6 ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}
