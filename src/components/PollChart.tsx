import { chartColor } from '../data/chartColors'
import type { ChartType } from '../types'
import type { PollCounts } from '../hooks/useMorningPoll'

interface PollChartProps {
  chartType: ChartType
  counts: PollCounts[]
  totalResponses: number
  compact?: boolean
  fill?: boolean
}

function chartClass(base: string, { compact, fill }: { compact: boolean; fill: boolean }) {
  return [base, compact && 'poll-chart--compact', fill && 'poll-chart--fill'].filter(Boolean).join(' ')
}

export function PollChart({
  chartType,
  counts,
  totalResponses,
  compact = false,
  fill = false,
}: PollChartProps) {
  const mode = { compact, fill }

  if (totalResponses === 0) {
    return (
      <div className={chartClass('poll-chart poll-chart--empty', mode)}>
        <p className="poll-chart__empty-text">Responses appear as students answer</p>
      </div>
    )
  }

  if (chartType === 'pie') {
    return <PieChart counts={counts} totalResponses={totalResponses} mode={mode} />
  }

  return <BarChart counts={counts} totalResponses={totalResponses} mode={mode} />
}

function BarChart({
  counts,
  totalResponses,
  mode,
}: {
  counts: PollCounts[]
  totalResponses: number
  mode: { compact: boolean; fill: boolean }
}) {
  const maxCount = Math.max(...counts.map((c) => c.count), 1)

  if (mode.fill) {
    return (
      <div
        className={chartClass('poll-chart poll-chart--bar poll-chart--vbar', mode)}
        role="img"
        aria-label="Bar chart"
      >
        <ul className="poll-chart__vbars">
          {counts.map((item, index) => (
            <li key={item.optionId} className="poll-chart__vbar-col">
              <span className="poll-chart__vbar-value">{item.count}</span>
              <div className="poll-chart__vbar-track">
                <div
                  className="poll-chart__vbar-fill"
                  style={{
                    height: `${(item.count / maxCount) * 100}%`,
                    background: chartColor(index),
                  }}
                />
              </div>
              <span className="poll-chart__vbar-label" title={item.label}>
                {item.label}
              </span>
              <span className="poll-chart__vbar-pct">{item.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={chartClass('poll-chart poll-chart--bar', mode)} role="img" aria-label="Bar chart">
      <ul className="poll-chart__bars">
        {counts.map((item, index) => (
          <li key={item.optionId} className="poll-chart__bar-row">
            <span className="poll-chart__bar-label" title={item.label}>
              {item.label}
            </span>
            <div className="poll-chart__bar-track">
              <div
                className="poll-chart__bar-fill"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  background: chartColor(index),
                }}
              >
                <span className="poll-chart__bar-value">
                  {item.count}
                  <span className="poll-chart__bar-pct"> ({item.percentage}%)</span>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="poll-chart__total">{totalResponses} responses</p>
    </div>
  )
}

function PieChart({
  counts,
  totalResponses,
  mode,
}: {
  counts: PollCounts[]
  totalResponses: number
  mode: { compact: boolean; fill: boolean }
}) {
  const size = mode.fill ? 260 : mode.compact ? 120 : 220
  const radius = mode.fill ? 104 : mode.compact ? 48 : 90
  const cx = size / 2
  const cy = size / 2
  let cumulative = 0

  const slices = counts
    .filter((c) => c.count > 0)
    .map((item) => {
      const startAngle = (cumulative / totalResponses) * 2 * Math.PI - Math.PI / 2
      cumulative += item.count
      const endAngle = (cumulative / totalResponses) * 2 * Math.PI - Math.PI / 2
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)

      const path =
        item.count === totalResponses
          ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

      const originalIndex = counts.findIndex((c) => c.optionId === item.optionId)
      return { ...item, path, color: chartColor(originalIndex) }
    })

  const holeR = mode.fill ? 46 : mode.compact ? 22 : 42

  return (
    <div className={chartClass('poll-chart poll-chart--pie', mode)} role="img" aria-label="Pie chart">
      <svg className="poll-chart__pie-svg" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {slices.map((slice) => (
          <path key={slice.optionId} d={slice.path} fill={slice.color} className="poll-chart__pie-slice" />
        ))}
        <circle cx={cx} cy={cy} r={holeR} className="poll-chart__pie-hole" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="poll-chart__pie-center-num">
          {totalResponses}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="poll-chart__pie-center-label">
          answers
        </text>
      </svg>
      {mode.fill && (
        <ul className="poll-chart__legend poll-chart__legend--inline">
          {counts.map((item, index) => (
            <li key={item.optionId} className="poll-chart__legend-item">
              <span className="poll-chart__legend-swatch" style={{ background: chartColor(index) }} />
              <span className="poll-chart__legend-label">{item.label}</span>
              <span className="poll-chart__legend-count">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
      {!mode.fill && !mode.compact && (
        <ul className="poll-chart__legend">
          {counts.map((item, index) => (
            <li key={item.optionId} className="poll-chart__legend-item">
              <span className="poll-chart__legend-swatch" style={{ background: chartColor(index) }} />
              <span className="poll-chart__legend-label">{item.label}</span>
              <span className="poll-chart__legend-count">
                {item.count} ({item.percentage}%)
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
