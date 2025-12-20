export type Meeting = {
  id: string
  title: string
  description?: string
  scheduledTime: Date
  duration: number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  concentrationScore?: number
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export type CreateMeetingData = {
  title: string
  description?: string
  scheduledTime: string
  duration: number
  createdById: string
  participantIds?: string[]
}

export type UpdateMeetingData = {
  title?: string
  description?: string
  scheduledTime?: string
  duration?: number
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}