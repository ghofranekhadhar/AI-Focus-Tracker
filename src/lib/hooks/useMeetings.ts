// src/lib/hooks/useMeetings.ts 
import { useState, useEffect } from 'react'

export type Meeting = {
  id: string
  title: string
  description?: string
  scheduledTime: string
  duration: number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  concentrationScore?: number
  createdById: string
  createdAt: string
  updatedAt: string
  participants: Array<{
    id: string
    name: string
    email: string
  }>
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/meetings')
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📥 Réunions chargées:', data)
      setMeetings(data)
    } catch (err) {
      console.error('Erreur fetchMeetings:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Démarrer une réunion
  const startMeeting = async (meetingId: string): Promise<boolean> => {
    try {
      console.log('🚀 Tentative de démarrage réunion:', meetingId)
      
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          status: 'IN_PROGRESS'
        })
      })

      console.log('📡 Réponse API - Status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('❌ Erreur API démarrage:', errorData)
        throw new Error(errorData?.error || `Erreur ${response.status}`)
      }

      const updatedMeeting = await response.json()
      console.log('✅ Réunion démarrée avec succès:', updatedMeeting)
      
      setMeetings(prev => prev.map(m => 
        m.id === meetingId ? updatedMeeting : m
      ))
      
      return true
    } catch (err) {
      console.error('❌ Erreur startMeeting:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(`Échec du démarrage: ${errorMessage}`)
      return false
    }
  }

  // Terminer une réunion
  const endMeeting = async (meetingId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      if (!response.ok) throw new Error('Erreur lors de la fin')
      
      const updatedMeeting = await response.json()
      setMeetings(prev => prev.map(m => 
        m.id === meetingId ? updatedMeeting : m
      ))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la fin')
      return false
    }
  }

  // Supprimer une réunion
  const deleteMeeting = async (meetingId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      setMeetings(prev => prev.filter(m => m.id !== meetingId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      return false
    }
  }

  const clearError = () => setError(null)

  useEffect(() => {
    fetchMeetings()
  }, [])

  return {
    meetings,
    loading,
    error,
    startMeeting,
    endMeeting,
    deleteMeeting,
    refreshMeetings: fetchMeetings,
    clearError
  }
}