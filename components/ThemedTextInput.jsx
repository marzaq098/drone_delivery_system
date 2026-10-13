import {TextInput, useColorScheme  } from 'react-native'
import React from 'react'
import { Colors } from '../constants/Colors'

const ThemedTextInput = ({ style, ...props }) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;
  return (
    <TextInput style={[{
        
        
        padding: 20,
        borderRadius: 5,
        color: theme.text,
        backgroundColor: theme.uiBackground,
    }, style]}
    placeholderTextColor={theme.text + '80'}
    {...props}
    />
  )
}

export default ThemedTextInput
