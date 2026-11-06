export const COMPANY_DRAFT_PREFIX = 'auxhr:company-draft:'

export const clearAllCompanyDrafts = () => {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(COMPANY_DRAFT_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    return
  }
}
