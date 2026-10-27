import { Form } from 'formik'
import React from 'react'
import { HiArrowUpRight } from 'react-icons/hi2'
import * as Yup from 'yup'

import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { paths } from '@/paths'
import { notify } from '@/utils/toastNotifications'

import {
  MarketingInput,
  MarketingSelect,
  MarketingTextarea,
  PillButton,
  SegmentedToggle,
  SurfaceCard,
} from '../ui'
import { ContactRole, roleOptions, subjectOptions } from './contactData'
import styles from './ContactForm.module.scss'

type ContactValues = {
  role: ContactRole
  fullName: string
  workEmail: string
  company: string
  subject: string
  message: string
}

const initialValues: ContactValues = {
  role: 'recruiter',
  fullName: '',
  workEmail: '',
  company: '',
  subject: '',
  message: '',
}

const schema = Yup.object({
  role: Yup.mixed<ContactRole>().oneOf(['recruiter', 'talent']).required(),
  fullName: Yup.string().trim().required('Enter your full name'),
  workEmail: Yup.string()
    .trim()
    .email('Enter a valid email')
    .required('Enter your email'),
  company: Yup.string().trim(),
  subject: Yup.string().required('Choose a topic'),
  message: Yup.string().trim().required('Tell us what you need'),
})

export const ContactForm = () => (
  <SurfaceCard className={styles.card}>
    <div className={styles.header}>
      <h2 className={styles.title}>Send us a message</h2>
      <p className={styles.subtitle}>
        Fill in the form and we’ll route it to the right team.
      </p>
    </div>

    <ValidatedForm<ContactValues>
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={(_values, { resetForm }) => {
        // No contact endpoint on the backend yet; wire the API call here.
        notify('success', 'Thanks! We’ll get back to you shortly.')
        resetForm()
      }}>
      {({ values, setFieldValue, isSubmitting }) => (
        <Form className={styles.form} noValidate>
          <div className={styles.roleField}>
            <span className={styles.roleLabel}>I am a</span>
            <SegmentedToggle
              label="I am a"
              options={roleOptions}
              value={values.role}
              onChange={(role) => setFieldValue('role', role)}
            />
          </div>

          <div className={styles.row}>
            <MarketingInput
              name="fullName"
              label="Full name"
              placeholder="e.g. Ada Okafor"
              autoComplete="name"
            />
            <MarketingInput
              name="workEmail"
              type="email"
              label={values.role === 'talent' ? 'Email' : 'Work email'}
              placeholder={
                values.role === 'talent' ? 'you@email.com' : 'you@company.com'
              }
              autoComplete="email"
            />
          </div>

          <div className={styles.row}>
            <MarketingInput
              name="company"
              label="Company"
              placeholder="Company name"
              autoComplete="organization"
            />
            <MarketingSelect
              name="subject"
              label="Subject"
              placeholder="Choose a topic"
              options={subjectOptions}
            />
          </div>

          <MarketingTextarea
            name="message"
            label="Message"
            placeholder="Tell us a little about what you need..."
          />

          <PillButton
            type="submit"
            fullWidth
            disabled={isSubmitting}
            icon={<HiArrowUpRight aria-hidden />}>
            Send message
          </PillButton>

          <p className={styles.legal}>
            By sending this message you agree to our{' '}
            <a href={`/${paths.privacyPolicy}`}>Privacy Policy</a>.
          </p>
        </Form>
      )}
    </ValidatedForm>
  </SurfaceCard>
)
