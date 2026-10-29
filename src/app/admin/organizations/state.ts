export type OrgCreateState = {
  ok: boolean
  message: string
  errors: Record<string, string>
  created?: { orgName: string; username: string; password: string }
}
export const initialOrgCreateState: OrgCreateState = { ok: false, message: '', errors: {} }
