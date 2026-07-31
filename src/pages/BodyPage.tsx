import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useBodyMeasurements, useUpsertMeasurement, useProfile } from '../hooks/useApi'
import type { BodyMeasurement } from '../hooks/useApi'

export function BodyPage() {
  const { data: measurements } = useBodyMeasurements()
  const { data: profile } = useProfile()
  const upsert = useUpsertMeasurement()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    weight_kg: '',
    body_fat_pct: '',
    muscle_mass_kg: '',
    visceral_fat_level: '',
  })

  const latest = measurements?.[0]
  const prev = measurements?.[1]

  const delta = (field: keyof BodyMeasurement) => {
    const a = latest?.[field] as number | null
    const b = prev?.[field] as number | null
    if (a == null || b == null) return null
    return (a - b).toFixed(1)
  }

  const heightM = profile?.height_cm ? profile.height_cm / 100 : null
  const bmi = latest?.weight_kg && heightM
    ? (latest.weight_kg / (heightM * heightM)).toFixed(1)
    : null

  const chartData = (measurements ?? []).slice(0, 8).reverse()
  const hasChart = chartData.length > 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    const body: Record<string, unknown> = { recorded_on: today }
    if (form.weight_kg) body.weight_kg = parseFloat(form.weight_kg)
    if (form.body_fat_pct) body.body_fat_pct = parseFloat(form.body_fat_pct)
    if (form.muscle_mass_kg) body.muscle_mass_kg = parseFloat(form.muscle_mass_kg)
    if (form.visceral_fat_level) body.visceral_fat_level = parseInt(form.visceral_fat_level)
    await upsert.mutateAsync(body as any)
    setShowForm(false)
    setForm({ weight_kg: '', body_fat_pct: '', muscle_mass_kg: '', visceral_fat_level: '' })
  }

  const weightDelta = delta('weight_kg')
  const mmeDelta = delta('muscle_mass_kg')
  const pgcDelta = delta('body_fat_pct')

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-4 pb-3">
        <h1 className="text-[26px] font-bold tracking-wide">Cuerpo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-bg font-bold text-[13px] px-3.5 py-2 flex items-center gap-1"
        >
          <Plus size={14} />
          Registrar
        </button>
      </div>

      {/* Current stats — 3-column grid */}
      {latest && (
        <div className="mx-5 bg-surface rounded-xl p-4 border border-border">
          {measurements && measurements.length <= 1 ? (
            <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em] block mb-3">
              Tu punto de partida · {new Date(latest.recorded_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            <StatCell
              label="Peso"
              value={latest.weight_kg}
              unit="kg"
              delta={weightDelta}
            />
            <StatCell
              label="MME"
              value={latest.muscle_mass_kg}
              unit="kg"
              delta={mmeDelta}
              deltaInverted
            />
            <StatCell
              label="PGC"
              value={latest.body_fat_pct}
              unit="%"
              delta={pgcDelta}
            />
          </div>
          <p className="text-[11px] text-text-secondary mt-3">
            {measurements && measurements.length <= 1
              ? `Datos de tu onboarding${bmi ? ` · IMC ${bmi}` : ''}${latest.visceral_fat_level ? ` · grasa visceral ${latest.visceral_fat_level}` : ''}`
              : `Últ. registro: ${new Date(latest.recorded_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}${bmi ? ` · IMC: ${bmi}` : ''}${latest.visceral_fat_level ? ` · Grasa visceral: ${latest.visceral_fat_level}` : ''}`
            }
          </p>
        </div>
      )}

      {/* Evolution chart or single-point placeholder */}
      {hasChart ? (
        <div className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em]">
              Evolución
            </span>
            <div className="flex gap-4">
              <Legend color="bg-accent" label="Peso" />
              <Legend color="bg-green" label="MME" />
              <Legend color="bg-text-secondary" label="PGC" dashed />
            </div>
          </div>
          <EvolutionChart data={chartData} />
        </div>
      ) : latest ? (
        <div className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border text-center">
          {/* Single dot with dashed line placeholder */}
          <svg width="240" height="60" viewBox="0 0 240 60" className="mx-auto mb-3">
            <circle cx="30" cy="30" r="5" fill="#5b8fff" />
            <line x1="35" y1="30" x2="220" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" className="text-text-secondary opacity-30" />
          </svg>
          <h3 className="text-[15px] font-bold mb-1">Un punto todavía no es una línea</h3>
          <p className="text-text-secondary text-[12px] max-w-[280px] mx-auto">
            Registra tu próximo InBody o pésate en 2 semanas y aquí aparecerá tu evolución de peso, MME y PGC.
          </p>
        </div>
      ) : null}

      {/* Measurements table */}
      {measurements && measurements.length > 0 && (
        <div className="mx-5 mt-4">
          <span className="text-[11px] text-text-secondary font-medium uppercase tracking-[0.08em] block mb-2 px-1">
            Mediciones
          </span>
          <div className="bg-surface rounded-xl p-4 border border-border overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">
                  <th className="text-left pb-2 font-medium">Fecha</th>
                  <th className="text-right pb-2 font-medium">Peso</th>
                  <th className="text-right pb-2 font-medium">MME</th>
                  <th className="text-right pb-2 font-medium">PGC</th>
                </tr>
              </thead>
              <tbody>
                {measurements.slice(0, 10).map((m, i) => (
                  <tr key={m.id} className="border-t border-border/50">
                    <td className="py-2 text-text-secondary">
                      {new Date(m.recorded_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      {i === 0 && measurements.length <= 1 && (
                        <span className="ml-2 text-[11px] px-2 py-0.5 bg-accent-dim text-accent font-medium">
                          Inicio
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right font-medium">{m.weight_kg ?? '—'}</td>
                    <td className="py-2 text-right font-medium">{m.muscle_mass_kg ?? '—'}</td>
                    <td className="py-2 text-right font-medium">{m.body_fat_pct ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full bg-surface rounded-t-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Nuevo registro</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-text-secondary text-sm">
                Cancelar
              </button>
            </div>
            <Field label="Peso (kg)" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />
            <Field label="PGC — Grasa corporal (%)" value={form.body_fat_pct} onChange={(v) => setForm({ ...form, body_fat_pct: v })} />
            <Field label="MME — Masa muscular (kg)" value={form.muscle_mass_kg} onChange={(v) => setForm({ ...form, muscle_mass_kg: v })} />
            <Field label="Grasa visceral (nivel 1-20)" value={form.visceral_fat_level} onChange={(v) => setForm({ ...form, visceral_fat_level: v })} />
            <button
              type="submit"
              disabled={upsert.isPending}
              className="w-full bg-accent text-bg font-bold py-3 rounded-xl text-sm mt-2 disabled:opacity-50"
            >
              {upsert.isPending ? 'Guardando...' : 'Guardar registro'}
            </button>
          </form>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}

function StatCell({
  label,
  value,
  unit,
  delta,
  deltaInverted,
}: {
  label: string
  value: number | null
  unit: string
  delta: string | null
  deltaInverted?: boolean
}) {
  const isPositive = delta ? parseFloat(delta) > 0 : false
  const showGreen = deltaInverted ? isPositive : !isPositive
  return (
    <div>
      <span className="text-[11px] uppercase tracking-[0.06em] text-text-secondary block mb-1">
        {label}
      </span>
      <span className="text-[22px] font-bold">
        {value ?? '—'}
      </span>
      {value != null && (
        <span className="text-[12px] text-text-secondary ml-1">{unit}</span>
      )}
      {delta && parseFloat(delta) !== 0 && (
        <span className={`text-[11px] block font-medium ${showGreen ? 'text-green' : 'text-orange'}`}>
          {parseFloat(delta) > 0 ? '+' : ''}{delta} {unit}
        </span>
      )}
    </div>
  )
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-[2px] ${color} ${dashed ? 'opacity-50' : ''}`}
        style={dashed ? { background: 'repeating-linear-gradient(to right, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)' } : undefined}
      />
      <span className="text-[10px] text-text-secondary">{label}</span>
    </div>
  )
}

function EvolutionChart({ data }: { data: BodyMeasurement[] }) {
  const w = 300
  const h = 120
  const pad = { top: 10, right: 10, bottom: 5, left: 10 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  const weights = data.map((d) => d.weight_kg).filter((v): v is number => v != null)
  const mmes = data.map((d) => d.muscle_mass_kg).filter((v): v is number => v != null)
  const pgcs = data.map((d) => d.body_fat_pct).filter((v): v is number => v != null)

  const allValues = [...weights, ...mmes, ...pgcs]
  if (allValues.length < 2) return null

  const minV = Math.min(...allValues) * 0.95
  const maxV = Math.max(...allValues) * 1.05
  const range = maxV - minV || 1

  const x = (i: number) => pad.left + (i / (data.length - 1)) * cw
  const y = (v: number) => pad.top + ch - ((v - minV) / range) * ch

  const makeLine = (values: (number | null)[]) => {
    const points: string[] = []
    values.forEach((v, i) => {
      if (v != null) points.push(`${x(i)},${y(v)}`)
    })
    return points.join(' ')
  }

  return (
    <svg className="w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {weights.length > 1 && (
        <>
          <polyline points={makeLine(data.map((d) => d.weight_kg))} fill="none" stroke="#c6f135" strokeWidth="2" />
          {data.map((d, i) => d.weight_kg != null && (
            <circle key={`w${i}`} cx={x(i)} cy={y(d.weight_kg)} r="3" fill="#c6f135" />
          ))}
        </>
      )}
      {mmes.length > 1 && (
        <>
          <polyline points={makeLine(data.map((d) => d.muscle_mass_kg))} fill="none" stroke="#34d399" strokeWidth="2" />
          {data.map((d, i) => d.muscle_mass_kg != null && (
            <circle key={`m${i}`} cx={x(i)} cy={y(d.muscle_mass_kg)} r="3" fill="#34d399" />
          ))}
        </>
      )}
      {pgcs.length > 1 && (
        <>
          <polyline points={makeLine(data.map((d) => d.body_fat_pct))} fill="none" stroke="#7a7f9a" strokeWidth="2" strokeDasharray="4 3" />
          {data.map((d, i) => d.body_fat_pct != null && (
            <circle key={`p${i}`} cx={x(i)} cy={y(d.body_fat_pct)} r="3" fill="#7a7f9a" />
          ))}
        </>
      )}
    </svg>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[12px] text-text-secondary mb-1 block">{label}</label>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
      />
    </div>
  )
}
