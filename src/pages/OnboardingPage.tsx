import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router'
import { Dumbbell, ChevronRight, Ruler, Weight } from 'lucide-react'
import { useUpdateProfile, useUpsertMeasurement } from '../hooks/useApi'
import { useAuthStore } from '../stores/auth'

const STEPS = ['welcome', 'body', 'goal'] as const
type Step = typeof STEPS[number]

export function OnboardingPage() {
  const { session, loading } = useAuthStore()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const upsertMeasurement = useUpsertMeasurement()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  const [step, setStep] = useState<Step>('welcome')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [saving, setSaving] = useState(false)

  const currentIndex = STEPS.indexOf(step)

  const handleNext = () => {
    const next = STEPS[currentIndex + 1]
    if (next) setStep(next)
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const profileBody: Record<string, unknown> = { weight_unit: weightUnit }
      if (heightCm) profileBody.height_cm = parseFloat(heightCm)
      await updateProfile.mutateAsync(profileBody as any)

      if (weightKg) {
        await upsertMeasurement.mutateAsync({
          recorded_on: new Date().toISOString().slice(0, 10),
          weight_kg: parseFloat(weightKg),
        })
      }

      navigate('/', { replace: true })
    } catch {
      navigate('/', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bg relative overflow-hidden">
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[220px] h-[220px] bg-[radial-gradient(circle,rgba(198,241,53,0.15)_0%,transparent_65%)] pointer-events-none" />

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= currentIndex ? 'bg-accent' : 'bg-surface-alt'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {step === 'welcome' && (
          <>
            <div className="w-20 h-20 bg-surface rounded-[24px] border border-accent-border flex items-center justify-center mb-6">
              <Dumbbell size={36} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-center">Bienvenido a Gym Tracker</h1>
            <p className="text-text-secondary text-sm text-center max-w-[280px] mb-8">
              Vamos a configurar tu perfil para personalizar tu experiencia de entrenamiento.
            </p>
            <button
              onClick={handleNext}
              className="w-full max-w-xs bg-accent text-bg font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              Comenzar
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {step === 'body' && (
          <>
            <div className="w-16 h-16 bg-surface rounded-[20px] border border-accent-border flex items-center justify-center mb-6">
              <Ruler size={28} className="text-accent" />
            </div>
            <h2 className="text-xl font-bold mb-1 text-center">Tus medidas</h2>
            <p className="text-text-secondary text-sm text-center max-w-[280px] mb-6">
              Esto nos ayuda a calcular tu IMC y seguir tu progreso.
            </p>

            <div className="w-full max-w-xs flex flex-col gap-3">
              <div>
                <label className="text-[12px] text-text-secondary mb-1 block">Estatura (cm)</label>
                <input
                  type="number"
                  placeholder="Ej: 175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-surface-alt border border-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[12px] text-text-secondary mb-1 block">Peso actual</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Ej: 70"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    step="0.1"
                    className="flex-1 bg-surface-alt border border-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
                  />
                  <div className="flex bg-surface-alt rounded-lg border border-border p-[3px]">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                        weightUnit === 'kg' ? 'bg-accent text-bg' : 'text-text-secondary'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lb')}
                      className={`px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                        weightUnit === 'lb' ? 'bg-accent text-bg' : 'text-text-secondary'
                      }`}
                    >
                      lb
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-accent text-bg font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-3"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
              <button
                onClick={handleNext}
                className="text-text-secondary text-sm font-medium"
              >
                Omitir por ahora
              </button>
            </div>
          </>
        )}

        {step === 'goal' && (
          <>
            <div className="w-16 h-16 bg-surface rounded-[20px] border border-accent-border flex items-center justify-center mb-6">
              <Weight size={28} className="text-accent" />
            </div>
            <h2 className="text-xl font-bold mb-1 text-center">Todo listo</h2>
            <p className="text-text-secondary text-sm text-center max-w-[280px] mb-8">
              Tu perfil está configurado. Ahora puedes crear tu primera rutina y empezar a entrenar.
            </p>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full max-w-xs bg-accent text-bg font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Ir al Dashboard'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
