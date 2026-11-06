export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72
export const PASSWORD_SYMBOLS = '@ $ ! % * # . ? &'
export const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#.?&])[A-Za-z\d@$!%*#?.&]{8,}$/

const SYMBOL = /[@$!%*#.?&]/
const ALLOWED_ONLY = /^[A-Za-z\d@$!%*#.?&]*$/

export const checkPassword = (value: string) => ({
  length:
    value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
  letterAndNumber: /[A-Za-z]/.test(value) && /\d/.test(value),
  symbol: SYMBOL.test(value),
  allowedOnly: ALLOWED_ONLY.test(value),
})

export const passwordRuleItems = (value: string) => {
  const checks = checkPassword(value)
  return [
    {
      label: `${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`,
      done: checks.length,
    },
    { label: 'One letter and one number', done: checks.letterAndNumber },
    {
      label: `One symbol, such as ${PASSWORD_SYMBOLS}`,
      done: checks.symbol && checks.allowedOnly,
    },
  ]
}

export type PasswordStrengthLevel =
  | 'empty'
  | 'invalid'
  | 'weak'
  | 'fair'
  | 'strong'
  | 'veryStrong'

export const STRONG_PASSWORD_LENGTH = 12

export const passwordStrength = (
  value: string,
): { level: PasswordStrengthLevel; filled: number } => {
  if (!value) return { level: 'empty', filled: 0 }
  const checks = checkPassword(value)
  if (!checks.allowedOnly || value.length > PASSWORD_MAX_LENGTH) {
    return { level: 'invalid', filled: 1 }
  }
  const met = [checks.length, checks.letterAndNumber, checks.symbol].filter(
    Boolean,
  ).length
  if (met === 3) {
    return value.length >= STRONG_PASSWORD_LENGTH
      ? { level: 'veryStrong', filled: 4 }
      : { level: 'strong', filled: 3 }
  }
  return { level: met === 2 ? 'fair' : 'weak', filled: Math.max(met, 1) }
}
