type ErrorBody = {
  message?: string
  error?: { code?: string; message?: string; fields?: Record<string, string> }
}

/**
 * The API has two error envelope shapes in the wild: the legacy
 * `{ message }` format and the current `{ error: { message } }` format
 * (see AUTHENTICATION_ERROR/VALIDATION_ERROR responses from api.auxhr.com).
 * Also covers both axios errors (`err.response.data`) and RTK Query's
 * FetchBaseQueryError (`err.data`), so a real backend message surfaces
 * regardless of which client made the request or which endpoint responded.
 */
export const getErrorMessage = (err: unknown, fallback: string): string => {
  const err_ = err as { response?: { data?: unknown }; data?: unknown }
  const data = (err_?.response?.data ?? err_?.data) as ErrorBody | undefined

  return data?.error?.message || data?.message || fallback
}

// Per-file validation errors, e.g. { "corrupt.pdf": "Unable to extract text..." },
// keyed alongside the batch-level message in the `{ error: { message, fields } }` envelope.
export const getErrorFields = (err: unknown): Record<string, string> => {
  const err_ = err as { response?: { data?: unknown }; data?: unknown }
  const data = (err_?.response?.data ?? err_?.data) as ErrorBody | undefined

  return data?.error?.fields ?? {}
}

// Machine-readable error codes (e.g. EMAIL_VERIFICATION_REQUIRED, PROFILE_INCOMPLETE)
// live in the same `{ error: { code } }` envelope as the message.
export const getErrorCode = (err: unknown): string | undefined => {
  const err_ = err as { response?: { data?: unknown }; data?: unknown }
  const data = (err_?.response?.data ?? err_?.data) as ErrorBody | undefined

  return data?.error?.code
}

export const getErrorStatus = (err: unknown): number | undefined => {
  const err_ = err as { response?: { status?: number }; status?: number }
  return err_?.response?.status ?? err_?.status
}
