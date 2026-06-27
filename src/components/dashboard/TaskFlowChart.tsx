interface TaskFlowChartProps {
  created: number[]
  completed: number[]
  labels: string[]
}

const W = 640
const H = 220
const PAD_L = 36
const PAD_R = 12
const PAD_T = 24
const PAD_B = 28

function scaleX(i: number, n: number) {
  return PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(n - 1, 1)
}
function scaleY(v: number, max: number) {
  return PAD_T + (1 - v / max) * (H - PAD_T - PAD_B)
}

// Catmull-Rom -> cubic bezier smoothing for a nice flowing line.
function smoothPath(pts: Array<readonly [number, number]>) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

/**
 * iBanKo "Money Flow"-style chart adapted to task data:
 * a solid (created) and dotted (completed) smooth series with a peak bubble.
 * Presentational SVG — server-renderable, scales responsively via viewBox.
 */
export function TaskFlowChart({ created, completed, labels }: TaskFlowChartProps) {
  const n = Math.max(created.length, 1)
  const max = Math.max(...created, ...completed, 1)

  const createdPts = created.map((v, i) => [scaleX(i, n), scaleY(v, max)] as const)
  const completedPts = completed.map((v, i) => [scaleX(i, n), scaleY(v, max)] as const)

  const createdLine = smoothPath(createdPts)
  const completedLine = smoothPath(completedPts)
  const createdArea = `${createdLine} L${scaleX(n - 1, n).toFixed(1)} ${H - PAD_B} L${PAD_L} ${H - PAD_B} Z`

  // Peak of the created series -> floating value bubble (iBanKo touch).
  let peakIdx = 0
  created.forEach((v, i) => { if (v > created[peakIdx]) peakIdx = i })
  const peak = createdPts[peakIdx]
  const peakVal = created[peakIdx] ?? 0

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }} role="img"
      aria-label="Task flow: created versus completed over the last 7 days">
      <defs>
        <linearGradient id="taskflow-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid + y labels */}
      {gridLines.map((g, i) => {
        const y = PAD_T + g * (H - PAD_T - PAD_B)
        const val = Math.round(max * (1 - g))
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD_L - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10 }}>
              {val}
            </text>
          </g>
        )
      })}

      {/* x labels */}
      {labels.map((lab, i) => (
        <text key={i} x={scaleX(i, n)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
          {lab.slice(0, 2)}
        </text>
      ))}

      {/* Created: filled smooth area + solid line */}
      <path d={createdArea} fill="url(#taskflow-area)" />
      <path d={createdLine} fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Completed: dotted line */}
      <path d={completedLine} fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Peak marker + bubble */}
      {peakVal > 0 && (
        <g>
          <circle cx={peak[0]} cy={peak[1]} r="4" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.5" />
          <g transform={`translate(${Math.min(Math.max(peak[0], PAD_L + 26), W - PAD_R - 26)}, ${Math.max(peak[1] - 28, 14)})`}>
            <rect x="-26" y="-13" width="52" height="22" rx="11" fill="var(--foreground)" />
            <text x="0" y="2" textAnchor="middle" className="fill-background" style={{ fontSize: 11, fontWeight: 600 }}>
              {peakVal} new
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
