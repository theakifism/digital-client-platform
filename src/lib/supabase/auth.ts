// Supabase logins need an email address, but our clients log in with a USERNAME.
// So we turn the username into a hidden address, for example:
//   ravi-sharma  ->  ravi-sharma@example.com
// Nobody ever sees or uses this address, and no email is ever sent to it.
export function usernameToEmail(username: string) {
  const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'example.com'
  return `${username.trim().toLowerCase()}@${domain}`
}
