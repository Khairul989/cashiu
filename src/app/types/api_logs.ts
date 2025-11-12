export type ApiLog = {
  method: string
  url: string
  payload: string | null
  status: 'success' | 'error'
  remarks: string | null
  created_at: Date
  updated_at: Date
}
