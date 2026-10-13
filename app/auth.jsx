import { useEffect } from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { K } from '../constants/kenyaBrand'

/**
 * /auth — aligns with classic /auth route; forwards to /login with the same query params (e.g. ?role=vendor).
 * Expo Router project uses file-based routes instead of React Router.
 */
export default function AuthEntry() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const raw = params.role
  const role = Array.isArray(raw) ? raw[0] : raw

  useEffect(() => {
    router.replace({
      pathname: '/login',
      params: role ? { role } : {},
    })
  }, [router, role])

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={K.green} />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: K.sand },
})
