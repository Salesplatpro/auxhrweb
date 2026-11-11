import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { EMPTY_JOB_FORM } from '../utils/jobFormValues'
import { JobPreview } from './JobPreview'

describe('JobPreview', () => {
  it('shows placeholders for an empty form', () => {
    render(<JobPreview values={EMPTY_JOB_FORM} roleName="" />)
    expect(screen.getByText('Job title')).toBeTruthy()
    expect(screen.getByText(/your job brief appears here/i)).toBeTruthy()
  })

  it('renders the job as candidates will see it', () => {
    render(
      <JobPreview
        roleName="product designer"
        companyName="Kosana Tech Ltd"
        values={{
          ...EMPTY_JOB_FORM,
          workMode: ['hybrid'],
          location: {
            country: { name: 'Nigeria', isoCode: 'NG' },
            state: { name: 'Lagos', isoCode: 'LA' },
            city: { name: 'Lekki', isoCode: '' },
          },
          experienceLevel: '4-6 years',
          employmentType: 'contract',
          shareOptions: true,
          currency: 'NGN',
          minSalary: '300000',
          maxSalary: '380000',
          compensationPeriod: 'monthly',
          jobBrief: '<p>Own the payments experience</p>',
        }}
      />,
    )
    expect(screen.getByText('Product Designer')).toBeTruthy()
    expect(screen.getByText('Kosana Tech Ltd · Lekki, Lagos')).toBeTruthy()
    expect(screen.getByText('KT')).toBeTruthy()
    for (const pill of ['Hybrid', '4-6 years', 'Contract', 'Share options']) {
      expect(screen.getByText(pill)).toBeTruthy()
    }
    expect(screen.getByText('₦300k – ₦380k / month')).toBeTruthy()
    expect(screen.getByText('Own the payments experience')).toBeTruthy()
  })
})
