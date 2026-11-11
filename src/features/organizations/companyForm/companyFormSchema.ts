import * as Yup from 'yup'

import { phoneLeadingZeroMessage } from '@/components/forms/PhoneInput/phone'
import {
  emailDomainMatchesWebsite,
  emailMatchesCompanyDomain,
  extractWebsiteDomain,
  isPublicEmailDomain,
  isValidCompanyDomainInput,
  isValidLinkedinUrl,
} from '@/features/organizations/utils/emailDomain'

import { CreateOrganizationPayload, UpdateOrganizationPayload } from '../types'

export interface CompanyFormValues {
  name: string
  domain: string
  email: string
  phone: string
  address: string
  industry: string
  website: string
  linkedin: string
  facebook: string
  twitter: string
}

/** The edit form also holds how the team works; culture-fit questions are written from these. */
export type EditCompanyFormValues = CompanyFormValues & {
  companyValues: string[]
}

export type CompanyField = keyof CompanyFormValues

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  name: '',
  domain: '',
  email: '',
  phone: '',
  address: '',
  industry: '',
  website: '',
  linkedin: '',
  facebook: '',
  twitter: '',
}

export const COMPANY_STEP_FIELDS: CompanyField[][] = [
  ['name', 'domain', 'industry', 'address'],
  ['email', 'phone'],
  ['website', 'linkedin', 'twitter', 'facebook'],
]

const phoneSchema = () =>
  Yup.string().test('phone-leading-zero', '', function (value) {
    const message = phoneLeadingZeroMessage(value)
    return message ? this.createError({ message }) : true
  })

const baseShape = {
  name: Yup.string().trim().required('Company name is required'),
  address: Yup.string().trim().required('Address is required'),
  industry: Yup.string(),
  facebook: Yup.string(),
  twitter: Yup.string(),
}

export const createCompanySchema = Yup.object({
  ...baseShape,
  industry: Yup.string().required('Industry is required'),
  phone: phoneSchema().required('Phone number is required'),
  domain: Yup.string()
    .test(
      'domain-format',
      'Domain must include a dot (e.g. acme.com)',
      (value) => !value || isValidCompanyDomainInput(value),
    )
    .test(
      'domain-not-public',
      'Use a corporate domain, not a personal email provider',
      (value) =>
        !value || !isPublicEmailDomain(`name@${value.replace(/^@/, '')}`),
    ),
  email: Yup.string()
    .trim()
    .email('Must be a valid email')
    .required('Email is required')
    .test(
      'corporate-email',
      'Use a corporate work email, not a personal address (Gmail, Yahoo, etc.)',
      function (value) {
        if (!this.parent.domain?.trim()) return true
        return !!value && !isPublicEmailDomain(value)
      },
    )
    .test('email-matches-domain', '', function (value) {
      const domain = this.parent.domain?.trim()
      if (!value || !domain) return true
      if (emailMatchesCompanyDomain(value, domain)) return true
      return this.createError({
        message: `Use an email on ${domain.replace(
          /^@/,
          '',
        )}, since you added that domain.`,
      })
    })
    .test('email-matches-website', '', function (value) {
      const domain = this.parent.domain?.trim()
      const website = this.parent.website?.trim()
      if (!value || !website || !domain) return true
      if (emailDomainMatchesWebsite(value, website)) return true
      const websiteDomain = extractWebsiteDomain(website)
      return this.createError({
        message: `Contact email must use @${
          websiteDomain || 'your website domain'
        }`,
      })
    }),
  website: Yup.string(),
  linkedin: Yup.string()
    .test(
      'linkedin-format',
      'Enter a valid LinkedIn URL (e.g. https://linkedin.com/company/acme)',
      (value) => !value || isValidLinkedinUrl(value),
    )
    .when('domain', {
      is: (domain: string) => !domain?.trim(),
      then: (schema) =>
        schema.required(
          'LinkedIn URL is required when you have no company domain',
        ),
    }),
})

export const MAX_COMPANY_VALUES = 10
export const MAX_COMPANY_VALUE_LENGTH = 200

export const editCompanySchema = Yup.object({
  ...baseShape,
  phone: phoneSchema(),
  linkedin: Yup.string(),
  companyValues: Yup.array()
    .of(
      Yup.string().max(
        MAX_COMPANY_VALUE_LENGTH,
        `Each value can be at most ${MAX_COMPANY_VALUE_LENGTH} characters`,
      ),
    )
    .max(MAX_COMPANY_VALUES, `Add at most ${MAX_COMPANY_VALUES} values`),
})

const trimmed = (value: string) => value.trim()

const optional = (value: string) => {
  const clean = value.trim()
  return clean ? clean : undefined
}

export const toCreatePayload = (
  values: CompanyFormValues,
): CreateOrganizationPayload => ({
  name: trimmed(values.name),
  email: trimmed(values.email),
  address: trimmed(values.address),
  industry: values.industry,
  linkedin: trimmed(values.linkedin),
  domain: optional(values.domain),
  phone: optional(values.phone),
  website: optional(values.website),
  twitter: optional(values.twitter),
  facebook: optional(values.facebook),
})

export const toUpdatePayload = (
  values: EditCompanyFormValues,
): UpdateOrganizationPayload => ({
  name: trimmed(values.name),
  address: trimmed(values.address),
  industry: values.industry,
  linkedin: trimmed(values.linkedin),
  facebook: trimmed(values.facebook),
  twitter: trimmed(values.twitter),
  phone: optional(values.phone),
  companyValues: values.companyValues,
})

const SERVER_ERROR_KEYWORDS: [RegExp, CompanyField][] = [
  [/phone/i, 'phone'],
  [/linkedin/i, 'linkedin'],
  [/email/i, 'email'],
  [/website/i, 'website'],
  [/domain/i, 'domain'],
  [/address/i, 'address'],
  [/industry/i, 'industry'],
  [/name/i, 'name'],
]

export const fieldForServerError = (
  message: string,
  fields: Record<string, string> = {},
): CompanyField | undefined => {
  const known = Object.keys(fields).find(
    (key): key is CompanyField => key in EMPTY_COMPANY_FORM,
  )
  if (known) return known
  return SERVER_ERROR_KEYWORDS.find(([pattern]) => pattern.test(message))?.[1]
}

export const stepForField = (field: string): number =>
  COMPANY_STEP_FIELDS.findIndex((fields) =>
    fields.includes(field as CompanyField),
  )
