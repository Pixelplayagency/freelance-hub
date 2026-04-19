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
  content_plan_pdf_path: string | null
  content_plan_link: string | null
  created_by: string | null
  created_at: string
}

export interface MediaItem {
  url: string
  type: 'image' | 'video'
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
  media_items: MediaItem[]
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

export type DiscoveryQuestionType = 'single_choice' | 'multi_choice' | 'social_handles' | 'dropdown'

export interface DiscoveryQuestion {
  id: string
  page: 1 | 2
  text: string
  type: DiscoveryQuestionType
  options: string[]
  required?: boolean
}

export interface DiscoveryConfig {
  questions: DiscoveryQuestion[]
  coverImageUrl?: string | null
  profileImageUrl?: string | null
  tagline?: string | null
  agencyHandle?: string | null
  formTitle?: string | null
  formDescription?: string | null
}

export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  coverImageUrl: null,
  profileImageUrl: null,
  tagline: 'WHY FIT IN? WHEN YOU CAN STAND OUT',
  agencyHandle: 'PIXELPLAY.AGENCY',
  formTitle: 'Client Discovery Survey By PixelPlay Creative Agency',
  formDescription: 'This form helps us understand your brand and the kind of marketing and creative support you\'re looking for. It takes only a few minutes to complete.',
  questions: [
    { id: 'q1', page: 1, text: 'How would you describe your current brand presence?', type: 'dropdown', options: ["We don't have any branding yet and would like support", 'We have a logo but need help building full branding', 'We have a complete brand kit (visuals, fonts, colors, and tone of voice)'] },
    { id: 'q2', page: 1, text: 'Have you worked with an agency before?', type: 'dropdown', options: ['Yes', 'No'] },
    { id: 'q3', page: 1, text: 'When are you looking to start?', type: 'dropdown', options: ['Immediately', 'Within 1 month', '2–3 months', '5 months +'] },
    { id: 'q4_note', page: 1, text: 'Please add all of your social media account @username', type: 'social_handles', options: [] },
    { id: 'q5', page: 2, text: 'What kind of support do you expect from us?', type: 'multi_choice', options: ['Social Media Strategy & Management', 'Campaign Strategy & Production', 'Brand Development & Identity Design', 'Paid Media Strategy & Management'] },
    { id: 'q6', page: 2, text: 'What type of content do you need us to create?', type: 'multi_choice', options: ['Photography', 'Videography', 'Graphic Design', 'Short-Form Video Production', 'Product & Lifestyle Content Production'] },
    { id: 'q7', page: 2, text: 'How much content do you roughly want per month?', type: 'single_choice', options: ['6–12 Posts', '12–18 Posts', '18–28 Posts', 'Not sure (need guidance)'] },
    { id: 'q8', page: 2, text: 'How many reels are you expecting per month?', type: 'single_choice', options: ['02 – 04 Reels', '04 – 06 Reels', '06 – 08 Reels', 'Other Amounts'] },
    { id: 'q9', page: 2, text: 'Are you okay with us visiting your site for content shoots at the end or start of the month (1–2 times per month)?', type: 'single_choice', options: ["Yes, that works", "No, I'd prefer another arrangement"] },
    { id: 'q10', page: 2, text: 'How much would you be able to spend on marketing (monthly budget range)?', type: 'single_choice', options: ['Rs 80,000 – 100,000', 'Rs 100,000 – 160,000', 'Rs 160,000 – 200,000', 'Rs 250,000 +'] },
  ]
}

export interface DiscoveryToken {
  id: string
  token: string
  label: string | null
  created_by: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
  submission?: DiscoverySubmission | null
}

export interface DiscoverySubmission {
  id: string
  token_id: string | null
  first_name: string
  last_name: string
  email: string
  contact_number: string | null
  business_role: string | null
  brand_name: string
  industry: string | null
  business_description: string | null
  brand_presence: string | null
  worked_with_agency: string | null
  start_timeline: string | null
  instagram_handle: string | null
  facebook_handle: string | null
  tiktok_handle: string | null
  website_url: string | null
  support_types: string[] | null
  content_types: string[] | null
  posts_per_month: string | null
  reels_per_month: string | null
  site_visits_ok: string | null
  monthly_budget: string | null
  submitted_at: string
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
