/** Splits a full name into the first and last word so avatars show two initials. */
export const nameParts = (fullName: string) => {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: words[0] ?? '',
    lastName: words.length > 1 ? words[words.length - 1]! : '',
  }
}
