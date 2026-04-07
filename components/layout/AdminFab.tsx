'use client'

import { useEffect, useState } from 'react'
import AdminFabButton from './AdminFabButton'

export default function AdminFab() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((data) => setIsAdmin(Boolean(data?.isAdmin)))
      .catch(() => setIsAdmin(false))
  }, [])

  if (!isAdmin) return null
  return <AdminFabButton />
}
