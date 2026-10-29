export type SaveState = {
  ok: boolean
  message: string
  errors: Record<string, string>
}

export const initialState: SaveState = { ok: false, message: '', errors: {} }
