interface PlatformIconProps {
  platform: string
  size?: number
  className?: string
}

export function PlatformIcon({ platform, size = 14, className }: PlatformIconProps) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', className, xmlns: 'http://www.w3.org/2000/svg' }
  if (platform === 'instagram') {
    return (
      <svg {...props} fill="none">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
        <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" fill="none" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
        <defs>
          <linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
      </svg>
    )
  }
  if (platform === 'facebook') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path d="M15.12 7.8h-1.7c-.57 0-.68.27-.68.68v1.1h2.38l-.31 2.38h-2.07V19h-2.46v-7.04H8.88V9.58h1.4V8.36C10.28 6.4 11.42 5.4 13.2 5.4c.85 0 1.75.07 2.6.14L15.12 7.8z" fill="white" />
      </svg>
    )
  }
  if (platform === 'tiktok') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="12" fill="#010101" />
        <path d="M16.6 8.2a3.6 3.6 0 0 1-2.2-1.9V5.4h-1.9v8.7a1.7 1.7 0 0 1-1.7 1.5 1.7 1.7 0 0 1-1.7-1.7 1.7 1.7 0 0 1 1.7-1.7l.4.1V10a4 4 0 0 0-.4 0 3.7 3.7 0 0 0-3.7 3.7 3.7 3.7 0 0 0 7.4 0V9.1a5.5 5.5 0 0 0 2.7.8V8a3.7 3.7 0 0 1-.6-.1l.0 .3z" fill="white" />
      </svg>
    )
  }
  return null
}
