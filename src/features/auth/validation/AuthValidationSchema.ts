import * as Yup from 'yup'

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from '@/utils/passwordRules'

const emailValidation = () => Yup.string().required('Email is required')

const NAME_PATTERN = /^\p{L}[\p{L}' -]*$/u

const nameValidation = (label: string) =>
  Yup.string()
    .trim()
    .required(`${label} is required`)
    .matches(
      NAME_PATTERN,
      `${label} can only use letters, spaces, hyphens and apostrophes`,
    )

const loginPasswordValidation = () =>
  Yup.string().required('Password is required')

export const loginSchema = Yup.object().shape({
  email: emailValidation(),
  password: loginPasswordValidation(),
})

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .required('Email is required')
    .email('Enter a valid email address'),
})

const lengthMessage = `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`

const newPasswordValidation = () =>
  Yup.string()
    .required('Password is required')
    .min(PASSWORD_MIN_LENGTH, lengthMessage)
    .max(PASSWORD_MAX_LENGTH, lengthMessage)
    .matches(
      PASSWORD_PATTERN,
      'Password must contain at least one number, one letter and one special character',
    )

export const resetPasswordSchema = Yup.object().shape({
  password: newPasswordValidation(),
  confirmPassword: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
})

export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: newPasswordValidation().test(
    'different-from-current',
    'New password must be different from current password',
    function (value) {
      return !value || value !== this.parent.currentPassword
    },
  ),
  confirmPassword: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
})

export const SignUpSchema = Yup.object().shape({
  firstName: nameValidation('First name'),
  lastName: nameValidation('Last name'),
  email: emailValidation().email('Enter a valid email address'),
  password: newPasswordValidation(),
  confirmPassword: Yup.string()
    .required('Confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
})
