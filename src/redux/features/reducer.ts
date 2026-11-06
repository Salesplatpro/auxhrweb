import { combineReducers } from '@reduxjs/toolkit'

import { recruiterApi } from '../api/recruiter'
import { talentApi } from '../api/talent'

const rootReducer = combineReducers({
  [talentApi.reducerPath]: talentApi.reducer,
  [recruiterApi.reducerPath]: recruiterApi.reducer,
})

export default rootReducer
