/**
 * A request made with `responseType: 'blob'` gets its error body as a Blob too, which
 * getErrorMessage cannot read. This turns it back into JSON so the server's message shows.
 */
export const withBlobError = async <T>(request: Promise<T>): Promise<T> => {
  try {
    return await request
  } catch (error) {
    const response = (error as { response?: { data?: unknown } })?.response
    if (response?.data instanceof Blob) {
      try {
        response.data = JSON.parse(await response.data.text())
      } catch {
        response.data = undefined
      }
    }
    throw error
  }
}
