import { redirect } from 'next/navigation'

// Clients cannot change their own password. Only the admin can (Admin -> Cards -> Change password).
// This page is kept only so old bookmarks do not show an error.
export default function PasswordPage() {
  redirect('/dashboard')
}
