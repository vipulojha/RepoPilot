const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export interface HealthResponse {
  status: string
  service: string
  version: string
}

export interface Repository {
  id: number
  name: string
  path: string
  branch: string
  created_at: string
  updated_at: string
}

export interface RepositoryRegistration {
  name: string
  path: string
  branch?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!response.ok) throw new Error(`RepoPilot API request failed: ${response.status}`)
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  repositories: () => request<{ items: Repository[] }>('/repositories'),
  registerRepository: (payload: RepositoryRegistration) => request<Repository>('/repositories', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
}
