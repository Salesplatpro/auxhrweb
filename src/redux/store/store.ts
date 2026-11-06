import { configureStore } from '@reduxjs/toolkit'

import { recruiterApi } from '../api/recruiter'
import { talentApi } from '../api/talent'
import rootReducer from '../features/reducer'

export const store = configureStore({
  reducer: rootReducer,
  // Nothing non-serializable lives in the store any more: the scout slice held
  // `File` objects and has moved to Zustand, where they stay out of persistence.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      talentApi.middleware,
      recruiterApi.middleware,
    ),
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof rootReducer>
