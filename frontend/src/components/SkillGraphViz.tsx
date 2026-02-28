import { useState, useEffect, useRef } from 'react'

/**
 * SkillGraphViz — Interactive SVG Skill Dependency Graph
 *
 * Layout:
 *   - "You" centre node (glowing blue)
 *   - Inner ring: detected skills (green)
 *   - Outer ring: missing skills  (red = core, orange = optional)
 *   - Dashed arrows: prerequisite relationships from skill-deps data
 *   - Hover tooltip shows skill name + status
 */

interface Node {
    id: string
    label: string
    type: 'center' | 'detected' | 'missing-core' | 'missing-optional'
    x: number
    y: number
    r: number
}

interface Edge {
    from: string
    to: string
    type: 'has' | 'needs'
}

const COLOR: Record<string, string> = {
    center: '#3b82f6',
    detected: '#22c55e',
    'missing-core': '#ef4444',
    'missing-optional': '#f59e0b',
}

const GLOW: Record<string, string> = {
    center: 'rgba(59,130,246,0.5)',
    detected: 'rgba(34,197,94,0.45)',
    'missing-core': 'rgba(239,68,68,0.45)',
    'missing-optional': 'rgba(245,158,11,0.4)',
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arrowHead(x1: number, y1: number, x2: number, y2: number, r: number) {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const ux = dx / len, uy = dy / len
    // Tip point: stop at node edge
    const tx = x2 - ux * r, ty = y2 - uy * r
    const px = -uy * 6, py = ux * 6
    return `M ${tx} ${ty} L ${tx - ux * 10 + px} ${ty - uy * 10 + py} L ${tx - ux * 10 - px} ${ty - uy * 10 - py} Z`
}

interface SkillGraphVizProps {
    detected: string[]
    missingCore: string[]
    missingOptional: string[]
    dependencies: Record<string, string[]>
}

export default function SkillGraphViz({
    detected,
    missingCore,
    missingOptional,
    dependencies,
}: SkillGraphVizProps) {
    const W = 640, H = 430
    const cx = W / 2, cy = H / 2

    const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; type: string } | null>(null)
    const [pulse, setPulse] = useState(true)
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        const t = setInterval(() => setPulse(p => !p), 1600)
        return () => clearInterval(t)
    }, [])

    // ── Build nodes ─────────────────────────────────────────────
    const nodes: Node[] = []

    // Centre
    nodes.push({ id: 'you', label: 'You', type: 'center', x: cx, y: cy, r: 28 })

    // Limit for readability
    const innerSkills = detected.slice(0, 10)
    const coreMissing = missingCore.slice(0, 6)
    const optMissing = missingOptional.slice(0, 5)

    // Inner ring (detected) — radius 145
    innerSkills.forEach((s, i) => {
        const { x, y } = polar(cx, cy, 145, (i / innerSkills.length) * 360)
        nodes.push({ id: s, label: s, type: 'detected', x, y, r: 17 })
    })

    // Middle ring (missing core) — radius 235
    coreMissing.forEach((s, i) => {
        const offset = innerSkills.length > 0 ? 10 : 0
        const { x, y } = polar(cx, cy, 235, offset + (i / Math.max(coreMissing.length, 1)) * 360)
        nodes.push({ id: s, label: s, type: 'missing-core', x, y, r: 14 })
    })

    // Outer ring (missing optional) — radius 310
    optMissing.forEach((s, i) => {
        const { x, y } = polar(cx, cy, 310, 20 + (i / Math.max(optMissing.length, 1)) * 360)
        nodes.push({ id: s, label: s, type: 'missing-optional', x, y, r: 12 })
    })

    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]))

    // ── Build edges ─────────────────────────────────────────────
    const edges: Edge[] = []
    const allSkillIds = new Set(nodes.map(n => n.id))

    // Detected → centre (you have these)
    innerSkills.forEach(s => edges.push({ from: 'you', to: s, type: 'has' }))

    // Dependencies: if both nodes exist draw a "needs" edge
    Object.entries(dependencies).forEach(([skill, prereqs]) => {
        if (!allSkillIds.has(skill)) return
        prereqs.forEach(p => {
            if (allSkillIds.has(p)) {
                edges.push({ from: p, to: skill, type: 'needs' })
            }
        })
    })

    // ── Render ──────────────────────────────────────────────────
    return (
        <div style={{ width: '100%', position: 'relative' }}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, background: 'transparent' }}
            >
                <defs>
                    {/* Glow filters */}
                    {Object.entries(GLOW).map(([key, color]) => (
                        <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feFlood floodColor={color} result="color" />
                            <feComposite in="color" in2="blur" operator="in" result="glow" />
                            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    ))}
                    {/* Arrow marker for "needs" edges */}
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                        <path d="M 0 0 L 8 4 L 0 8 Z" fill="rgba(245,158,11,0.6)" />
                    </marker>
                </defs>

                {/* Background subtle grid */}
                {[130, 145, 200, 235, 270, 310].map(r => (
                    <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                ))}

                {/* ── Edges ── */}
                {edges.map((e, i) => {
                    const a = nodeMap.get(e.from), b = nodeMap.get(e.to)
                    if (!a || !b) return null
                    const isHas = e.type === 'has'
                    return (
                        <g key={i}>
                            <line
                                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                stroke={isHas ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.35)'}
                                strokeWidth={isHas ? 1.5 : 1.2}
                                strokeDasharray={isHas ? '' : '5 3'}
                            />
                            {!isHas && (
                                <path
                                    d={arrowHead(a.x, a.y, b.x, b.y, b.r)}
                                    fill="rgba(245,158,11,0.6)"
                                />
                            )}
                        </g>
                    )
                })}

                {/* ── Nodes ── */}
                {nodes.map(n => {
                    const col = COLOR[n.type]
                    const isYou = n.type === 'center'
                    const pulseR = isYou ? n.r + (pulse ? 10 : 5) : n.r
                    return (
                        <g
                            key={n.id}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setTooltip({ x: n.x, y: n.y, label: n.label, type: n.type })}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {/* Pulse ring for centre */}
                            {isYou && (
                                <circle
                                    cx={n.x} cy={n.y}
                                    r={pulseR}
                                    fill="none"
                                    stroke={`${col}40`}
                                    strokeWidth="2"
                                    style={{ transition: 'r 1.6s ease' }}
                                />
                            )}
                            {/* Glow halo */}
                            <circle
                                cx={n.x} cy={n.y}
                                r={n.r + 5}
                                fill={`${col}18`}
                                filter={`url(#glow-${n.type})`}
                            />
                            {/* Node body */}
                            <circle
                                cx={n.x} cy={n.y}
                                r={n.r}
                                fill={isYou ? '#1e3a5f' : `${col}20`}
                                stroke={col}
                                strokeWidth={isYou ? 2.5 : 1.8}
                            />
                            {/* Label (show on hover or for large nodes) */}
                            {(isYou || n.r >= 17) && (
                                <text
                                    x={n.x} y={n.y + 4}
                                    textAnchor="middle"
                                    fontSize={isYou ? 10 : 8}
                                    fontWeight="700"
                                    fill={col}
                                >
                                    {isYou ? 'YOU' : n.label.length > 8 ? n.label.slice(0, 7) + '…' : n.label}
                                </text>
                            )}
                        </g>
                    )
                })}

                {/* ── Tooltip ── */}
                {tooltip && (() => {
                    const label = tooltip.type === 'center' ? '📍 Your Profile' :
                        tooltip.type === 'detected' ? `✅ You have: ${tooltip.label}` :
                            tooltip.type === 'missing-core' ? `🔴 Critical gap: ${tooltip.label}` :
                                `🟡 Optional: ${tooltip.label}`
                    return (
                        <g>
                            <rect
                                x={tooltip.x - 90} y={tooltip.y - 40}
                                width={180} height={28}
                                rx={6} fill="#0d1117" stroke="rgba(255,255,255,0.15)" strokeWidth="1"
                            />
                            <text x={tooltip.x} y={tooltip.y - 22} textAnchor="middle" fontSize={11} fill="#e2e8f0">
                                {label}
                            </text>
                        </g>
                    )
                })()}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, justifyContent: 'center' }}>
                {[
                    { color: '#22c55e', label: 'Skills You Have' },
                    { color: '#ef4444', label: 'Critical Missing' },
                    { color: '#f59e0b', label: 'Optional Missing' },
                ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                        {label}
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                    <div style={{ width: 20, height: 1.5, background: 'rgba(245,158,11,0.5)', borderTop: '2px dashed rgba(245,158,11,0.5)' }} />
                    Prerequisite chain
                </div>
            </div>
        </div>
    )
}
