/** Reusable circular SVG progress indicator */
interface Props {
    pct: number        // 0–100
    size?: number      // px
    stroke?: number    // px
    color?: string
    label?: string
}

export default function CircularProgress({ pct, size = 120, stroke = 10, color = '#3b82f6', label }: Props) {
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const offset = c - (pct / 100) * c

    return (
        <div className="circular-progress" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={stroke}
                />
                {/* Fill */}
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            {/* Centre label */}
            <div style={{
                position: 'absolute',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: size * 0.22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px' }}>
                    {pct}%
                </span>
                {label && <span style={{ fontSize: size * 0.09, color: '#8892a4', marginTop: 2 }}>{label}</span>}
            </div>
        </div>
    )
}
