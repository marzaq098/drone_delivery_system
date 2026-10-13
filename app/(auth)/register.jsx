import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import AuthPage from '../../components/AuthPage'
import { normalizeRole } from '../../lib/roleRouting'

export default function Register() {
  const { role } = useLocalSearchParams()
  return <AuthPage initialTab="register" initialRole={normalizeRole(role)} />
}
