export type UserRole = 'admin' | 'freelancer'

export type FreelancerStatus = 'pending' | 'active' | 'removed'

export type FreelancerRole = 'video_editor' | 'graphic_designer' | 'social_media_manager' | 'creative_strategy_lead'

export const FREELANCER_ROLE_LABELS: Record<FreelancerRole, string> = {
  video_editor: 'Video Editor',
  graphic_designer: 'Graphic Designer',
  social_media_manager: 'Social Media Manager',
  creative_strategy_lead: 'Creative & Strategy Lead',
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed'

export type TaskType = 'standard' | 'simple'

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
  job_role: FreelancerRole | null
  created_at: string
  updated_at: string
}

export type ContentPlanStatus = 'scheduled' | 'posted' | 'not_posted'
export type ContentType = 'post' | 'story' | 'reel'

export interface ContentClient {
  id: string
  name: string
  description: string | null
  color: string
  cover_image_url: string | null
  avatar_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
  created_by: string | null
  created_at: string
}

export interface ContentPlan {
  id: string
  client_id: string | null
  date: string
  content_type: ContentType
  platform: string
  platforms: string[]
  scheduled_time: string | null
  tbc: string | null
  caption: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  caption_approved: boolean
  post_approved: boolean
  caption_rejected: boolean
  post_rejected: boolean
  approval_requested: boolean
  client_comments: string | null
  status: ContentPlanStatus
  created_by: string | null
  created_at: string
  creator?: Pick<Profile, 'full_name' | 'username'> | null
}

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  status: ProjectStatus
  cover_image_url: string | null
  avatar_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
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
  task_type: TaskType
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
