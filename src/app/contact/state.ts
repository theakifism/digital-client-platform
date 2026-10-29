export type RequestState = { ok: boolean; message: string; errors: Record<string, string> }
export const initialRequestState: RequestState = { ok: false, message: '', errors: {} }
