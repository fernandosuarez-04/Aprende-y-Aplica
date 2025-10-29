import {
  UserProfile,
  Role,
  Level,
  Area,
  Relationship,
  CompanySize,
  Sector,
  Question,
  Answer,
  RoleSynonym,
  GenAIAdoption,
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
} from './userStats.service'

export class UserStatsService {
  private static baseUrl = '/api/admin/user-stats'

  // ===== USER PROFILES =====
  static async getUserProfiles(): Promise<UserProfile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles`)
      if (!response.ok) throw new Error('Failed to fetch user profiles')
      return await response.json()
    } catch (error) {
      console.error('Error fetching user profiles:', error)
      throw error
    }
  }

  static async getUserProfile(id: string): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles/${id}`)
      if (!response.ok) throw new Error('Failed to fetch user profile')
      return await response.json()
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  static async createUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create user profile')
      return await response.json()
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  static async updateUserProfile(id: string, data: UpdateUserProfileData): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update user profile')
      return await response.json()
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  static async deleteUserProfile(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete user profile')
    } catch (error) {
      console.error('Error deleting user profile:', error)
      throw error
    }
  }

  // ===== QUESTIONS =====
  static async getQuestions(): Promise<Question[]> {
    try {
      const response = await fetch(`${this.baseUrl}/questions`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      return await response.json()
    } catch (error) {
      console.error('Error fetching questions:', error)
      throw error
    }
  }

  static async getQuestion(id: number): Promise<Question> {
    try {
      const response = await fetch(`${this.baseUrl}/questions/${id}`)
      if (!response.ok) throw new Error('Failed to fetch question')
      return await response.json()
    } catch (error) {
      console.error('Error fetching question:', error)
      throw error
    }
  }

  static async createQuestion(data: CreateQuestionData): Promise<Question> {
    try {
      const response = await fetch(`${this.baseUrl}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create question')
      return await response.json()
    } catch (error) {
      console.error('Error creating question:', error)
      throw error
    }
  }

  static async updateQuestion(id: number, data: UpdateQuestionData): Promise<Question> {
    try {
      const response = await fetch(`${this.baseUrl}/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update question')
      return await response.json()
    } catch (error) {
      console.error('Error updating question:', error)
      throw error
    }
  }

  static async deleteQuestion(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/questions/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete question')
    } catch (error) {
      console.error('Error deleting question:', error)
      throw error
    }
  }

  // ===== ANSWERS =====
  static async getAnswers(): Promise<Answer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/answers`)
      if (!response.ok) throw new Error('Failed to fetch answers')
      return await response.json()
    } catch (error) {
      console.error('Error fetching answers:', error)
      throw error
    }
  }

  static async getAnswer(id: number): Promise<Answer> {
    try {
      const response = await fetch(`${this.baseUrl}/answers/${id}`)
      if (!response.ok) throw new Error('Failed to fetch answer')
      return await response.json()
    } catch (error) {
      console.error('Error fetching answer:', error)
      throw error
    }
  }

  static async createAnswer(data: CreateAnswerData): Promise<Answer> {
    try {
      const response = await fetch(`${this.baseUrl}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create answer')
      return await response.json()
    } catch (error) {
      console.error('Error creating answer:', error)
      throw error
    }
  }

  static async updateAnswer(id: number, data: UpdateAnswerData): Promise<Answer> {
    try {
      const response = await fetch(`${this.baseUrl}/answers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update answer')
      return await response.json()
    } catch (error) {
      console.error('Error updating answer:', error)
      throw error
    }
  }

  static async deleteAnswer(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/answers/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete answer')
    } catch (error) {
      console.error('Error deleting answer:', error)
      throw error
    }
  }

  // ===== GEN AI ADOPTION =====
  static async getGenAIAdoption(): Promise<GenAIAdoption[]> {
    try {
      const response = await fetch(`${this.baseUrl}/genai-adoption`)
      if (!response.ok) throw new Error('Failed to fetch GenAI adoption data')
      return await response.json()
    } catch (error) {
      console.error('Error fetching GenAI adoption:', error)
      throw error
    }
  }

  static async getGenAIAdoptionRecord(id: number): Promise<GenAIAdoption> {
    try {
      const response = await fetch(`${this.baseUrl}/genai-adoption/${id}`)
      if (!response.ok) throw new Error('Failed to fetch GenAI adoption record')
      return await response.json()
    } catch (error) {
      console.error('Error fetching GenAI adoption record:', error)
      throw error
    }
  }

  static async createGenAIAdoption(data: CreateGenAIAdoptionData): Promise<GenAIAdoption> {
    try {
      const response = await fetch(`${this.baseUrl}/genai-adoption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create GenAI adoption record')
      return await response.json()
    } catch (error) {
      console.error('Error creating GenAI adoption:', error)
      throw error
    }
  }

  static async updateGenAIAdoption(id: number, data: UpdateGenAIAdoptionData): Promise<GenAIAdoption> {
    try {
      const response = await fetch(`${this.baseUrl}/genai-adoption/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update GenAI adoption record')
      return await response.json()
    } catch (error) {
      console.error('Error updating GenAI adoption:', error)
      throw error
    }
  }

  static async deleteGenAIAdoption(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/genai-adoption/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete GenAI adoption record')
    } catch (error) {
      console.error('Error deleting GenAI adoption:', error)
      throw error
    }
  }

  // ===== LOOKUP TABLES =====
  static async getRoles(): Promise<Role[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup/roles`)
      if (!response.ok) throw new Error('Failed to fetch roles')
      return await response.json()
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  }

  static async getLevels(): Promise<Level[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup/levels`)
      if (!response.ok) throw new Error('Failed to fetch levels')
      return await response.json()
    } catch (error) {
      console.error('Error fetching levels:', error)
      throw error
    }
  }

  static async getAreas(): Promise<Area[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup/areas`)
      if (!response.ok) throw new Error('Failed to fetch areas')
      return await response.json()
    } catch (error) {
      console.error('Error fetching areas:', error)
      throw error
    }
  }

  static async getRelationships(): Promise<Relationship[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup/relationships`)
      if (!response.ok) throw new Error('Failed to fetch relationships')
      return await response.json()
    } catch (error) {
      console.error('Error fetching relationships:', error)
      throw error
    }
  }

  static async getCompanySizes(): Promise<CompanySize[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup/company-sizes`)
      if (!response.ok) throw new Error('Failed to fetch company sizes')
      return await response.json()
    } catch (error) {
      console.error('Error fetching company sizes:', error)
      throw error
    }
  }

  static async getSectors(): Promise<Sector[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup/sectors`)
      if (!response.ok) throw new Error('Failed to fetch sectors')
      return await response.json()
    } catch (error) {
      console.error('Error fetching sectors:', error)
      throw error
    }
  }

  // ===== STATISTICS =====
  static async getUserStats(): Promise<UserStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/users`)
      if (!response.ok) throw new Error('Failed to fetch user stats')
      return await response.json()
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  }

  static async getQuestionStats(): Promise<QuestionStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/questions`)
      if (!response.ok) throw new Error('Failed to fetch question stats')
      return await response.json()
    } catch (error) {
      console.error('Error fetching question stats:', error)
      throw error
    }
  }

  static async getAnswerStats(): Promise<AnswerStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/answers`)
      if (!response.ok) throw new Error('Failed to fetch answer stats')
      return await response.json()
    } catch (error) {
      console.error('Error fetching answer stats:', error)
      throw error
    }
  }

  static async getGenAIStats(): Promise<GenAIStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/genai`)
      if (!response.ok) throw new Error('Failed to fetch GenAI stats')
      return await response.json()
    } catch (error) {
      console.error('Error fetching GenAI stats:', error)
      throw error
    }
  }
}
