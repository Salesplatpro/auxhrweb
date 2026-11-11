import * as Yup from 'yup'

import { workModeNeedsLocation } from '@/components/features/jobs/WorkTypeCheckboxes'
import { emptyToUndefined } from '@/utils/yupHelpers'

export const validationSchema = Yup.object({
  role: Yup.string().required('Role is required'),
  jobBrief: Yup.string().required('Job Brief is required'),
  requirements: Yup.string().required('Requirements is required'),
  experienceLevel: Yup.string().required('Experience level is required'),
  location: Yup.object({
    country: Yup.object({
      name: Yup.string(),
    }),
    state: Yup.object({
      name: Yup.string(),
    }),
  }).when('workMode', {
    is: (workMode: string[] | undefined) =>
      workModeNeedsLocation(workMode ?? []),
    then: (schema) =>
      schema.shape({
        country: Yup.object({
          name: Yup.string().required('Country is required'),
        }),
      }),
  }),
  workMode: Yup.array()
    .of(Yup.string().oneOf(['remote', 'hybrid', 'onSite']))
    .min(1, 'Work mode is required'),
  currency: Yup.string().required('Currency is required'),
  minSalary: Yup.number()
    .required('Minimum Salary is required')
    .positive('Minimum Salary must be positive'),
  maxSalary: Yup.number()
    .transform(emptyToUndefined)
    .nullable()
    .positive('Maximum Salary must be positive')
    .test(
      'max-greater-than-min',
      'Maximum salary must be greater than minimum salary',
      function (value) {
        const { minSalary } = this.parent
        if (!value || !minSalary) return true
        return Number(value) > Number(minSalary)
      },
    ),
  compensationPeriod: Yup.string()
    .oneOf(['monthly', 'yearly'], 'Invalid compensation period')
    .required('Compensation period is required'),
  skills: Yup.array()
    .of(
      Yup.string()
        .required('Skill cannot be empty')
        .max(250, 'Skill cannot exceed 250 characters'),
    )
    .min(1, 'At least one skill is required'),
  goals: Yup.array()
    .of(
      Yup.string()
        .required('Goal cannot be empty')
        .max(250, 'Goal cannot exceed 250 characters'),
    )
    .min(1, 'At least one goal is required'),
  department: Yup.string().max(100, 'Department can be at most 100 characters'),
  employmentType: Yup.string()
    .oneOf(['full_time', 'part_time', 'contract', 'internship'])
    .required('Job type is required'),
  closesAt: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Pick a closing date',
    excludeEmptyString: true,
  }),
  shareOptions: Yup.boolean(),
})
