import { Field } from 'formik'
import React from 'react'

import TextField from '@/components/forms/TextField'

import { guideLink } from '../../Guide/guideContent'
import { AiFieldActions } from '../AiAssist/AiFieldActions'
import { JobAiContext } from '../AiAssist/useJobFieldAssist'
import styles from './AiConfig.module.scss'
import { AiConfigFieldValues, DICHOTOMY_ERROR_KEY } from './aiConfigModel'
import { PersonalitySection } from './PersonalitySection'
import { NumberField, ScoreSlider, SwitchField } from './ScreeningControls'

type Section = {
  title: string
  what: string
  tip: string
  guideId: string
  children: React.ReactNode
}

const ScreeningSection = ({ title, what, tip, guideId, children }: Section) => (
  <section className={styles.section}>
    <h3 className={styles.sectionTitle}>{title}</h3>
    <p className={styles.sectionWhat}>{what}</p>
    <div className={styles.sectionBody}>{children}</div>
    <p className={styles.tip}>
      Tip: {tip}{' '}
      <a
        href={guideLink(guideId)}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.learnMore}>
        Learn more<span className={styles.srOnly}> (opens in a new tab)</span>
      </a>
    </p>
  </section>
)

type AiConfigFieldsProps = {
  values: AiConfigFieldValues
  errors: Partial<
    Record<keyof AiConfigFieldValues | typeof DICHOTOMY_ERROR_KEY, unknown>
  >
  fieldName: (key: keyof AiConfigFieldValues) => string
  setFieldValue: (key: keyof AiConfigFieldValues, value: unknown) => void
  jobId: string | undefined
  jobContext: JobAiContext
}

export const AiConfigFields = ({
  values,
  errors,
  fieldName,
  setFieldValue,
  jobId,
  jobContext,
}: AiConfigFieldsProps) => {
  const dichotomyError =
    typeof errors[DICHOTOMY_ERROR_KEY] === 'string'
      ? (errors[DICHOTOMY_ERROR_KEY] as string)
      : undefined

  return (
    <>
      <ScreeningSection
        title="Skills test score"
        guideId="skills-test-score"
        what="Every candidate takes one general skills test when they sign up. This is the lowest score they need to apply for this job. They don't retake it for your job."
        tip="50 lets most people through. 70 or higher keeps only strong candidates.">
        <ScoreSlider
          name={fieldName('minPrescreeningScore')}
          label="Minimum skills test score"
        />
      </ScreeningSection>

      <ScreeningSection
        title="CV match"
        guideId="cv-match"
        what="AI reads each CV and scores how well it fits this job, from 0 to 100%. Applicants below your minimum are filtered out. Only you see the score."
        tip="60–75% is a sensible bar. Set it too high and you may miss good people whose CVs are written differently.">
        <SwitchField name={fieldName('cvSimilarity')} label="Use CV match" />
        {values.cvSimilarity === 'true' && (
          <ScoreSlider
            name={fieldName('minCvSimilarityScore')}
            label="Minimum CV match"
          />
        )}
      </ScreeningSection>

      <ScreeningSection
        title="Tailored questions"
        guideId="tailored-questions"
        what="AI writes a few written questions for each applicant, based on this job and their CV — like real work situations. AI also marks the answers."
        tip="4–8 questions works well. More than that and people may give up halfway.">
        <SwitchField
          name={fieldName('personalizedAssessment')}
          label="Ask tailored questions"
        />
        {values.personalizedAssessment === 'true' && (
          <NumberField
            name={fieldName('noPersonalizedQuestions')}
            label="Number of questions"
            min={1}
            max={20}
          />
        )}
      </ScreeningSection>

      <ScreeningSection
        title="Problem-solving and culture-fit tests"
        guideId="company-tests"
        what="Short written tests on this job's page. Problem-solving questions check how someone reasons; culture-fit questions are based on your company values. AI marks the answers and only you see the scores."
        tip="Generate the questions for this job after you switch a test on. Each candidate gets a random set of the number you choose.">
        <SwitchField
          name={fieldName('problemSolvingAssessment')}
          label="Problem-solving test"
        />
        {values.problemSolvingAssessment === 'true' && (
          <NumberField
            name={fieldName('noOfProblemSolvingQuestions')}
            label="Number of problem-solving questions"
            min={1}
            max={10}
          />
        )}
        <SwitchField
          name={fieldName('cultureFitAssessment')}
          label="Culture-fit test"
        />
        {values.cultureFitAssessment === 'true' && (
          <NumberField
            name={fieldName('noOfCultureFitQuestions')}
            label="Number of culture-fit questions"
            min={1}
            max={10}
          />
        )}
      </ScreeningSection>

      <ScreeningSection
        title="Personality check"
        guideId="personality-check"
        what="Everyday workplace questions that show how someone likes to work. Candidates see situations, never personality labels."
        tip="Use this when team fit matters. There are no right or wrong answers — it shows working style.">
        <SwitchField
          name={fieldName('personalityEvaluation')}
          label="Add a personality check"
        />
        {values.personalityEvaluation === 'true' && (
          <PersonalitySection
            values={values}
            fieldName={fieldName}
            dichotomyError={dichotomyError}
            jobId={jobId}
          />
        )}
      </ScreeningSection>

      <ScreeningSection
        title="Notes for the AI (optional)"
        guideId="notes-for-ai"
        what="Private notes telling the AI what a great hire looks like: must-have skills, warning signs, experience level. It uses them to write and mark tailored questions. Candidates never see them."
        tip="Be specific, e.g. “Must have closed B2B deals over ₦10M. Red flag: only retail sales experience.”">
        <AiFieldActions
          field="recruiterGuide"
          format="text"
          value={values.recruiterGuide}
          job={jobContext}
          onApply={(text) => setFieldValue('recruiterGuide', text)}
          writeLabel="Draft notes with AI"
        />
        <label htmlFor={fieldName('recruiterGuide')} className={styles.label}>
          Notes for the AI
        </label>
        <Field
          as="textarea"
          id={fieldName('recruiterGuide')}
          name={fieldName('recruiterGuide')}
          className={styles.textarea}
          placeholder="What should a strong candidate show for this role?"
        />
      </ScreeningSection>

      <ScreeningSection
        title="Setup name"
        guideId="setup-name"
        what="A label so your team can tell this screening setup apart from others."
        tip="Only your team sees this. Candidates never do.">
        <TextField
          label="Setup name"
          name={fieldName('name')}
          placeholder="e.g. Backend engineer – Balanced"
        />
      </ScreeningSection>
    </>
  )
}
