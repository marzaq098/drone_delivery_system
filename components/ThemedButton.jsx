import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Colors } from "../constants/Colors"

function ThemedButton({ style, children, ...props }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.Pressed, style]}
      {...props}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 5,
        marginTop: 20
    },
    Pressed: {
        opacity: 0.8,
    }
})

export default ThemedButton
