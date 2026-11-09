const CODE_LENGTH = 8

/** Uppercases what the person types and shows it as XXXX-XXXX. */
export const formatAccessCodeInput = (value: string) => {
  const chars = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH)
  return chars.length > 4 ? `${chars.slice(0, 4)}-${chars.slice(4)}` : chars
}

export const isCompleteAccessCode = (value: string) =>
  value.replace(/-/g, '').length === CODE_LENGTH
