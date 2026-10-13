import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import React from "react";
import { Colors } from "../constants/Colors";
import { StatusBar } from "expo-status-bar";
import { RoleProvider } from "../context/RoleContext";
import { CartProvider } from "../context/CartContext";

const RootLayout = () => {
  const colorScheme = useColorScheme();
  // Defensive fallback: if Colors is undefined, use a minimal theme
  const baseColors = Colors ?? { light: { navBackground: "#fff", title: "#000" }, dark: { navBackground: "#000", title: "#fff" } };
  const theme = (colorScheme && baseColors[colorScheme]) ?? baseColors.light;

  return (
    <RoleProvider>
      <CartProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.navBackground },
            headerTintColor: theme.title,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="(dashboard)" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="index" options={{ headerShown: false, title: 'Quantum Drop' }} />
          <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="restaurant/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
      </CartProvider>
    </RoleProvider>
  )
};

export default RootLayout;
