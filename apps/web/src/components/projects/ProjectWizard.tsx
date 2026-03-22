'use client'

import { useState, useCallback } from 'react'
import { Button } from '../ui/Button'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

interface RubricCriterion {
  id: string
  name: string
  description: string
  maxScore: number
}

interface ProjectWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectData) => Promise<void>
}

interface CreateProjectData {
  title: string
  description?: string
  gradeMin?: number
  gradeMax?: number
  subject?: string
  difficulty?: number
  rubricCriteria?: RubricCriterion[]
}

const SUBJECTS = [
  'Mathematics',
  'Science',
  'Language Arts',
  'Social Studies',
  'Art',
  'Music',
  'Physical Education',
  'Technology',
  'Other'
]

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Elementary' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' }
]

export function ProjectWizard({ isOpen, onClose, onSubmit }: ProjectWizardProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    gradeMin: 1,
    gradeMax: 12,
    subject: '',
    difficulty: 2,
    rubricCriteria: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateForm = useCallback(<K extends keyof CreateProjectData>(
    field: K,
    value: CreateProjectData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.title?.trim()) {
        newErrors.title = 'Project title is required'
      }
      if (formData.gradeMin && formData.gradeMax && formData.gradeMin > formData.gradeMax) {
        newErrors.gradeMin = 'Minimum grade must be less than or equal to maximum grade'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Failed to create project:', error)
      setErrors({ submit: 'Failed to create project. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setFormData({
      title: '',
      description: '',
      gradeMin: 1,
      gradeMax: 12,
      subject: '',
      difficulty: 2,
      rubricCriteria: []
    })
    setErrors({})
    onClose()
  }

  const addRubricCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `criterion-${Date.now()}`,
      name: '',
      description: '',
      maxScore: 5
    }
    updateForm('rubricCriteria', [...(formData.rubricCriteria || []), newCriterion])
  }

  const updateRubricCriterion = (id: string, field: keyof RubricCriterion, value: string | number) => {
    const newCriteria = formData.rubricCriteria?.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ) || []
    updateForm('rubricCriteria', newCriteria)
  }

  const removeRubricCriterion = (id: string) => {
    const newCriteria = formData.rubricCriteria?.filter(c => c.id !== id) || []
    updateForm('rubricCriteria', newCriteria)
  }

  if (!isOpen) return null

  const totalSteps = 3

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
            <p className="text-sm text-gray-500 mt-1">Step {step} of {totalSteps}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'flex-1 h-2 rounded-full transition-colors',
                  s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  )}
                  placeholder="Enter project title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe the project..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gradeMin" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Grade
                  </label>
                  <select
                    id="gradeMin"
                    value={formData.gradeMin}
                    onChange={(e) => updateForm('gradeMin', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <option key={grade} value={grade}>{grade} Grade</option>
                    ))}
                  </select>
                  {errors.gradeMin && <p className="mt-1 text-sm text-red-500">{errors.gradeMin}</p>}
                </div>

                <div>
                  <label htmlFor="gradeMax" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Grade
                  </label>
                  <select
                    id="gradeMax"
                    value={formData.gradeMax}
                    onChange={(e) => updateForm('gradeMax', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <option key={grade} value={grade}>{grade} Grade</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => updateForm('subject', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => updateForm('difficulty', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Rubric Criteria */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Rubric Criteria</h3>
              <p className="text-sm text-gray-500">
                Define the criteria that will be used to evaluate student submissions.
              </p>

              {formData.rubricCriteria?.map((criterion, index) => (
                <div key={criterion.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Criterion {index + 1}</span>
                    <button
                      onClick={() => removeRubricCriterion(criterion.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => updateRubricCriterion(criterion.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Criterion name (e.g., 'Creativity')"
                  />

                  <textarea
                    value={criterion.description}
                    onChange={(e) => updateRubricCriterion(criterion.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Description of what is expected..."
                  />

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Max Score:</label>
                    <input
                      type="number"
                      value={criterion.maxScore}
                      onChange={(e) => updateRubricCriterion(criterion.id, 'maxScore', parseInt(e.target.value) || 1)}
                      min={1}
                      max={10}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                onClick={addRubricCriterion}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Criterion
              </Button>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Review & Create</h3>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{formData.title}</h4>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-sm text-gray-500">Grades</span>
                    <p className="font-medium text-gray-900">
                      {formData.gradeMin} - {formData.gradeMax}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Subject</span>
                    <p className="font-medium text-gray-900">{formData.subject || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Difficulty</span>
                    <p className="font-medium text-gray-900">
                      {DIFFICULTY_LEVELS.find(l => l.value === formData.difficulty)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Rubric Criteria</span>
                    <p className="font-medium text-gray-900">{formData.rubricCriteria?.length || 0} criteria</p>
                  </div>
                </div>

                {formData.rubricCriteria && formData.rubricCriteria.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Criteria:</span>
                    <ul className="mt-2 space-y-1">
                      {formData.rubricCriteria.map((c, i) => (
                        <li key={c.id} className="text-sm text-gray-700">
                          {i + 1}. {c.name || 'Unnamed'} (Max: {c.maxScore} pts)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}

            {step < totalSteps ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                Create Project
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
