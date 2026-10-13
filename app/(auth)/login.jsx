import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import AuthPage from '../../components/AuthPage'
import { normalizeRole } from '../../lib/roleRouting'

export default function Login() {
  const { role } = useLocalSearchParams()
  return <AuthPage initialTab="login" initialRole={normalizeRole(role)} />
}
