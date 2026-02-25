/**
 * Admin authorization utilities
 * Uses ADMIN_EMAILS (comma-separated) as the single source of truth
 */

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email)
}
