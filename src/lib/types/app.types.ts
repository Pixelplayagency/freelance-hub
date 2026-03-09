export type UserRole = 'admin' | 'freelancer'

export type FreelancerStatus = 'pending' | 'active' | 'removed'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed'

export type ProjectStatus = 'active' | 'archived'

export type ReferenceType = 'image' | 'link' | 'video' | 'note'

export type NotificationType = 'task_assigned' | 'task_updated' | 'task_due_soon'

export const TASK_STATUSES: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'todo',        label: 'To Do',       color: 'text-slate-600',  bg: 'bg-slate-100' },
  { id: 'in_progress', label: 'In Progress',  color: 'text-blue-600',   bg: 'bg-blue-50'  },
  { id: 'review',      label: 'Review',       color: 'text-amber-600',  bg: 'bg-amber-50' },
  { id: 'completed',   label: 'Completed',    color: 'text-green-600',  bg: 'bg-green-50' },
]

export const STATUS_BADGE_VARIANTS: Record<TaskStatus, string> = {
  todo:        'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  review:      'bg-amber-100 text-amber-700 border-amber-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  role: UserRole
  status: FreelancerStatus
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  status: ProjectStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_to: string | null
  due_date: string | null
  sort_order: number
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  assignee?: Profile | null
  project?: Pick<Project, 'id' | 'name' | 'color'> | null
}

export interface TaskReference {
  id: string
  task_id: string
  type: ReferenceType
  storage_path: string | null
  url: string | null
  content: string | null
  title: string | null
  created_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  task_id: string | null
  project_id: string | null
  message: string
  read: boolean
  created_at: string
  task?: Pick<Task, 'id' | 'title'> | null
}
