import { useFormikContext } from 'formik'
import React from 'react'
import {
  LuBriefcase,
  LuBuilding2,
  LuFacebook,
  LuGlobe,
  LuLinkedin,
  LuMail,
  LuMapPin,
  LuShieldCheck,
} from 'react-icons/lu'

import { Alert } from '@/components/feedback'
import { PhoneInput, TextInput } from '@/components/forms'
import { Select } from '@/components/forms/Select'
import { INDUSTRY_OPTIONS } from '@/features/organizations/constants/industries'

import styles from './CompanyFields.module.scss'
import { CompanyField, CompanyFormValues } from './companyFormSchema'

type Mode = { mode: 'create' | 'edit' }

const useCompanyField = () => {
  const formik = useFormikContext<CompanyFormValues>()
  const bind = (name: CompanyField) => ({
    name,
    label: name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
  })
  return { formik, bind }
}

const bareDomain = (domain: string) => domain.trim().replace(/^@/, '')

export const IdentityFields = ({ mode }: Mode) => {
  const { formik, bind } = useCompanyField()
  const industryError =
    formik.touched.industry && formik.errors.industry
      ? formik.errors.industry
      : undefined

  return (
    <>
      <TextInput
        {...bind('name')}
        title="Company name"
        autoComplete="organization"
        icon={<LuBuilding2 />}
        placeholder="Acme Ltd"
      />
      {mode === 'create' && (
        <TextInput
          {...bind('domain')}
          title="Company domain"
          labelAside="Optional"
          icon={<LuGlobe />}
          placeholder="acmeltd.com"
          hint="If you add a domain, your team's emails must match it, and LinkedIn becomes optional."
        />
      )}
      <Select
        name="industry"
        label="Industry"
        icon={<LuBriefcase />}
        placeholder="Select an industry"
        options={INDUSTRY_OPTIONS}
        value={formik.values.industry}
        onChange={(value) => {
          formik.setFieldValue('industry', value)
          formik.setFieldTouched('industry', true, false)
        }}
        error={industryError}
      />
      <TextInput
        {...bind('address')}
        title="Address"
        autoComplete="street-address"
        icon={<LuMapPin />}
        placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
      />
    </>
  )
}

export const ContactFields = ({ mode }: Mode) => {
  const { formik, bind } = useCompanyField()
  const domain = bareDomain(formik.values.domain)
  const emailHint =
    mode === 'edit'
      ? 'Email cannot be changed after the company is created.'
      : domain
      ? `Use an email on ${domain}, since you added that domain.`
      : undefined

  return (
    <>
      <TextInput
        {...bind('email')}
        title="Company email"
        type="email"
        autoComplete="email"
        icon={<LuMail />}
        placeholder={domain ? `hiring@${domain}` : 'hiring@acmeltd.com'}
        disabled={mode === 'edit'}
        hint={emailHint}
      />
      <PhoneInput
        title="Phone number"
        name="phone"
        value={formik.values.phone}
        onChange={(value) => formik.setFieldValue('phone', value)}
        onBlur={() => formik.setFieldTouched('phone', true)}
      />
      <Alert variant="info" icon={<LuShieldCheck />} className={styles.note}>
        We only use this to verify your company. It&apos;s never shown to
        candidates.
      </Alert>
    </>
  )
}

export const PresenceFields = ({ mode }: Mode) => {
  const { formik, bind } = useCompanyField()
  const hasDomain = !!bareDomain(formik.values.domain)
  const linkedinRequired = mode === 'create' && !hasDomain

  return (
    <>
      <TextInput
        {...bind('website')}
        title="Website"
        type="url"
        autoComplete="url"
        icon={<LuGlobe />}
        placeholder="https://acmeltd.com"
        disabled={mode === 'edit'}
        hint={
          mode === 'edit'
            ? 'Website cannot be changed after the company is created.'
            : undefined
        }
      />
      <TextInput
        {...bind('linkedin')}
        title="LinkedIn"
        required={linkedinRequired}
        labelAside={
          mode === 'create' && hasDomain ? 'Optional with a domain' : undefined
        }
        icon={<LuLinkedin />}
        placeholder="linkedin.com/company/acme-ltd"
      />
      <div className={styles.pair}>
        <TextInput
          {...bind('twitter')}
          title="X (Twitter)"
          placeholder="@acmeltd"
        />
        <TextInput
          {...bind('facebook')}
          title="Facebook"
          icon={<LuFacebook />}
          placeholder="acmeltd"
        />
      </div>
    </>
  )
}
