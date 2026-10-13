import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as AuthSession from '../lib/authSession'

/** @typedef {'customer' | 'vendor' | 'fleet'} UserRole */

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(/** @type {UserRole | null} */ (null))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    AuthSession.getAuthSession().then(({ role: r, isLoggedIn }) => {
      if (cancelled) return
      if (isLoggedIn && r) setRoleState(r)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setRole = useCallback(async (/** @type {UserRole} */ r) => {
    setRoleState(r)
    await AuthSession.setAuthSession(r)
  }, [])

  const clearRole = useCallback(async () => {
    setRoleState(null)
    await AuthSession.clearAuthSession()
  }, [])

  const value = useMemo(
    () => ({ role, setRole, clearRole, ready }),
    [role, setRole, clearRole, ready]
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) {
    throw new Error('useRole must be used within RoleProvider')
  }
  return ctx
}
