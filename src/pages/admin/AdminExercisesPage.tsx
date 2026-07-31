import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2, Upload, Image, ChevronLeft, Search } from 'lucide-react'
import {
  useExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  useProfile,
  type Exercise,
} from '../../hooks/useApi'
import { api } from '../../lib/api'
import { uploadExerciseImage } from '../../lib/storage'

const MUSCLE_GROUPS = [
  'pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps',
  'abdomen', 'gluteos', 'pantorrillas', 'cardio', 'otro',
] as const

export function AdminExercisesPage() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('')
  const { data: exercises, isLoading } = useExercises(filterGroup || undefined, search || undefined)
  const createExercise = useCreateExercise()
  const updateExercise = useUpdateExercise()
  const deleteExercise = useDeleteExercise()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [form, setForm] = useState({ name: '', muscle_group: 'pecho', equipment: '', notes: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!profile?.is_admin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-red text-sm font-semibold">Acceso denegado</p>
        <p className="text-text-secondary text-sm">No tienes permisos de administrador.</p>
        <button onClick={() => navigate('/')} className="bg-accent text-bg font-bold py-2.5 px-6 rounded-lg text-sm">
          Volver al inicio
        </button>
      </div>
    )
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', muscle_group: 'pecho', equipment: '', notes: '' })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  const openEdit = (ex: Exercise) => {
    setEditing(ex)
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment ?? '',
      notes: ex.notes ?? '',
    })
    setImageFile(null)
    setImagePreview(ex.image_url)
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, string | undefined> = {
        name: form.name,
        muscle_group: form.muscle_group,
        equipment: form.equipment || undefined,
        notes: form.notes || undefined,
      }

      let exercise: Exercise
      if (editing) {
        exercise = await updateExercise.mutateAsync({ id: editing.id, ...body })
      } else {
        exercise = await createExercise.mutateAsync(body as any)
      }

      if (imageFile) {
        const imageUrl = await uploadExerciseImage(imageFile, exercise.id)
        await api.post(`/api/exercises/${exercise.id}/image`, { image_url: imageUrl })
        updateExercise.mutate({ id: exercise.id, image_url: imageUrl })
      }

      setShowForm(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ejercicio?')) return
    await deleteExercise.mutateAsync(id)
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate('/')} className="p-1">
          <ChevronLeft size={24} className="text-text" />
        </button>
        <h1 className="text-xl font-bold flex-1">Admin: Ejercicios</h1>
        <button onClick={openCreate} className="bg-accent text-bg font-bold text-sm px-3 py-2 rounded-lg flex items-center gap-1">
          <Plus size={14} />
          Nuevo
        </button>
      </div>

      {/* Filters */}
      <div className="px-5 flex flex-col gap-2 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-alt border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <FilterChip label="Todos" active={!filterGroup} onClick={() => setFilterGroup('')} />
          {MUSCLE_GROUPS.map((g) => (
            <FilterChip key={g} label={g} active={filterGroup === g} onClick={() => setFilterGroup(g)} />
          ))}
        </div>
      </div>

      {/* Exercise list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-5 pb-6">
          {exercises?.map((ex) => (
            <div key={ex.id} className="bg-surface rounded-xl p-3 border border-border flex items-center gap-3">
              {/* Image thumbnail */}
              <div className="w-14 h-14 rounded-lg bg-surface-alt flex-shrink-0 overflow-hidden flex items-center justify-center">
                {ex.image_url ? (
                  <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                ) : (
                  <Image size={20} className="text-text-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] truncate">{ex.name}</p>
                <p className="text-[12px] text-text-secondary capitalize">{ex.muscle_group}</p>
                {ex.equipment && <p className="text-[11px] text-text-secondary">{ex.equipment}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(ex)} className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center">
                  <Pencil size={14} className="text-blue" />
                </button>
                <button onClick={() => handleDelete(ex.id)} className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center">
                  <Trash2 size={14} className="text-red" />
                </button>
              </div>
            </div>
          ))}
          {exercises?.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-10">No hay ejercicios</p>
          )}
        </div>
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end">
          <form
            onSubmit={handleSubmit}
            className="w-full bg-surface rounded-t-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">{editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-text-secondary text-sm">
                Cancelar
              </button>
            </div>

            {/* Image upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-xl bg-surface-alt border border-border overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Image size={32} className="text-text-secondary" />
                )}
              </div>
              <label className="text-blue text-sm font-semibold flex items-center gap-1 cursor-pointer">
                <Upload size={14} />
                {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <FormField label="Nombre" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent"
              />
            </FormField>

            <FormField label="Grupo muscular" required>
              <select
                value={form.muscle_group}
                onChange={(e) => setForm({ ...form, muscle_group: e.target.value })}
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent capitalize"
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g} className="capitalize">{g}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Equipamiento">
              <input
                type="text"
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                placeholder="Ej: Barra, Mancuernas..."
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />
            </FormField>

            <FormField label="Notas">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Instrucciones o notas..."
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-accent resize-none"
              />
            </FormField>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-accent text-bg font-bold py-3 rounded-xl text-sm mt-2 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear ejercicio'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-colors ${
        active ? 'bg-accent text-bg' : 'bg-surface-alt text-text-secondary border border-border'
      }`}
    >
      {label}
    </button>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] text-text-secondary mb-1 block">
        {label} {required && <span className="text-red">*</span>}
      </label>
      {children}
    </div>
  )
}
