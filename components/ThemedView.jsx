import { View, useColorScheme } from 'react-native'
import { Colors } from "../constants/Colors"
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ThemedView = ({style, children ,safe = true, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
  if (!safe) {
    return (   
    <View style={[{ backgroundColor: theme.background }, style]} {...props}>
      {children}
    </View>
  )
  }
  const insets = useSafeAreaInsets()
  return (
    <View style={[{ 
      backgroundColor: theme.background,
      paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right
     }, style]} {...props}>
      {children}
    </View>
  )
  
}

export default ThemedView