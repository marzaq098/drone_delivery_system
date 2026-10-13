/**
 * Mock restaurants + menus for Glovo-style food flow (Quantum Drop Drone theme in UI).
 * Cart line items use `product.id` = `${restaurantId}:${itemKey}` for uniqueness.
 */

export const FOOD_CUISINES = ['Fast Food', 'Pizza', 'Drinks', 'Local Food']

export const MOCK_RESTAURANTS = [
  {
    id: 'r-skyline',
    name: 'Skyline Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
    rating: 4.7,
    deliveryMins: 18,
    deliveryFee: 120,
    cuisines: ['Fast Food'],
    menu: [
      {
        title: 'Burgers',
        items: [
          {
            key: 'b1',
            name: 'Quantum Smash Burger',
            description: 'Double patty, neon slaw',
            price: 890,
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
          },
          {
            key: 'b2',
            name: 'Aero Chicken Burger',
            description: 'Crispy, herb mayo',
            price: 750,
            image: 'https://images.unsplash.com/photo-1606755962773-d324e788a873?w=400&h=300&fit=crop',
          },
        ],
      },
      {
        title: 'Sides',
        items: [
          {
            key: 's1',
            name: 'Orbit Fries',
            description: 'Truffle salt',
            price: 320,
            image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
          },
        ],
      },
    ],
  },
  {
    id: 'r-nebula',
    name: 'Nebula Pizza Lab',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop',
    rating: 4.5,
    deliveryMins: 22,
    deliveryFee: 150,
    cuisines: ['Pizza'],
    menu: [
      {
        title: 'Pizza',
        items: [
          {
            key: 'p1',
            name: 'Ion Pepperoni',
            description: 'Wood-fired, drone-hot',
            price: 1180,
            image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
          },
          {
            key: 'p2',
            name: 'Veggie Aurora',
            description: 'Peppers, rocket, mozzarella',
            price: 1050,
            image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop',
          },
        ],
      },
      {
        title: 'Drinks',
        items: [
          {
            key: 'd1',
            name: 'Citrus Spark',
            description: 'Chilled 500ml',
            price: 180,
            image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
          },
        ],
      },
    ],
  },
  {
    id: 'r-orbit',
    name: 'Orbit Juices',
    image: 'https://images.unsplash.com/photo-1546173159-3152a2a2fcbc?w=600&h=400&fit=crop',
    rating: 4.8,
    deliveryMins: 14,
    deliveryFee: 100,
    cuisines: ['Drinks'],
    menu: [
      {
        title: 'Cold Press',
        items: [
          {
            key: 'j1',
            name: 'Mango Pulse',
            description: 'No added sugar',
            price: 260,
            image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop',
          },
          {
            key: 'j2',
            name: 'Berry Flux',
            description: 'Mixed berries',
            price: 280,
            image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&h=300&fit=crop',
          },
        ],
      },
    ],
  },
  {
    id: 'r-mama',
    name: 'Mama K’s Kitchen',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop',
    rating: 4.6,
    deliveryMins: 25,
    deliveryFee: 130,
    cuisines: ['Local Food'],
    menu: [
      {
        title: 'Plates',
        items: [
          {
            key: 'l1',
            name: 'Nyama Choma Box',
            description: 'Kachumbari, ugali side',
            price: 950,
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
          },
          {
            key: 'l2',
            name: 'Coastal Curry',
            description: 'Coconut rice',
            price: 880,
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
          },
        ],
      },
    ],
  },
]

/** @param {typeof MOCK_RESTAURANTS[0]} restaurant */
export function menuItemToProduct(restaurant, item) {
  return {
    id: `${restaurant.id}:${item.key}`,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
    category: 'Food',
    isDarkStore: false,
    storeType: 'food',
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    deliveryFee: restaurant.deliveryFee,
  }
}

export function getRestaurantById(id) {
  return MOCK_RESTAURANTS.find((r) => r.id === id) ?? null
}
