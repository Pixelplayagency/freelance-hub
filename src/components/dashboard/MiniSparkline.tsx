interface MiniSparklineProps {
  data: number[]
  stroke?: string
  fill?: string
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
}

/**
 * Lightweight inline SVG sparkline — no dependencies, server-renderable.
 * Normalizes `data` to the given box; optionally fills the area underneath.
 */
export function MiniSparkline({
  data,
  stroke = 'currentColor',
  fill,
  width = 88,
  height = 30,
  strokeWidth = 1.75,
  className,
}: MiniSparklineProps) {
  const series = data && data.length > 1 ? data : [0, 0]
  const max = Math.max(...series)
  const min = Math.min(...series)
  const range = max - min || 1
  const pad = strokeWidth + 1
  const stepX = width / (series.length - 1)

  const points = series.map((v, i) => {
    const x = i * stepX
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return [x, y] as const
  })

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')
  const area = `${line} L${width} ${height} L0 ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {fill && <path d={area} fill={fill} />}
      <path
        d={line}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
