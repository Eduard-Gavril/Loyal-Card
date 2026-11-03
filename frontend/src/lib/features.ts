// Business self-signup (/register). Keep it off until the business terms have been reviewed:
// set VITE_SIGNUP_OPEN=true in the Netlify environment to open it.
export const SIGNUP_OPEN = import.meta.env.VITE_SIGNUP_OPEN === 'true'

// Bump this when the business terms / data processing agreement change; it is stored with every signup.
export const BUSINESS_TERMS_VERSION = 'v1-2026-11'
