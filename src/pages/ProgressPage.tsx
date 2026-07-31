import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, Trophy, TrendingUp } from 'lucide-react'
import { useExerciseProgress } from '../hooks/useApi'

const PERIODS = ['1M', '3M', '6M', '1A', 'Todo'] as const
const PERIOD_MAP: Record<string, string> = { '1M': '1m', '3M': '3m', '6M': '6m', '1A': '1y', 'Todo': 'all' }

export function ProgressPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<string>('3M')
  const { data, isLoading } = useExerciseProgress(exerciseId!, PERIOD_MAP[period])

  const chartData = data?.chart_data ?? []
  const rawMax = chartData.length > 0 ? Math.max(...chartData.map((d) => d.weight_kg)) : 0
  const rawMin = chartData.length > 0 ? Math.min(...chartData.map((d) => d.weight_kg)) : 0
  const padding = rawMax === rawMin ? Math.max(rawMax * 0.2, 5) : (rawMax - rawMin) * 0.15
  const maxWeight = rawMax + padding
  const minWeight = Math.max(rawMin - padding, 0)
  const range = maxWeight - minWeight || 1
  const chartW = Math.max(chartData.length * 60, 280)

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-0.5 -ml-1">
            <ChevronLeft size={22} className="text-text-secondary" />
          </button>
          <span className="text-[12px] text-text-secondary font-medium">Progreso</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-wide">
          {data?.exercise_name ?? 'Cargando...'}
        </h1>
      </div>

      {/* Stats cards */}
      <div className="flex gap-3 mx-5 mb-4">
        <div className="flex-1 bg-surface rounded-xl p-3.5 border border-accent-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy size={13} className="text-accent" />
            <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">Récord personal</span>
          </div>
          {data?.personal_record ? (
            <>
              <p className="text-[22px] font-bold leading-tight">
                {data.personal_record.weight_kg} <span className="text-[13px] font-semibold text-text-secondary">kg</span>
              </p>
              <p className="text-[10px] text-text-secondary mt-0.5">
                {new Date(data.personal_record.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </>
          ) : (
            <p className="text-[14px] text-text-secondary mt-1">Sin datos</p>
          )}
        </div>
        <div className="flex-1 bg-surface rounded-xl p-3.5 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={13} className="text-accent" />
            <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Vol. este mes</span>
          </div>
          {data?.volume_change_pct !== undefined && data?.volume_change_pct !== null ? (
            <>
              <p className={`text-[22px] font-bold leading-tight ${data.volume_change_pct >= 0 ? 'text-green' : 'text-red'}`}>
                {data.volume_change_pct >= 0 ? '+' : ''}{data.volume_change_pct}%
              </p>
              <p className="text-[10px] text-text-secondary mt-0.5">vs. mes anterior</p>
            </>
          ) : (
            <>
              <p className="text-[22px] font-bold leading-tight">{formatVol(data?.volume_this_month ?? 0)}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">kg volumen</p>
            </>
          )}
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 mx-5 mb-4 bg-surface-alt rounded-lg p-1 border border-border">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 text-center py-1.5 text-[12px] font-semibold rounded-md transition-colors ${
              period === p ? 'bg-accent text-bg' : 'text-text-secondary'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mx-5 mb-4 bg-surface rounded-xl p-4 border border-border">
        <div className="flex justify-between items-baseline mb-3">
          <p className="text-[11px] text-text-secondary font-medium">
            Peso máximo (kg)
          </p>
          <p className="text-[11px] text-text-secondary">
            {chartData.length} sesiones
          </p>
        </div>
        {isLoading ? (
          <div className="h-[160px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[160px] relative">
            {/* Y axis */}
            <div className="absolute left-0 top-0 bottom-[20px] flex flex-col justify-between text-[10px] text-text-secondary w-7">
              <span>{Math.round(maxWeight)}</span>
              <span>{Math.round((maxWeight + minWeight) / 2)}</span>
              <span>{Math.round(minWeight)}</span>
            </div>
            {/* Chart area with horizontal scroll */}
            <div className="ml-8 overflow-x-auto h-full">
              <svg width={chartW} height="160" className="block">
                {/* Grid lines */}
                {[0, 53, 106].map((y) => (
                  <line key={y} x1="0" y1={y} x2={chartW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                ))}
                {/* Area fill */}
                {chartData.length > 1 && (
                  <path
                    d={`M${getX(0, chartData.length, chartW)},140 ${chartData.map((d, i) =>
                      `L${getX(i, chartData.length, chartW)},${getY(d.weight_kg, minWeight, range)}`
                    ).join(' ')} L${getX(chartData.length - 1, chartData.length, chartW)},140 Z`}
                    fill="rgba(198,241,53,0.08)"
                  />
                )}
                {/* Line */}
                <polyline
                  points={chartData.map((d, i) =>
                    `${getX(i, chartData.length, chartW)},${getY(d.weight_kg, minWeight, range)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#c6f135"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots */}
                {chartData.map((d, i) => (
                  <circle
                    key={i}
                    cx={getX(i, chartData.length, chartW)}
                    cy={getY(d.weight_kg, minWeight, range)}
                    r={chartData.length === 1 ? 6 : 4}
                    fill="#c6f135"
                  />
                ))}
                {/* Weight label for single point */}
                {chartData.length === 1 && (
                  <text
                    x={getX(0, 1, chartW)}
                    y={getY(chartData[0].weight_kg, minWeight, range) - 14}
                    textAnchor="middle"
                    className="fill-accent"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {chartData[0].weight_kg} kg
                  </text>
                )}
                {/* X labels */}
                {chartData.map((d, i) => {
                  const showLabel = chartData.length <= 8 || i === 0 || i === chartData.length - 1 || i % Math.ceil(chartData.length / 5) === 0
                  if (!showLabel) return null
                  return (
                    <text
                      key={`label-${i}`}
                      x={getX(i, chartData.length, chartW)}
                      y={156}
                      textAnchor="middle"
                      className="fill-text-secondary"
                      fontSize="9"
                    >
                      {new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')}
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>
        ) : (
          <div className="h-[160px] flex items-center justify-center text-text-secondary text-sm">
            Sin datos para este periodo
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {data?.recent_sessions && data.recent_sessions.length > 0 && (
        <div className="mx-5 mb-6">
          <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mb-3">
            Sesiones recientes
          </p>
          <div className="flex flex-col gap-3">
            {data.recent_sessions.map((sess) => (
              <div key={sess.session_id} className="bg-surface rounded-xl p-3.5 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[13px] font-semibold">
                    {new Date(sess.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {sess.has_pr && (
                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
                      Nuevo PR ↑
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sess.sets.map((set, i) => (
                    <span
                      key={i}
                      className={`text-[11px] px-2 py-1 rounded-md font-medium ${
                        set.is_pr
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-surface-alt text-text-secondary border border-border'
                      }`}
                    >
                      {set.reps}×{set.weight_kg}kg
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-text-secondary">
                  Vol: {formatVol(sess.total_volume)} kg
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getX(i: number, total: number, width: number): number {
  if (total <= 1) return width / 2
  const pad = 20
  return pad + (i / (total - 1)) * (width - pad * 2)
}

function getY(weight: number, minWeight: number, range: number): number {
  return 130 - ((weight - minWeight) / range) * 120 + 5
}

function formatVol(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.0', '')}k`
  return String(Math.round(kg))
}
