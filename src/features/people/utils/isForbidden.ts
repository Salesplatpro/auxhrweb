import axios from 'axios'

export const isForbidden = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 403
