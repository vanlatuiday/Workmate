import api from './api'
import type { JobListing, PaginatedResponse } from '@types/index'

export interface JobFilter {
  keyword?: string
  city?: string
  district?: string
  jobType?: string
  salaryMin?: number
  salaryMax?: number
  industry?: string
  nearMe?: boolean
  lat?: number
  lng?: number
  radiusKm?: number
  page?: number
  pageSize?: number
}

export const jobService = {
  getJobs: (filter: JobFilter) =>
    api.get<PaginatedResponse<JobListing>>('/jobs', { params: filter }),

  getJobById: (id: string) =>
    api.get<JobListing>(`/jobs/${id}`),

  createJob: (data: Partial<JobListing>) =>
    api.post<JobListing>('/jobs', data),

  updateJob: (id: string, data: Partial<JobListing>) =>
    api.put<JobListing>(`/jobs/${id}`, data),

  deleteJob: (id: string) =>
    api.delete(`/jobs/${id}`),

  saveJob: (jobId: string) =>
    api.post(`/jobs/${jobId}/save`),

  unsaveJob: (jobId: string) =>
    api.delete(`/jobs/${jobId}/save`),

  getSavedJobs: () =>
    api.get<JobListing[]>('/jobs/saved'),
}
