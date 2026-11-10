export interface AppNotification {
  id: string
  userId: string
  title?: string | null
  message: string
  link?: string | null
  type?: string | null
  organizationId?: string | null
  isRead: boolean
  deleted: boolean
  createdAt: string
}
