export type CreateState = {
  ok: boolean
  message: string
  errors: Record<string, string>
  created?: { username: string; password: string; slug: string; name: string }
}
export const initialCreateState: CreateState = { ok: false, message: '', errors: {} }

// Bulk upload: the browser reads the file and sends the clients in small groups, so no single request runs for long.
export const BULK_MAX_ROWS = 200
export const BULK_CHUNK = 5

export type BulkInput = {
  line: number
  username: string
  slug: string
  name: string
  company?: string
  designation?: string
  phone?: string
  email?: string
  theme?: string
}

export type BulkRow = {
  line: number
  username: string
  slug: string
  status: 'created' | 'error'
  password?: string
  error?: string
}

export type ResetState = { ok: boolean; message: string; password?: string }
export const initialResetState: ResetState = { ok: false, message: '' }

export type EraseState = { ok: boolean; message: string }
export const initialEraseState: EraseState = { ok: false, message: '' }
