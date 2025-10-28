'use client'

import { useState } from 'react'
import { Plus, X, Trash2, GripVertical } from 'lucide-react'

interface QuizQuestion {
  id: string
  question: string
  questionType: 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  correctAnswer: string
  explanation?: string
  points: number
}

interface QuizBuilderProps {
  questions: QuizQuestion[]
  onChange: (questions: QuizQuestion[]) => void
}

export function QuizBuilder({ questions, onChange }: QuizBuilderProps) {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      questionType: 'multiple_choice',
      options: [''],
      correctAnswer: '',
      explanation: '',
      points: 1
    }
    onChange([...questions, newQuestion])
  }

  const updateQuestion = (id: string, field: keyof QuizQuestion, value: any) => {
    onChange(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const deleteQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id))
  }

  const addOption = (questionId: string) => {
    onChange(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...(q.options || []), ''] }
        : q
    ))
  }

  const updateOption = (questionId: string, index: number, value: string) => {
    onChange(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.map((opt, i) => i === index ? value : opt)
          }
        : q
    ))
  }

  const removeOption = (questionId: string, index: number) => {
    onChange(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options?.filter((_, i) => i !== index) }
        : q
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-300">Preguntas del Quiz</h4>
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Pregunta</span>
        </button>
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
          {/* Header de la pregunta */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Pregunta {index + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => deleteQuestion(question.id)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Tipo de pregunta */}
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Tipo de Pregunta</label>
            <select
              value={question.questionType}
              onChange={(e) => updateQuestion(question.id, 'questionType', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value="multiple_choice">Opción Múltiple</option>
              <option value="true_false">Verdadero/Falso</option>
              <option value="short_answer">Respuesta Corta</option>
            </select>
          </div>

          {/* Pregunta */}
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Pregunta *</label>
            <textarea
              value={question.question}
              onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
              placeholder="Escribe la pregunta aquí..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>

          {/* Opciones (solo para multiple_choice) */}
          {question.questionType === 'multiple_choice' && (
            <div className="mb-3">
              <label className="block text-sm text-gray-400 mb-1">Opciones</label>
              <div className="space-y-2">
                {question.options?.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={question.correctAnswer === option}
                      onChange={() => updateQuestion(question.id, 'correctAnswer', option)}
                      className="text-blue-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                      placeholder={`Opción ${optIndex + 1}`}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                    />
                    {question.options && question.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, optIndex)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(question.id)}
                  className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Opción</span>
                </button>
              </div>
            </div>
          )}

          {/* Respuesta correcta (para true_false y short_answer) */}
          {(question.questionType === 'true_false' || question.questionType === 'short_answer') && (
            <div className="mb-3">
              <label className="block text-sm text-gray-400 mb-1">Respuesta Correcta *</label>
              {question.questionType === 'true_false' ? (
                <select
                  value={question.correctAnswer}
                  onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="true">Verdadero</option>
                  <option value="false">Falso</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={question.correctAnswer}
                  onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                  placeholder="Respuesta correcta..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              )}
            </div>
          )}

          {/* Explicación */}
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Explicación (Opcional)</label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
              placeholder="Explica por qué esta es la respuesta correcta..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>

          {/* Puntos */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Puntos</label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
      ))}

      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-600 rounded">
          No hay preguntas. Haz clic en "Agregar Pregunta" para comenzar.
        </div>
      )}
    </div>
  )
}

