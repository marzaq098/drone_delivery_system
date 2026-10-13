import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY_ROLE = '@qdd/role'
const KEY_SESSION = '@qdd/session'
const KEY_TOKEN = '@qdd/token'
const KEY_USER = '@qdd/user'

/** @typedef {'customer' | 'vendor' | 'fleet'} UserRole */

/**
 * Persist login + role (localStorage equivalent on native; works on web via AsyncStorage polyfill).
 * @param {UserRole} role
 */
export async function setAuthSession(role) {
  await AsyncStorage.multiSet([
    [KEY_ROLE, role],
    [KEY_SESSION, '1'],
  ])
}

export async function setAuthToken(token, user = null) {
  const pairs = [[KEY_TOKEN, token || '']]
  if (user) pairs.push([KEY_USER, JSON.stringify(user)])
  await AsyncStorage.multiSet(pairs)
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([KEY_ROLE, KEY_SESSION, KEY_TOKEN, KEY_USER])
}

/**
 * @returns {{ role: UserRole | null, isLoggedIn: boolean }}
 */
export async function getAuthSession() {
  const [[, role], [, session], [, token], [, rawUser]] = await AsyncStorage.multiGet([
    KEY_ROLE,
    KEY_SESSION,
    KEY_TOKEN,
    KEY_USER,
  ])
  const valid = role === 'customer' || role === 'vendor' || role === 'fleet'
  let user = null
  if (rawUser) {
    try {
      user = JSON.parse(rawUser)
    } catch {
      user = null
    }
  }
  return {
    role: valid ? role : null,
    isLoggedIn: session === '1' && valid,
    token: token || '',
    user,
  }
}
