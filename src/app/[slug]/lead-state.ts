export type LeadState = { ok: boolean; message: string; errors: Record<string, string> }
export const initialLeadState: LeadState = { ok: false, message: '', errors: {} }
