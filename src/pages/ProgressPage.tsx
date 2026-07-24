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
  const maxWeight = Math.max(...chartData.map((d) => d.weight_kg), 0)
  const minWeight = Math.min(...chartData.map((d) => d.weight_kg), 0)
  const range = maxWeight - minWeight || 1

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} className="text-text" />
        </button>
        <span className="text-[13px] text-text-secondary font-medium">Progreso</span>
      </div>

      <div className="px-6 pb-4">
        <h1 className="text-2xl font-bold">Progreso</h1>
      </div>

      {/* PR badge */}
      {data?.personal_record && (
        <div className="mx-5 mb-4 flex gap-3">
          <div className="flex-1 bg-surface rounded-xl p-4 border border-accent-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy size={14} className="text-accent" />
              <span className="text-[11px] text-accent font-semibold">Récord personal</span>
            </div>
            <p className="text-2xl font-bold">{data.personal_record.weight_kg} kg</p>
            <p className="text-[11px] text-text-secondary">
              {new Date(data.personal_record.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-blue" />
              <span className="text-[11px] text-text-secondary font-medium">Sesiones</span>
            </div>
            <p className="text-2xl font-bold">{chartData.length}</p>
            <p className="text-[11px] text-text-secondary">en el periodo</p>
          </div>
        </div>
      )}

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
      <div className="mx-5 bg-surface rounded-xl p-4 border border-border">
        <p className="text-[11px] text-text-secondary font-medium mb-3">
          Peso máximo (kg) · {chartData.length} sesiones
        </p>
        {isLoading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[180px] relative">
            {/* Y axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-text-secondary w-8">
              <span>{Math.round(maxWeight)}</span>
              <span>{Math.round((maxWeight + minWeight) / 2)}</span>
              <span>{Math.round(minWeight)}</span>
            </div>
            {/* Chart area */}
            <svg className="ml-10 w-[calc(100%-40px)] h-full" viewBox={`0 0 ${chartData.length * 40} 180`} preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 60, 120, 180].map((y) => (
                <line key={y} x1="0" y1={y} x2={chartData.length * 40} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              ))}
              {/* Area fill */}
              <path
                d={`M0,180 ${chartData.map((d, i) => `L${i * 40 + 20},${180 - ((d.weight_kg - minWeight) / range) * 160}`).join(' ')} L${(chartData.length - 1) * 40 + 20},180 Z`}
                fill="rgba(198,241,53,0.1)"
              />
              {/* Line */}
              <polyline
                points={chartData.map((d, i) => `${i * 40 + 20},${180 - ((d.weight_kg - minWeight) / range) * 160}`).join(' ')}
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
                  cx={i * 40 + 20}
                  cy={180 - ((d.weight_kg - minWeight) / range) * 160}
                  r="4"
                  fill="#c6f135"
                />
              ))}
            </svg>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-text-secondary text-sm">
            Sin datos para este periodo
          </div>
        )}
      </div>
    </div>
  )
}
