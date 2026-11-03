import useSWR from 'swr'

import {
  fetchAiFeaturePrompts,
  fetchAiModels,
  saveAiFeatureModel,
  saveAiFeaturePrompts,
} from '../services/adminService'
import { AiChoice } from '../types'

const AI_MODELS_KEY = '/admin/ai-models'

export const useAiModels = () => {
  const { data, error, isLoading, mutate } = useSWR(
    AI_MODELS_KEY,
    fetchAiModels,
    { revalidateOnFocus: false },
  )

  const saveFeature = async (key: string, choice: AiChoice) => {
    const saved = await saveAiFeatureModel(key, choice)
    await mutate(
      (current) =>
        current && {
          ...current,
          features: current.features.map((feature) =>
            feature.key === key ? saved : feature,
          ),
        },
      { revalidate: false },
    )
  }

  return {
    overview: data,
    error,
    isLoading,
    retry: () => mutate(),
    saveFeature,
  }
}

export const useAiFeaturePrompts = (featureKey: string | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    featureKey ? `${AI_MODELS_KEY}/features/${featureKey}/prompts` : null,
    () => fetchAiFeaturePrompts(featureKey as string),
    { revalidateOnFocus: false },
  )

  const savePrompts = async (edits: Record<string, string>) => {
    const saved = await saveAiFeaturePrompts(featureKey as string, edits)
    await mutate(saved, { revalidate: false })
    return saved
  }

  return { parts: data, error, isLoading, retry: () => mutate(), savePrompts }
}
