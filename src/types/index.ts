// ─── Auth ───────────────────────────────────────────────────────────────────
export type UserRole = 'jobseeker' | 'recruiter' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: string
}

// ─── Jobseeker ───────────────────────────────────────────────────────────────
export interface JobseekerProfile {
  id: string
  userId: string
  fullName: string
  avatar?: string
  age?: number
  location: string
  phone: string
  email: string
  education: Education[]
  experience: Experience[]
  skills: Skill[]
  availability: WeeklyAvailability
  desiredJobType: JobType[]
  desiredSalary?: SalaryRange
  maxDistanceKm?: number
}

export interface Education {
  school: string
  major: string
  startYear: number
  endYear?: number
}

export interface Experience {
  title: string
  company: string
  startDate: string
  endDate?: string
  description?: string
}

export interface Skill {
  name: string
  category: 'professional' | 'communication' | 'workstyle' | 'practical'
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface TimeSlot {
  start: string
  end: string
}

export type WeeklyAvailability = Record<DayOfWeek, TimeSlot[]>

// ─── Recruiter ───────────────────────────────────────────────────────────────
export interface RecruiterProfile {
  id: string
  userId: string
  companyName: string
  logo?: string
  address: string
  phone: string
  email: string
  website?: string
  facebook?: string
  description: string
  industry: string
  size: CompanySize
  contactPerson: string
  verified: boolean
}

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'

// ─── Job ─────────────────────────────────────────────────────────────────────
export type JobType = 'full-time' | 'part-time' | 'shift' | 'seasonal' | 'flexible' | 'event' | 'freelance'
export type SalaryUnit = 'hour' | 'day' | 'month' | 'commission' | 'negotiable'

export interface SalaryRange {
  min?: number
  max?: number
  unit: SalaryUnit
}

export interface JobListing {
  id: string
  recruiterId: string
  recruiter?: RecruiterProfile
  title: string
  industry: string
  description: string
  quantity: number
  jobType: JobType
  location: {
    city: string
    district: string
    address?: string
    lat?: number
    lng?: number
  }
  salary: SalaryRange
  requirements: JobRequirements
  softCriteria: string[]
  mandatoryCriteria: string[]
  preferredCriteria: string[]
  schedule?: WeeklyAvailability
  status: 'active' | 'closed' | 'draft'
  createdAt: string
  expiresAt?: string
}

export interface JobRequirements {
  minAge?: number
  maxAge?: number
  minExperienceYears?: number
  education?: string
  skills: string[]
  languages?: string[]
  certificates?: string[]
}

// ─── Matching ────────────────────────────────────────────────────────────────
export type MatchLevel = 'high' | 'medium' | 'possible' | 'low'

export interface MatchResult {
  id: string
  jobId: string
  jobseekerId: string
  score: number
  level: MatchLevel
  breakdown: MatchBreakdown
  jobseekerInterested?: boolean
  recruiterInterested?: boolean
  matched: boolean
  createdAt: string
}

export interface MatchBreakdown {
  skills: number
  schedule: number
  location: number
  salary: number
  experience: number
  jobType: number
  aspiration: number
}

// ─── Application ─────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'applied'
  | 'viewed'
  | 'considering'
  | 'interview_invited'
  | 'hired'
  | 'rejected'

export interface Application {
  id: string
  jobId: string
  job?: JobListing
  jobseekerId: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  note?: string
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatRoom {
  id: string
  matchId: string
  participants: string[]
  lastMessage?: Message
  updatedAt: string
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  content: string
  createdAt: string
  read: boolean
}

// ─── Interview ───────────────────────────────────────────────────────────────
export interface Interview {
  id: string
  applicationId: string
  jobId: string
  jobseekerId: string
  recruiterId: string
  scheduledAt: string
  location?: string
  type: 'online' | 'offline'
  meetLink?: string
  status: 'pending' | 'confirmed' | 'done' | 'cancelled'
  note?: string
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  id: string
  fromId: string
  toId: string
  fromRole: 'jobseeker' | 'recruiter'
  score: number
  criteria: Record<string, number>
  comment?: string
  createdAt: string
}

// ─── Notification ────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  read: boolean
  link?: string
  createdAt: string
}

// ─── API Response ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
