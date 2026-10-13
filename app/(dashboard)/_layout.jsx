import React, { useMemo } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Tabs } from 'expo-router'
import { Colors } from '../../constants/Colors'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRole } from '../../context/RoleContext'

export default function DashboardLayout() {
  const colorScheme = useColorScheme()
  const theme = (colorScheme ? Colors[colorScheme] : null) ?? Colors.light
  const { role, ready } = useRole()

  const initialRouteName = useMemo(() => {
    if (role === 'vendor') return 'vendor'
    if (role === 'fleet') return 'fleet'
    return 'dashboard'
  }, [role])

  const isCustomer = !role || role === 'customer'
  const isVendor = role === 'vendor'
  const isFleet = role === 'fleet'

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <Tabs
      initialRouteName={initialRouteName}
      screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.iconColorFocused,
          tabBarInactiveTintColor: theme.iconColor,
          tabBarStyle: {
            backgroundColor: theme.navBackground,
            paddingTop: 10,
            paddingBottom: 10,
            height: 90,
          },
        }}
    >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Shop',
            href: isCustomer ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="order"
          options={{
            title: 'Orders',
            href: isCustomer ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tracking"
          options={{
            title: 'Tracking',
            href: isCustomer ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="location" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vendor"
          options={{
            title: 'Vendor',
            href: isVendor ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="fleet"
          options={{
            title: 'Fleet',
            href: isFleet ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="airplane" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            href: undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" size={size} color={color} />
            ),
          }}
        />
    </Tabs>
  )
}
