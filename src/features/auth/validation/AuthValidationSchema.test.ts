import { describe, expect, it } from 'vitest'

import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  SignUpSchema,
} from './AuthValidationSchema'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', async () => {
    await expect(
      forgotPasswordSchema.validate({ email: 'talent@example.com' }),
    ).resolves.toBeTruthy()
  })

  it('rejects an empty email', async () => {
    await expect(forgotPasswordSchema.validate({ email: '' })).rejects.toThrow(
      'Email is required',
    )
  })

  it('rejects an invalid email format', async () => {
    await expect(
      forgotPasswordSchema.validate({ email: 'not-an-email' }),
    ).rejects.toThrow('Enter a valid email address')
  })
})

describe('resetPasswordSchema', () => {
  it('accepts a password that meets backend rules', async () => {
    await expect(
      resetPasswordSchema.validate({
        password: 'NewPassword1!',
        confirmPassword: 'NewPassword1!',
      }),
    ).resolves.toBeTruthy()
  })

  it('rejects a password that is too short', async () => {
    await expect(
      resetPasswordSchema.validate({
        password: 'Ab1!',
        confirmPassword: 'Ab1!',
      }),
    ).rejects.toThrow('Password must be between 8 and 72 characters')
  })

  it('rejects mismatched confirmation', async () => {
    await expect(
      resetPasswordSchema.validate({
        password: 'NewPassword1!',
        confirmPassword: 'OtherPassword1!',
      }),
    ).rejects.toThrow('Passwords must match')
  })
})

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'OldPassword1!',
    newPassword: 'NewPassword1!',
    confirmPassword: 'NewPassword1!',
  }

  it('accepts a valid current, new, and confirm password', async () => {
    await expect(changePasswordSchema.validate(valid)).resolves.toBeTruthy()
  })

  it('rejects an empty current password', async () => {
    await expect(
      changePasswordSchema.validate({ ...valid, currentPassword: '' }),
    ).rejects.toThrow('Current password is required')
  })

  it('rejects a new password that is too short', async () => {
    await expect(
      changePasswordSchema.validate({
        ...valid,
        newPassword: 'Ab1!',
        confirmPassword: 'Ab1!',
      }),
    ).rejects.toThrow('Password must be between 8 and 72 characters')
  })

  it('rejects when the new password matches the current password', async () => {
    await expect(
      changePasswordSchema.validate({
        currentPassword: 'SamePassword1!',
        newPassword: 'SamePassword1!',
        confirmPassword: 'SamePassword1!',
      }),
    ).rejects.toThrow('New password must be different from current password')
  })

  it('rejects mismatched confirmation', async () => {
    await expect(
      changePasswordSchema.validate({
        ...valid,
        confirmPassword: 'OtherPassword1!',
      }),
    ).rejects.toThrow('Passwords must match')
  })
})

describe('SignUpSchema', () => {
  const valid = {
    firstName: 'Ada',
    lastName: "O'Brien-Obi",
    email: 'ada@acmeltd.com',
    password: 'Acme2025!',
    confirmPassword: 'Acme2025!',
  }

  it('accepts names with hyphens, apostrophes and accents', async () => {
    await expect(
      SignUpSchema.validate({ ...valid, firstName: 'Chloé' }),
    ).resolves.toBeTruthy()
    await expect(SignUpSchema.validate(valid)).resolves.toBeTruthy()
  })

  it('rejects the short passwords the backend refuses', async () => {
    await expect(
      SignUpSchema.validate({
        ...valid,
        password: 'Ab1!xy',
        confirmPassword: 'Ab1!xy',
      }),
    ).rejects.toThrow('Password must be between 8 and 72 characters')
  })

  it('rejects symbols the backend refuses', async () => {
    await expect(
      SignUpSchema.validate({
        ...valid,
        password: 'Acme2025^',
        confirmPassword: 'Acme2025^',
      }),
    ).rejects.toThrow(/one special character/)
  })

  it('accepts 72 characters and rejects 73', async () => {
    const at72 = `Ab1!${'a'.repeat(68)}`
    const at73 = `${at72}a`
    await expect(
      SignUpSchema.validate({
        ...valid,
        password: at72,
        confirmPassword: at72,
      }),
    ).resolves.toBeTruthy()
    await expect(
      SignUpSchema.validate({
        ...valid,
        password: at73,
        confirmPassword: at73,
      }),
    ).rejects.toThrow('Password must be between 8 and 72 characters')
  })

  it('rejects names made of symbols', async () => {
    await expect(
      SignUpSchema.validate({ ...valid, firstName: '123' }),
    ).rejects.toThrow(/First name can only use letters/)
  })
})
