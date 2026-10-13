import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { K } from '../constants/kenyaBrand'
import { useRole } from '../context/RoleContext'
import { normalizeRole, routeForRole } from '../lib/roleRouting'
import { loginApi, registerApi } from '../api/auth'
import { setAuthToken } from '../lib/authSession'

const ROLE_LABEL = {
  customer: 'Customer',
  vendor: 'Vendor',
  fleet: 'Fleet Manager',
}

const C = {
  cyan500: K.green,
  cyan600: K.green,
  indigo600: K.black,
  slate50: '#f8fafc',
  slate100: K.sand,
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: K.black,
  emerald600: '#059669',
  rose600: K.red,
  white: '#ffffff',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function TabBar({ activeTab, onChange }) {
  return (
    <View style={styles.tabRow}>
      <Pressable
        onPress={() => onChange('login')}
        style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'login' }}
      >
        <Text style={[styles.tabLabel, activeTab === 'login' && styles.tabLabelActive]}>
          Login
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('register')}
        style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'register' }}
      >
        <Text style={[styles.tabLabel, activeTab === 'register' && styles.tabLabelActive]}>
          Register
        </Text>
      </Pressable>
    </View>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return <Text style={styles.fieldError}>{message}</Text>
}

export default function AuthPage({ initialTab = 'login', initialRole = 'customer' }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const cardMaxWidth = Math.max(280, Math.min(420, width - 32))
  const { setRole: saveSessionRole } = useRole()

  const [activeTab, setActiveTab] = useState(initialTab === 'register' ? 'register' : 'login')

  useEffect(() => {
    setActiveTab(initialTab === 'register' ? 'register' : 'login')
  }, [initialTab])

  const [selectedRole, setSelectedRole] = useState(() => normalizeRole(initialRole))
  useEffect(() => {
    setSelectedRole(normalizeRole(initialRole))
  }, [initialRole])

  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const clearErrors = useCallback(() => {
    setErrors({})
    setSuccessMessage(null)
  }, [])

  const validateLogin = () => {
    const next = {}
    if (!loginData.email.trim()) next.loginEmail = 'Email is required'
    else if (!emailRegex.test(loginData.email.trim())) next.loginEmail = 'Enter a valid email'
    if (!loginData.password) next.loginPassword = 'Password is required'
    return next
  }

  const validateRegister = () => {
    const next = {}
    if (!registerData.fullName.trim()) next.regFullName = 'Full name is required'
    if (!registerData.email.trim()) next.regEmail = 'Email is required'
    else if (!emailRegex.test(registerData.email.trim())) next.regEmail = 'Enter a valid email'
    if (!registerData.password) next.regPassword = 'Password is required'
    else if (registerData.password.length < 6) next.regPassword = 'Use at least 6 characters'
    if (!registerData.confirmPassword) next.regConfirm = 'Confirm your password'
    else if (registerData.password !== registerData.confirmPassword) next.regConfirm = 'Passwords do not match'
    return next
  }

  const handleLogin = async () => {
    clearErrors()
    const v = validateLogin()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }
    setLoading(true)
    try {
      const response = await loginApi({
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password,
        role: selectedRole,
      })
      if (response?.token) {
        await setAuthToken(response.token, response.user || null)
      }
      await saveSessionRole(selectedRole)
      setSuccessMessage('Signed in successfully. Welcome back!')
      setTimeout(() => {
        router.replace(routeForRole(selectedRole))
      }, 900)
    } catch (e) {
      setErrors({ loginPassword: e.message || 'Login failed. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    clearErrors()
    const v = validateRegister()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }
    setLoading(true)
    try {
      const response = await registerApi({
        fullName: registerData.fullName.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
        role: selectedRole,
      })
      if (response?.token) {
        await setAuthToken(response.token, response.user || null)
      }
      await saveSessionRole(selectedRole)
      setSuccessMessage('Account created. Redirecting…')
      setTimeout(() => {
        router.replace(routeForRole(selectedRole))
      }, 900)
    } catch (e) {
      setErrors({ regEmail: e.message || 'Registration failed. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={[styles.card, { width: cardMaxWidth, maxWidth: '100%' }]}>
            <Pressable
              style={styles.backLanding}
              onPress={() => router.replace('/')}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel="Back to role selection"
            >
              <Ionicons name="arrow-back" size={20} color={K.green} />
              <Text style={styles.backLandingText}>Roles · Home</Text>
            </Pressable>

            <View style={styles.brandRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoEmoji}>✈</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>Quantum Drop Drone</Text>
                <Text style={styles.brandTag}>Nairobi · Aerial delivery · M-Pesa checkout</Text>
              </View>
            </View>

            <View style={styles.roleBanner}>
              <Ionicons name="person-circle-outline" size={22} color={K.green} />
              <View style={styles.roleBannerTextWrap}>
                <Text style={styles.roleBannerTitle}>
                  {activeTab === 'login' ? 'Login' : 'Register'} as {ROLE_LABEL[selectedRole]}
                </Text>
                <Text style={styles.roleBannerSub}>
                  Role and auth token are saved on this device after sign-in.
                </Text>
              </View>
            </View>

            <TabBar activeTab={activeTab} onChange={setActiveTab} />

            {successMessage ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color={C.emerald600} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {activeTab === 'login' ? (
              <View style={styles.formBlock}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={C.slate400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={loginData.email}
                  onChangeText={(t) => setLoginData((s) => ({ ...s, email: t }))}
                  editable={!loading}
                />
                <FieldError message={errors.loginEmail} />

                <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.inputPassword}
                    placeholder="••••••••"
                    placeholderTextColor={C.slate400}
                    secureTextEntry={!showLoginPassword}
                    value={loginData.password}
                    onChangeText={(t) => setLoginData((s) => ({ ...s, password: t }))}
                    editable={!loading}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowLoginPassword((v) => !v)}
                    hitSlop={8}
                    accessibilityLabel={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={C.slate500}
                    />
                  </Pressable>
                </View>
                <FieldError message={errors.loginPassword} />

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, loading && styles.btnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Login</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.linkRow}
                  onPress={() => {
                    clearErrors()
                    setActiveTab('register')
                  }}
                  disabled={loading}
                >
                  <Text style={styles.linkMuted}>No account? </Text>
                  <Text style={styles.linkStrong}>Register</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.formBlock}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Wanjiku Kamau"
                  placeholderTextColor={C.slate400}
                  value={registerData.fullName}
                  onChangeText={(t) => setRegisterData((s) => ({ ...s, fullName: t }))}
                  editable={!loading}
                />
                <FieldError message={errors.regFullName} />

                <Text style={[styles.label, styles.labelSpaced]}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={C.slate400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={registerData.email}
                  onChangeText={(t) => setRegisterData((s) => ({ ...s, email: t }))}
                  editable={!loading}
                />
                <FieldError message={errors.regEmail} />

                <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.inputPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor={C.slate400}
                    secureTextEntry={!showRegPassword}
                    value={registerData.password}
                    onChangeText={(t) => setRegisterData((s) => ({ ...s, password: t }))}
                    editable={!loading}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowRegPassword((v) => !v)}
                    hitSlop={8}
                    accessibilityLabel={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={C.slate500}
                    />
                  </Pressable>
                </View>
                <FieldError message={errors.regPassword} />

                <Text style={[styles.label, styles.labelSpaced]}>Confirm password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.inputPassword}
                    placeholder="Repeat password"
                    placeholderTextColor={C.slate400}
                    secureTextEntry={!showRegConfirm}
                    value={registerData.confirmPassword}
                    onChangeText={(t) => setRegisterData((s) => ({ ...s, confirmPassword: t }))}
                    editable={!loading}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowRegConfirm((v) => !v)}
                    hitSlop={8}
                    accessibilityLabel={showRegConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <Ionicons
                      name={showRegConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={C.slate500}
                    />
                  </Pressable>
                </View>
                <FieldError message={errors.regConfirm} />

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, loading && styles.btnDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Sign up</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.linkRow}
                  onPress={() => {
                    clearErrors()
                    setActiveTab('login')
                  }}
                  disabled={loading}
                >
                  <Text style={styles.linkMuted}>Already have an account? </Text>
                  <Text style={styles.linkStrong}>Login</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.slate100,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backLanding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backLandingText: {
    fontSize: 14,
    fontWeight: '700',
    color: K.green,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: K.greenMuted,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    marginBottom: 18,
  },
  roleBannerTextWrap: { flex: 1 },
  roleBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.slate900,
  },
  roleBannerSub: {
    marginTop: 4,
    fontSize: 12,
    color: C.slate600,
    lineHeight: 16,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.slate200,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.cyan600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 24 },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.slate900,
    letterSpacing: -0.3,
  },
  brandTag: {
    marginTop: 2,
    fontSize: 13,
    color: C.slate500,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: C.slate100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: C.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.slate500,
  },
  tabLabelActive: {
    color: C.cyan600,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: C.emerald600,
    fontWeight: '500',
  },
  formBlock: {},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.slate800,
    marginBottom: 6,
  },
  labelSpaced: {
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: C.slate900,
    backgroundColor: C.slate50,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    backgroundColor: C.slate50,
    paddingRight: 8,
  },
  inputPassword: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: C.slate900,
  },
  eyeBtn: {
    padding: 6,
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    color: C.rose600,
    fontWeight: '500',
  },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: C.cyan600,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.92,
  },
  linkRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  linkMuted: {
    fontSize: 14,
    color: C.slate500,
  },
  linkStrong: {
    fontSize: 14,
    fontWeight: '700',
    color: C.cyan600,
  },
})
