import 'react-responsive-modal/styles.css'

import React, { useEffect, useMemo, useState } from 'react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { Modal } from 'react-responsive-modal'

import { ColumnDef, DataTable } from '@/components'
import { TextInput } from '@/components/forms'
import { Button } from '@/components/ui/Button'
import { useRolesStore } from '@/features/admin/store/useRolesStore'
import { AdminRole } from '@/features/admin/types'
import { focusFieldByName } from '@/utils/focusField'

import styles from './Roles.module.scss'

interface RoleFormState {
  name: string
  description: string
}

const EMPTY_FORM: RoleFormState = { name: '', description: '' }

const Roles = () => {
  const { roles, isLoading, fetchRoles, createRole, updateRole, deleteRole } =
    useRolesStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null)
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    void fetchRoles()
  }, [fetchRoles])

  useEffect(() => {
    if (!isModalOpen) return
    const frame = window.requestAnimationFrame(() => {
      focusFieldByName('name')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isModalOpen])

  const openCreateModal = () => {
    setEditingRole(null)
    setForm(EMPTY_FORM)
    setNameError('')
    setIsModalOpen(true)
  }

  const openEditModal = (role: AdminRole) => {
    setEditingRole(role)
    setForm({ name: role.name, description: role.description ?? '' })
    setNameError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setNameError('Role name is required.')
      focusFieldByName('name')
      return
    }
    setNameError('')
    setIsSubmitting(true)
    const payload = {
      name: form.name,
      description: form.description || undefined,
    }
    const success = editingRole
      ? await updateRole(editingRole.id, payload)
      : await createRole(payload)
    setIsSubmitting(false)
    if (success) setIsModalOpen(false)
  }

  const handleDelete = async (role: AdminRole) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return
    await deleteRole(role.id)
  }

  const columns = useMemo<ColumnDef<AdminRole>[]>(
    () => [
      { key: 'name', header: 'Name', render: (role) => role.name },
      {
        key: 'description',
        header: 'Description',
        render: (role) => role.description ?? '—',
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (role) => (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Edit ${role.name}`}
              onClick={() => openEditModal(role)}>
              <FiEdit2 size={18} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Delete ${role.name}`}
              onClick={() => void handleDelete(role)}>
              <FiTrash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Roles</h2>
        <Button variant="primary" size="sm" onClick={openCreateModal}>
          Create Role
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        pageSize={10}
        isLoading={isLoading}
        getRowKey={(role) => role.id}
        ariaLabel="Roles table"
        showRowNumber
      />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        center
        classNames={{ overlay: 'dashboard-modal-overlay' }}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h3 className={styles.modalTitle}>
            {editingRole ? 'Edit Role' : 'Create Role'}
          </h3>
          <TextInput
            title="Name"
            label="role-name"
            name="name"
            autoComplete="off"
            required
            value={form.name}
            error={nameError}
            onChange={(event) => {
              setForm({ ...form, name: event.target.value })
              if (nameError) setNameError('')
            }}
          />
          <TextInput
            title="Description"
            label="role-description"
            name="description"
            autoComplete="off"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}>
            {editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default Roles
