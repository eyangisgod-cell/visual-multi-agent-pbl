'use client'

import { useState, useCallback } from 'react'
import { Button } from '../ui/button'
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

interface RubricScore {
  criterionId: string
  score: number
  comment?: string
}

interface SubmissionProps {
  taskId: string
  rubricCriteria?: RubricCriterion[]
  existingSubmission?: {
    content: string
    scores?: RubricScore[]
    submittedAt?: string
  }
  onSubmit?: (data: { content: string; scores?: RubricScore[] }) => Promise<void>
  readOnly?: boolean
  isEvaluator?: boolean
}

export function SubmissionAndRubric({
  taskId,
  rubricCriteria = [],
  existingSubmission,
  onSubmit,
  readOnly = false,
  isEvaluator = false
}: SubmissionProps) {
  const [submissionContent, setSubmissionContent] = useState(
    existingSubmission?.content || ''
  )
  const [scores, setScores] = useState<RubricScore[]>(
    existingSubmission?.scores ||
    rubricCriteria.map(c => ({ criterionId: c.id, score: 0 }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'submission' | 'rubric'>('submission')

  const handleScoreChange = useCallback((criterionId: string, score: number) => {
    setScores(prev => prev.map(s =>
      s.criterionId === criterionId ? { ...s, score } : s
    ))
  }, [])

  const handleCommentChange = useCallback((criterionId: string, comment: string) => {
    setScores(prev => prev.map(s =>
      s.criterionId === criterionId ? { ...s, comment } : s
    ))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!submissionContent.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit?.({
        content: submissionContent,
        scores: isEvaluator ? scores : undefined
      })
    } catch (err) {
      console.error('Failed to submit:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [submissionContent, scores, onSubmit, isEvaluator])

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
  const maxPossibleScore = rubricCriteria.reduce((sum, c) => sum + c.maxScore, 0)
  const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('submission')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'submission'
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          📝 Submission
        </button>
        {rubricCriteria.length > 0 && (
          <button
            onClick={() => setActiveTab('rubric')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'rubric'
                ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            📊 Rubric Assessment
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'submission' && (
          <div className="space-y-4">
            {readOnly && !submissionContent ? (
              <div className="text-center py-8 text-gray-500">
                <p>No submission yet</p>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="submission"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {readOnly ? 'Submitted Content' : 'Your Submission'}
                  </label>
                  <textarea
                    id="submission"
                    value={submissionContent}
                    onChange={(e) => !readOnly && setSubmissionContent(e.target.value)}
                    readOnly={readOnly}
                    rows={8}
                    placeholder={readOnly ? undefined : 'Describe your work, what you created, and any reflections...'}
                    className={cn(
                      'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500',
                      readOnly
                        ? 'bg-gray-50 border-gray-200 text-gray-700'
                        : 'border-gray-300'
                    )}
                  />
                </div>

                {existingSubmission?.submittedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submitted on {new Date(existingSubmission.submittedAt).toLocaleString()}
                  </div>
                )}

                {!readOnly && (
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSubmit}
                      isLoading={isSubmitting}
                      variant="primary"
                    >
                      Submit Work
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'rubric' && rubricCriteria.length > 0 && (
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Score</p>
                  <p className={cn('text-3xl font-bold', getScoreColor(scorePercentage)}>
                    {totalScore} / {maxPossibleScore}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Percentage</p>
                  <p className={cn('text-3xl font-bold', getScoreColor(scorePercentage)}>
                    {scorePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    scorePercentage >= 90
                      ? 'bg-green-500'
                      : scorePercentage >= 70
                      ? 'bg-yellow-500'
                      : scorePercentage >= 50
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
            </div>

            {/* Rubric Criteria */}
            <div className="space-y-4">
              {rubricCriteria.map((criterion, index) => {
                const currentScore = scores.find(s => s.criterionId === criterion.id)
                const percentage = (currentScore?.score || 0) / criterion.maxScore * 100

                return (
                  <div
                    key={criterion.id}
                    className="border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {index + 1}. {criterion.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {criterion.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {currentScore?.score || 0} / {criterion.maxScore}
                        </p>
                      </div>
                    </div>

                    {/* Score Slider */}
                    {isEvaluator || readOnly ? (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          {Array.from({ length: criterion.maxScore + 1 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => !readOnly && handleScoreChange(criterion.id, i)}
                              disabled={readOnly}
                              className={cn(
                                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                                (currentScore?.score || 0) >= i
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
                                readOnly && 'cursor-default'
                              )}
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <input
                          type="range"
                          min={0}
                          max={criterion.maxScore}
                          value={currentScore?.score || 0}
                          onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>{criterion.maxScore}</span>
                        </div>
                      </div>
                    )}

                    {/* Score Comment */}
                    {(isEvaluator || !readOnly) && (
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          Comment (optional)
                        </label>
                        <input
                          type="text"
                          value={currentScore?.comment || ''}
                          onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                          placeholder="Add feedback..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                          readOnly={readOnly}
                        />
                      </div>
                    )}

                    {/* Visual Indicator */}
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          percentage >= 90
                            ? 'bg-green-500'
                            : percentage >= 70
                            ? 'bg-yellow-500'
                            : percentage >= 50
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            {!readOnly && isEvaluator && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  variant="primary"
                >
                  Save Assessment
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
