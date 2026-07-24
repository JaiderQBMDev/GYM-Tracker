import { useState } from 'react'
import { Scale, Plus } from 'lucide-react'
import { useBodyMeasurements, useUpsertMeasurement, useProfile } from '../hooks/useApi'

export function BodyPage() {
  const { data: measurements } = useBodyMeasurements()
  const { data: profile } = useProfile()
  const upsert = useUpsertMeasurement()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    weight_kg: '',
    chest_cm: '',
    waist_cm: '',
    bicep_cm: '',
    thigh_cm: '',
    notes: '',
  })

  const latest = measurements?.[0]
  const prev = measurements?.[1]
  const weightDiff = latest?.weight_kg && prev?.weight_kg
    ? (latest.weight_kg - prev.weight_kg).toFixed(1)
    : null

  const heightM = profile?.height_cm ? profile.height_cm / 100 : null
  const bmi = latest?.weight_kg && heightM
    ? (latest.weight_kg / (heightM * heightM)).toFixed(1)
    : null

  const chartData = (measurements ?? [])
    .filter((m) => m.weight_kg != null)
    .slice(0, 8)
    .reverse()

  const maxW = Math.max(...chartData.map((d) => d.weight_kg!), 0)
  const minW = Math.min(...chartData.map((d) => d.weight_kg!), 0)
  const rangeW = maxW - minW || 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    const body: Record<string, unknown> = { recorded_on: today }
    if (form.weight_kg) body.weight_kg = parseFloat(form.weight_kg)
    if (form.chest_cm) body.chest_cm = parseFloat(form.chest_cm)
    if (form.waist_cm) body.waist_cm = parseFloat(form.waist_cm)
    if (form.bicep_cm) body.bicep_cm = parseFloat(form.bicep_cm)
    if (form.thigh_cm) body.thigh_cm = parseFloat(form.thigh_cm)
    if (form.notes) body.notes = form.notes
    await upsert.mutateAsync(body as any)
    setShowForm(false)
    setForm({ weight_kg: '', chest_cm: '', waist_cm: '', bicep_cm: '', thigh_cm: '', notes: '' })
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-4 pb-3">
        <h1 className="text-2xl font-bold">Cuerpo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-bg font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-1"
        >
          <Plus size={14} />
          Registrar
        </button>
      </div>

      {/* Weight hero */}
      {latest?.weight_kg && (
        <div className="mx-5 bg-surface rounded-2xl p-5 border border-accent-border relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-27.5 h-27.5 bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_70%)] pointer-events-none" />
          <div className="flex items-center gap-2 mb-1">
            <Scale size={14} className="text-accent" />
            <span className="text-[11px] text-text-secondary font-medium">Peso actual</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{latest.weight_kg}</span>
            <span className="text-lg text-text-secondary">kg</span>
          </div>
          {weightDiff && (
            <p className={`text-sm font-semibold mt-1 ${parseFloat(weightDiff) <= 0 ? 'text-green' : 'text-orange'}`}>
              {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
              <span className="text-text-secondary font-normal"> este mes</span>
            </p>
          )}
          <p className="text-[11px] text-text-secondary mt-1">
            Últ. registro: {new Date(latest.recorded_on).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            {bmi && ` · IMC: ${bmi}`}
          </p>
        </div>
      )}

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <p className="text-[11px] text-text-secondary font-medium mb-3">
            Peso corporal · últimas {chartData.length} semanas
          </p>
          <div className="h-30 relative">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-text-secondary w-8">
              <span>{Math.round(maxW)}</span>
              <span>{Math.round(minW)}</span>
            </div>
            <svg className="ml-10 w-[calc(100%-40px)] h-full" viewBox={`0 0 ${chartData.length * 40} 120`} preserveAspectRatio="none">
              <polyline
                points={chartData.map((d, i) => `${i * 40 + 20},${120 - ((d.weight_kg! - minW) / rangeW) * 100}`).join(' ')}
                fill="none"
                stroke="#c6f135"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chartData.map((d, i) => (
                <circle
                  key={i}
                  cx={i * 40 + 20}
                  cy={120 - ((d.weight_kg! - minW) / rangeW) * 100}
                  r="3"
                  fill="#c6f135"
                />
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Body measurements */}
      {latest && (
        <div className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mb-3">
            Medidas
          </p>
          <div className="grid grid-cols-2 gap-3">
            {latest.chest_cm && <MeasureCard label="Pecho" value={latest.chest_cm} unit="cm" />}
            {latest.waist_cm && <MeasureCard label="Cintura" value={latest.waist_cm} unit="cm" />}
            {latest.bicep_cm && <MeasureCard label="Bícep" value={latest.bicep_cm} unit="cm" />}
            {latest.thigh_cm && <MeasureCard label="Muslo" value={latest.thigh_cm} unit="cm" />}
          </div>
        </div>
      )}

      {/* Register form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <form
            onSubmit={handleSubmit}
            className="w-full bg-surface rounded-t-2xl p-6 flex flex-col gap-3 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Nuevo registro</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-text-secondary text-sm">
                Cancelar
              </button>
            </div>
            <Field label="Peso (kg)" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />
            <Field label="Pecho (cm)" value={form.chest_cm} onChange={(v) => setForm({ ...form, chest_cm: v })} />
            <Field label="Cintura (cm)" value={form.waist_cm} onChange={(v) => setForm({ ...form, waist_cm: v })} />
            <Field label="Bícep (cm)" value={form.bicep_cm} onChange={(v) => setForm({ ...form, bicep_cm: v })} />
            <Field label="Muslo (cm)" value={form.thigh_cm} onChange={(v) => setForm({ ...form, thigh_cm: v })} />
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

function MeasureCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-surface-alt rounded-lg p-3">
      <p className="text-[11px] text-text-secondary mb-0.5">{label}</p>
      <p className="text-lg font-bold">
        {value} <span className="text-sm text-text-secondary font-normal">{unit}</span>
      </p>
    </div>
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
