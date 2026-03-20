/**
 * Normalizes a phone number to a standard format for storage and matching
 * Removes spaces, dashes, parentheses, and other formatting
 * Keeps only digits and the optional leading + for international prefix
 * 
 * Examples:
 * - "+39 123 456 7890" → "+39123456789"
 * - "(123) 456-7890" → "1234567890"
 * - "123-456-7890" → "1234567890"
 * - "+1 (555) 123-4567" → "+15551234567"
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all whitespace, dashes, parentheses, and dots
  let normalized = phone.replace(/[\s\-()\.]/g, '')
  
  // Keep only the leading + (if present) and digits
  normalized = normalized.replace(/[^\d+]/g, '')
  
  // Ensure + is only at the beginning
  if (normalized.includes('+')) {
    const digits = normalized.replace(/\+/g, '')
    normalized = '+' + digits
  }
  
  return normalized
}

/**
 * Validates if a phone number has a reasonable format
 * Must have at least 7 digits (local number) and max 15 (E.164 standard)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  
  // Must have at least 7 digits
  const digitCount = normalized.replace(/\D/g, '').length
  
  // E.164 standard: max 15 digits, optional + prefix
  if (digitCount < 7 || digitCount > 15) {
    return false
  }
  
  // Should match pattern: optional + followed by digits
  return /^\+?\d{7,15}$/.test(normalized)
}
