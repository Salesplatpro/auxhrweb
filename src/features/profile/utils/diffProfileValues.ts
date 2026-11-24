import { ProfileFormValues, ProfilePatchPayload } from '../types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Picked roles are ids; roles the talent typed are names the server finds or creates. */
export const splitRoleValues = (values: string[]) => ({
  roleIds: values.filter((value) => UUID.test(value)),
  newRoles: values.filter((value) => !UUID.test(value)),
})

/** Returns only the fields that changed between `initial` and `current`, shaped for PATCH /v1/user/me. */
export const diffProfileValues = (
  initial: ProfileFormValues,
  current: ProfileFormValues,
): Partial<ProfilePatchPayload> => {
  const patch: Partial<ProfilePatchPayload> = {}

  if (current.bio !== initial.bio) patch.bio = current.bio
  if (current.experience !== initial.experience) {
    patch.experience = current.experience
  }
  if (current.minSalary !== initial.minSalary) {
    patch.minSalary = current.minSalary ? Number(current.minSalary) : undefined
  }
  if (current.maxSalary !== initial.maxSalary) {
    patch.maxSalary = current.maxSalary ? Number(current.maxSalary) : undefined
  }
  if (current.currency !== initial.currency) {
    patch.currency = current.currency
  }
  if (current.compensationPeriod !== initial.compensationPeriod) {
    patch.compensationPeriod = current.compensationPeriod
  }
  const roleChanged =
    current.role.length !== initial.role.length ||
    current.role.some((role) => !initial.role.includes(role))

  if (roleChanged) {
    const { roleIds, newRoles } = splitRoleValues(current.role)
    patch.roleIds = roleIds
    if (newRoles.length > 0) patch.newRoles = newRoles
  }

  const workTypeChanged =
    current.workType.length !== initial.workType.length ||
    current.workType.some((type) => !initial.workType.includes(type))

  if (workTypeChanged) patch.workType = current.workType

  const locationChanged =
    current.location.country.name !== initial.location.country.name ||
    current.location.state.name !== initial.location.state.name ||
    current.location.city.name !== initial.location.city.name

  if (locationChanged) {
    patch.locationCountry = current.location.country.name
    patch.locationState = current.location.state.name
    patch.locationCity = current.location.city.name
  }

  return patch
}
