export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@')

  // Always take first 2 chars from local part, then pad with 8 asterisks
  const maskedLocal = local.slice(0, 2) + '*'.repeat(8)

  // Always take first 1 char from domain part, then pad with 7 asterisks
  const maskedDomain = domain.slice(0, 1) + '*'.repeat(7)

  return `${maskedLocal}@${maskedDomain}`
}
