import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import RestaurantPage from '../../components/RestaurantPage'

export default function RestaurantRoute() {
  const { id } = useLocalSearchParams()
  const rid = Array.isArray(id) ? id[0] : id
  return <RestaurantPage restaurantId={rid} />
}
