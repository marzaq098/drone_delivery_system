import { Image, useColorScheme } from 'react-native'
import React from 'react'
//image import here
import DarkLogo from '../assets/img/drone.png'
import LightLogo from '../assets/img/drone.png'

const ThemedLogo = ({ ...props }) => {
    const colorScheme = useColorScheme()
    const logo = colorScheme === 'dark' ? DarkLogo : LightLogo
  return (
    <Image source={logo} {...props} />
  )
}

export default ThemedLogo
