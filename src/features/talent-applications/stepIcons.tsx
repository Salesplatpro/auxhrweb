import React, { ReactNode } from 'react'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentCheck,
  HiOutlineHeart,
  HiOutlinePuzzlePiece,
  HiOutlineUser,
  HiOutlineVideoCamera,
} from 'react-icons/hi2'

import { PipelineStepKey } from './types'

export const STEP_ICON: Partial<Record<PipelineStepKey, ReactNode>> = {
  skills_test: <HiOutlineClipboardDocumentCheck />,
  tailored: <HiOutlineChatBubbleLeftRight />,
  problem_solving: <HiOutlinePuzzlePiece />,
  culture_fit: <HiOutlineHeart />,
  personality: <HiOutlineUser />,
  ai_interview: <HiOutlineVideoCamera />,
}
