import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Search, Plus, Check, Minus } from 'lucide-react'
import { useExercises } from '../hooks/useApi'
import type { Exercise } from '../hooks/useApi'
import { useRoutineBuilder } from '../stores/routineBuilder'

const MUSCLE_TABS = ['Todos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Bíceps', 'Tríceps', 'Abdomen', 'Glúteos', 'Cardio']
const MUSCLE_MAP: Record<string, string> = {
  Pecho: 'pecho',
  Espalda: 'espalda',
  Pierna: 'piernas',
  Hombro: 'hombros',
  Bíceps: 'biceps',
  Tríceps: 'triceps',
  Abdomen: 'abdomen',
  Glúteos: 'gluteos',
  Cardio: 'cardio',
}

const REST_PRESETS = [60, 90, 120]

export function AddExercisePage() {
  const navigate = useNavigate()
  const { data: allExercises } = useExercises()
  const { exercises: selected, addExercise, hasExercise } = useRoutineBuilder()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Todos')

  // Config modal state
  const [configExercise, setConfigExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState(3)
  const [repsMin, setRepsMin] = useState('8')
  const [repsMax, setRepsMax] = useState('12')
  const [rest, setRest] = useState(90)
  const [customRest, setCustomRest] = useState('')
  const [showCustomRest, setShowCustomRest] = useState(false)
  const [configError, setConfigError] = useState('')

  const filtered = allExercises?.filter((e) => {
    const matchesSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === 'Todos' || e.muscle_group === MUSCLE_MAP[activeTab]
    return matchesSearch && matchesTab
  })

  const handleSelectExercise = (ex: Exercise) => {
    if (hasExercise(ex.id)) return
    setConfigExercise(ex)
    setSets(3)
    setRepsMin('8')
    setRepsMax('12')
    setRest(90)
    setShowCustomRest(false)
    setCustomRest('')
    setConfigError('')
  }

  const handleSaveExercise = () => {
    if (!configExercise) return
    const minVal = parseInt(repsMin)
    const maxVal = parseInt(repsMax)
    if (!minVal || minVal < 1) {
      setConfigError('Las repeticiones mínimas deben ser mayor a 0')
      return
    }
    if (!maxVal || maxVal < 1) {
      setConfigError('Las repeticiones máximas deben ser mayor a 0')
      return
    }
    if (minVal > maxVal) {
      setConfigError('El mínimo de repeticiones debe ser menor o igual al máximo')
      return
    }
    if (sets < 1) {
      setConfigError('Debe haber al menos 1 serie')
      return
    }
    const finalRest = showCustomRest ? (parseInt(customRest) || 90) : rest
    setConfigError('')
    addExercise({
      exercise: configExercise,
      target_sets: sets,
      target_reps_min: minVal,
      target_reps_max: maxVal,
      rest_seconds: finalRest,
    })
    setConfigExercise(null)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft size={24} className="text-text" />
          </button>
          <h1 className="text-lg font-bold">Añadir ejercicio</h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-accent text-sm font-semibold"
        >
          Listo ({selected.length})
        </button>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-alt border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Muscle group tabs */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-1.5 min-w-max">
          {MUSCLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-accent text-bg'
                  : 'bg-surface-alt text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-5">
        {filtered && filtered.length > 0 ? (
          filtered.map((ex) => {
            const alreadyAdded = hasExercise(ex.id)
            return (
              <button
                key={ex.id}
                onClick={() => handleSelectExercise(ex)}
                disabled={alreadyAdded}
                className={`w-full text-left px-3 py-3.5 flex items-center gap-3 border-b border-border/30 ${
                  alreadyAdded ? '' : 'active:bg-surface-alt'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-semibold truncate ${alreadyAdded ? 'text-text-secondary' : ''}`}>
                    {ex.name}
                  </p>
                  <p className="text-[12px] text-text-secondary capitalize">
                    {ex.muscle_group}{ex.equipment ? ` · ${ex.equipment.toLowerCase()}` : ''}
                  </p>
                </div>
                {alreadyAdded ? (
                  <span className="text-[12px] text-accent font-semibold flex items-center gap-1">
                    <Check size={14} /> Añadido
                  </span>
                ) : (
                  <div className="w-8 h-8 border border-border flex items-center justify-center flex-shrink-0">
                    <Plus size={16} className="text-text-secondary" />
                  </div>
                )}
              </button>
            )
          })
        ) : (
          <p className="text-sm text-text-secondary text-center py-10">
            No se encontraron ejercicios
          </p>
        )}
      </div>

      {/* Exercise config modal */}
      {configExercise && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end" onClick={() => setConfigExercise(null)}>
          <div
            className="w-full bg-surface rounded-t-2xl px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-[11px] uppercase tracking-[0.08em] text-accent font-semibold">
                {configExercise.muscle_group}{configExercise.equipment ? ` · ${configExercise.equipment.toLowerCase()}` : ''}
              </span>
              <button onClick={() => setConfigExercise(null)} className="text-accent text-sm font-semibold">
                Cerrar
              </button>
            </div>
            <h3 className="text-[22px] font-bold mb-5">{configExercise.name}</h3>

            {/* Series + Reps */}
            <div className="flex gap-4 mb-5">
              {/* Series counter */}
              <div className="flex-1">
                <label className="text-[12px] text-text-secondary block mb-2">Series</label>
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => setSets(Math.max(1, sets - 1))}
                    className="w-10 h-10 flex items-center justify-center text-text-secondary"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="flex-1 text-center text-[18px] font-bold">{sets}</span>
                  <button
                    onClick={() => setSets(Math.min(20, sets + 1))}
                    className="w-10 h-10 flex items-center justify-center text-text-secondary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Reps range */}
              <div className="flex-1">
                <label className="text-[12px] text-text-secondary block mb-2">Reps (rango)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={repsMin}
                    onChange={(e) => setRepsMin(e.target.value)}
                    min={1}
                    className="w-full border border-border px-2 py-2 text-center text-[16px] font-medium bg-transparent text-text focus:outline-none focus:border-accent"
                  />
                  <span className="text-text-secondary">–</span>
                  <input
                    type="number"
                    value={repsMax}
                    onChange={(e) => setRepsMax(e.target.value)}
                    min={1}
                    className="w-full border border-border px-2 py-2 text-center text-[16px] font-medium bg-transparent text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Rest time */}
            <label className="text-[12px] text-text-secondary block mb-2">Descanso entre series</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {REST_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setRest(preset); setShowCustomRest(false) }}
                  className={`py-2.5 text-[13px] font-medium transition-colors ${
                    rest === preset && !showCustomRest
                      ? 'bg-accent text-bg'
                      : 'border border-border text-text'
                  }`}
                >
                  {preset} s
                </button>
              ))}
              <button
                onClick={() => setShowCustomRest(true)}
                className={`py-2.5 text-[13px] font-medium transition-colors ${
                  showCustomRest
                    ? 'bg-accent text-bg'
                    : 'border border-border text-text-secondary'
                }`}
              >
                Otro
              </button>
            </div>
            {showCustomRest && (
              <input
                type="number"
                placeholder="Segundos"
                value={customRest}
                onChange={(e) => setCustomRest(e.target.value)}
                className="w-full border border-border px-3 py-2.5 text-sm bg-transparent text-text placeholder:text-text-secondary focus:outline-none focus:border-accent mb-2"
              />
            )}
            <p className="text-[11px] text-text-secondary mb-5">
              Este valor arranca el temporizador de descanso al registrar cada serie en la sesión activa.
            </p>

            <button
              onClick={handleSaveExercise}
              className="w-full bg-accent text-bg font-bold py-3.5 text-sm"
            >
              Guardar ejercicio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
