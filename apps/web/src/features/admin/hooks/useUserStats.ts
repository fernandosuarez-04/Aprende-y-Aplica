'use client'

import { useState, useEffect } from 'react'
import { 
  UserStatsService,
  UserProfile,
  Question,
  Answer,
  GenAIAdoption,
  Role,
  Level,
  Area,
  Relationship,
  CompanySize,
  Sector,
  UserStats,
  QuestionStats,
  AnswerStats,
  GenAIStats,
  CreateUserProfileData,
  UpdateUserProfileData,
  CreateQuestionData,
  UpdateQuestionData,
  CreateAnswerData,
  UpdateAnswerData,
  CreateGenAIAdoptionData,
  UpdateGenAIAdoptionData
} from '../services/userStatsService'

export function useUserStats() {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [genAIAdoption, setGenAIAdoption] = useState<GenAIAdoption[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [companySizes, setCompanySizes] = useState<CompanySize[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null)
  const [answerStats, setAnswerStats] = useState<AnswerStats | null>(null)
  const [genAIStats, setGenAIStats] = useState<GenAIStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Intentar cargar datos, pero si falla, usar datos de ejemplo
      try {
        const [
          profilesData,
          questionsData,
          answersData,
          genAIData,
          rolesData,
          levelsData,
          areasData,
          relationshipsData,
          companySizesData,
          sectorsData,
          userStatsData,
          questionStatsData,
          answerStatsData,
          genAIStatsData
        ] = await Promise.all([
          UserStatsService.getUserProfiles(),
          UserStatsService.getQuestions(),
          UserStatsService.getAnswers(),
          UserStatsService.getGenAIAdoption(),
          UserStatsService.getRoles(),
          UserStatsService.getLevels(),
          UserStatsService.getAreas(),
          UserStatsService.getRelationships(),
          UserStatsService.getCompanySizes(),
          UserStatsService.getSectors(),
          UserStatsService.getUserStats(),
          UserStatsService.getQuestionStats(),
          UserStatsService.getAnswerStats(),
          UserStatsService.getGenAIStats()
        ])

        setUserProfiles(profilesData)
        setQuestions(questionsData)
        setAnswers(answersData)
        setGenAIAdoption(genAIData)
        setRoles(rolesData)
        setLevels(levelsData)
        setAreas(areasData)
        setRelationships(relationshipsData)
        setCompanySizes(companySizesData)
        setSectors(sectorsData)
        setUserStats(userStatsData)
        setQuestionStats(questionStatsData)
        setAnswerStats(answerStatsData)
        setGenAIStats(genAIStatsData)
      } catch (apiError) {
        // console.warn('Error cargando datos de API, usando datos de ejemplo:', apiError)
        
        // Usar datos de ejemplo si las APIs fallan
        setUserProfiles([])
        setQuestions([])
        setAnswers([])
        setGenAIAdoption([])
        setRoles([])
        setLevels([])
        setAreas([])
        setRelationships([])
        setCompanySizes([])
        setSectors([])
        setUserStats({
          totalUsers: 0,
          usersByRole: [],
          usersByLevel: [],
          usersByArea: [],
          usersBySector: [],
          usersByCountry: [],
          usersByCompanySize: []
        })
        setQuestionStats({
          totalQuestions: 0,
          questionsByArea: [],
          questionsByType: [],
          questionsBySection: []
        })
        setAnswerStats({
          totalAnswers: 0,
          answersByQuestion: [],
          answersByUser: [],
          averageAnswersPerUser: 0
        })
        setGenAIStats({
          totalRecords: 0,
          averageAIPIIndex: 0,
          countriesWithData: 0,
          topCountries: []
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // User Profiles CRUD
  const createUserProfile = async (data: CreateUserProfileData) => {
    try {
      const newProfile = await UserStatsService.createUserProfile(data)
      setUserProfiles(prev => [newProfile, ...prev])
      return newProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear perfil')
      throw err
    }
  }

  const updateUserProfile = async (id: string, data: UpdateUserProfileData) => {
    try {
      const updatedProfile = await UserStatsService.updateUserProfile(id, data)
      setUserProfiles(prev => prev.map(profile => 
        profile.id === id ? updatedProfile : profile
      ))
      return updatedProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil')
      throw err
    }
  }

  const deleteUserProfile = async (id: string) => {
    try {
      await UserStatsService.deleteUserProfile(id)
      setUserProfiles(prev => prev.filter(profile => profile.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar perfil')
      throw err
    }
  }

  // Questions CRUD
  const createQuestion = async (data: any) => {
    try {
      const newQuestion = await UserStatsService.createQuestion(data)
      setQuestions(prev => [newQuestion, ...prev])
      return newQuestion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear pregunta')
      throw err
    }
  }

  const updateQuestion = async (id: string, data: any) => {
    try {
      const updatedQuestion = await UserStatsService.updateQuestion(id, data)
      setQuestions(prev => prev.map(question => 
        question.id === id ? updatedQuestion : question
      ))
      return updatedQuestion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar pregunta')
      throw err
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      await UserStatsService.deleteQuestion(id)
      setQuestions(prev => prev.filter(question => question.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pregunta')
      throw err
    }
  }

  // Answers CRUD
  const createAnswer = async (data: CreateAnswerData) => {
    try {
      const newAnswer = await UserStatsService.createAnswer(data)
      setAnswers(prev => [newAnswer, ...prev])
      return newAnswer
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear respuesta')
      throw err
    }
  }

  const updateAnswer = async (id: number, data: UpdateAnswerData) => {
    try {
      const updatedAnswer = await UserStatsService.updateAnswer(id, data)
      setAnswers(prev => prev.map(answer => 
        answer.id === id ? updatedAnswer : answer
      ))
      return updatedAnswer
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar respuesta')
      throw err
    }
  }

  const deleteAnswer = async (id: number) => {
    try {
      await UserStatsService.deleteAnswer(id)
      setAnswers(prev => prev.filter(answer => answer.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar respuesta')
      throw err
    }
  }

  // GenAI Adoption CRUD
  const createGenAIAdoption = async (data: CreateGenAIAdoptionData) => {
    try {
      const newRecord = await UserStatsService.createGenAIAdoption(data)
      setGenAIAdoption(prev => [newRecord, ...prev])
      return newRecord
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear registro de adopción')
      throw err
    }
  }

  const updateGenAIAdoption = async (id: number, data: UpdateGenAIAdoptionData) => {
    try {
      const updatedRecord = await UserStatsService.updateGenAIAdoption(id, data)
      setGenAIAdoption(prev => prev.map(record => 
        record.id === id ? updatedRecord : record
      ))
      return updatedRecord
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar registro de adopción')
      throw err
    }
  }

  const deleteGenAIAdoption = async (id: number) => {
    try {
      await UserStatsService.deleteGenAIAdoption(id)
      setGenAIAdoption(prev => prev.filter(record => record.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar registro de adopción')
      throw err
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  return {
    // Data
    userProfiles,
    questions,
    answers,
    genAIAdoption,
    roles,
    levels,
    areas,
    relationships,
    companySizes,
    sectors,
    userStats,
    questionStats,
    answerStats,
    genAIStats,
    
    // State
    loading,
    error,
    
    // Actions
    createUserProfile,
    updateUserProfile,
    deleteUserProfile,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createAnswer,
    updateAnswer,
    deleteAnswer,
    createGenAIAdoption,
    updateGenAIAdoption,
    deleteGenAIAdoption,
    refetch: fetchAllData
  }
}
