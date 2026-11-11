import cn from 'classnames'
import { Field } from 'formik'
import React, { useEffect, useState } from 'react'
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineMicrophone,
  HiOutlineSparkles,
  HiOutlineVideoCamera,
} from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/feedback'
import TextField from '@/components/forms/TextField'
import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { IconBadge } from '@/components/ui/IconBadge'
import { Pill } from '@/components/ui/Pill'
import { useProfile } from '@/features/profile/hooks/useProfile'

import { AiFieldActions } from '../AiAssist/AiFieldActions'
import { JobAiContext } from '../AiAssist/useJobFieldAssist'
import styles from './AiConfig.module.scss'
import { AiConfigFieldValues, DICHOTOMY_ERROR_KEY } from './aiConfigModel'
import {
  PersonalityAdvanced,
  PersonalityCountField,
} from './PersonalitySection'
import { NumberField, scoreLevel, SwitchField } from './ScreeningControls'
import {
  NEW_SCREENING_STEPS,
  SCREENING_STEP_ICON,
  ScreeningStepKey,
} from './screeningSteps'

const COMPANY_PAGE = '/recruiterDashboard/company'

type ScreeningCardProps = {
  step: ScreeningStepKey
  title: string
  description: string
  switchName: string
  on: boolean
  locked?: boolean
  children?: React.ReactNode
}

const ScreeningCard = ({
  step,
  title,
  description,
  switchName,
  on,
  locked,
  children,
}: ScreeningCardProps) => {
  const isNew = NEW_SCREENING_STEPS.includes(step)
  return (
    <section
      className={cn(styles.card, isNew && on && styles.cardHighlight)}
      aria-label={title}>
      <IconBadge
        icon={SCREENING_STEP_ICON[step].icon}
        tone={SCREENING_STEP_ICON[step].tone}
        className={styles.cardIcon}
      />
      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          <div>
            <h3 className={styles.cardTitle}>
              {title}
              {isNew && (
                <Pill tone="success" size="sm">
                  New
                </Pill>
              )}
            </h3>
            <p className={styles.cardWhat}>{description}</p>
          </div>
          <SwitchField name={switchName} label={title} disabled={locked} />
        </div>
        {on && children}
      </div>
    </section>
  )
}

type AiConfigFieldsProps = {
  values: AiConfigFieldValues
  errors: Partial<
    Record<keyof AiConfigFieldValues | typeof DICHOTOMY_ERROR_KEY, unknown>
  >
  fieldName: (key: keyof AiConfigFieldValues) => string
  setFieldValue: (key: keyof AiConfigFieldValues, value: unknown) => void
  jobId: string | undefined
  jobContext: JobAiContext
  /** Shown first inside Advanced, e.g. copying another job's setup. */
  advancedExtra?: React.ReactNode
}

export const AiConfigFields = ({
  values,
  errors,
  fieldName,
  setFieldValue,
  jobId,
  jobContext,
  advancedExtra,
}: AiConfigFieldsProps) => {
  const { profile } = useProfile()
  const hasCompanyValues =
    (profile?.activeOrganization?.companyValues?.length ?? 0) > 0
  const dichotomyError =
    typeof errors[DICHOTOMY_ERROR_KEY] === 'string'
      ? (errors[DICHOTOMY_ERROR_KEY] as string)
      : undefined
  const modeError =
    typeof errors.aiInterviewMode === 'string'
      ? errors.aiInterviewMode
      : undefined

  const [advancedOpen, setAdvancedOpen] = useState(false)
  useEffect(() => {
    if (errors.name) setAdvancedOpen(true)
  }, [errors.name])

  const isOn = (key: keyof AiConfigFieldValues) => values[key] === 'true'
  const score = Number(values.minPrescreeningScore)

  return (
    <div className={styles.cards}>
      <ScreeningCard
        step="skillsTest"
        title="Skills test"
        description="Checks the core skills for this role. Candidates must reach your minimum score."
        switchName={fieldName('prescreeningAssessment')}
        on
        locked>
        <NumberField
          inline
          name={fieldName('minPrescreeningScore')}
          label="Minimum score"
          min={0}
          max={100}
          step={5}
          suffix="%"
          hint={
            values.minPrescreeningScore !== '' && Number.isFinite(score)
              ? scoreLevel(score)
              : undefined
          }
        />
      </ScreeningCard>

      <ScreeningCard
        step="cvMatch"
        title="CV match"
        description="Compares each CV with your job details and ranks the best fit first."
        switchName={fieldName('cvSimilarity')}
        on={isOn('cvSimilarity')}>
        <NumberField
          inline
          name={fieldName('minCvSimilarityScore')}
          label="Minimum match"
          min={0}
          max={100}
          step={5}
          suffix="%"
        />
      </ScreeningCard>

      <ScreeningCard
        step="tailored"
        title="Tailored questions"
        description="Short written questions based on each candidate's CV."
        switchName={fieldName('personalizedAssessment')}
        on={isOn('personalizedAssessment')}>
        <NumberField
          inline
          name={fieldName('noPersonalizedQuestions')}
          label="Number of questions"
          min={1}
          max={20}
        />
      </ScreeningCard>

      <ScreeningCard
        step="problemSolving"
        title="Problem-solving test"
        description="Gives a short work problem and checks how the candidate thinks it through."
        switchName={fieldName('problemSolvingAssessment')}
        on={isOn('problemSolvingAssessment')}>
        <NumberField
          inline
          name={fieldName('noOfProblemSolvingQuestions')}
          label="Number of questions"
          min={1}
          max={10}
          hint="1 to 10"
        />
      </ScreeningCard>

      <ScreeningCard
        step="cultureFit"
        title="Culture-fit test"
        description="Checks how well the candidate matches the way your team works."
        switchName={fieldName('cultureFitAssessment')}
        on={isOn('cultureFitAssessment')}>
        <NumberField
          inline
          name={fieldName('noOfCultureFitQuestions')}
          label="Number of questions"
          min={1}
          max={10}
          hint="1 to 10"
        />
        {!hasCompanyValues && (
          <Alert
            variant="warning"
            icon={<HiOutlineExclamationTriangle />}
            className={styles.valuesWarning}>
            <span>
              <strong>Add your company values first.</strong> Culture-fit
              questions are written from them.{' '}
              <Link to={COMPANY_PAGE} className={styles.warningLink}>
                Go to Company page
              </Link>
            </span>
          </Alert>
        )}
      </ScreeningCard>

      <ScreeningCard
        step="personality"
        title="Personality check"
        description="Questions spread over 4 traits. Shows a 4-letter type and a fit score."
        switchName={fieldName('personalityEvaluation')}
        on={isOn('personalityEvaluation')}>
        <PersonalityCountField
          values={values}
          fieldName={fieldName}
          dichotomyError={dichotomyError}
        />
      </ScreeningCard>

      <ScreeningCard
        step="aiInterview"
        title="AI interview"
        description="AI writes 5 questions from your job description and may ask up to 2 follow-ups."
        switchName={fieldName('aiInterview')}
        on={isOn('aiInterview')}>
        <div
          className={styles.choiceRow}
          role="radiogroup"
          aria-label="How candidates answer"
          data-field={fieldName('aiInterviewMode')}>
          <ChoiceCard
            compact
            name={fieldName('aiInterviewMode')}
            value="audio"
            checked={values.aiInterviewMode === 'audio'}
            onSelect={(mode) => setFieldValue('aiInterviewMode', mode)}
            icon={<HiOutlineMicrophone />}
            title="Audio only"
            description="Candidates answer by voice"
          />
          <ChoiceCard
            compact
            name={fieldName('aiInterviewMode')}
            value="audio_video"
            checked={values.aiInterviewMode === 'audio_video'}
            onSelect={(mode) => setFieldValue('aiInterviewMode', mode)}
            icon={<HiOutlineVideoCamera />}
            title="Audio and video"
            description="Candidates answer on camera"
          />
        </div>
        {modeError && (
          <div className={styles.fieldError} role="alert">
            {modeError}
          </div>
        )}
        <ul className={styles.metaLine}>
          <li>
            <HiOutlineClock aria-hidden /> About 15 minutes
          </li>
          <li>
            <HiOutlineCalendar aria-hidden /> Candidates do it whenever suits
            them
          </li>
          <li>
            <HiOutlineSparkles aria-hidden /> Scores are AI suggestions
          </li>
        </ul>
      </ScreeningCard>

      <details
        className={styles.advanced}
        open={advancedOpen}
        onToggle={(event) =>
          setAdvancedOpen((event.target as HTMLDetailsElement).open)
        }>
        <summary>Advanced</summary>
        <div className={styles.advancedBody}>
          {advancedExtra}

          {isOn('personalityEvaluation') && (
            <PersonalityAdvanced
              values={values}
              fieldName={fieldName}
              jobId={jobId}
            />
          )}

          <div className={styles.fieldGroup}>
            <AiFieldActions
              field="recruiterGuide"
              format="text"
              value={values.recruiterGuide}
              job={jobContext}
              onApply={(text) => setFieldValue('recruiterGuide', text)}
              writeLabel="Draft notes with AI"
            />
            <label
              htmlFor={fieldName('recruiterGuide')}
              className={styles.label}>
              Notes for the AI (optional)
            </label>
            <Field
              as="textarea"
              id={fieldName('recruiterGuide')}
              name={fieldName('recruiterGuide')}
              className={styles.textarea}
              placeholder="What should a strong candidate show for this role?"
            />
            <p className={styles.hint}>
              Private notes the AI uses to write and mark tailored questions.
              Candidates never see them.
            </p>
          </div>

          <TextField
            label="Setup name"
            name={fieldName('name')}
            placeholder="e.g. Backend engineer – Balanced"
          />
        </div>
      </details>
    </div>
  )
}
