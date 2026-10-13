/**
 * Mock groceries + pharmacy catalog for Quantum Drop Drone (customer shop).
 * Cart products use ids `g:*` and `p:*` to avoid collisions with food `r:*:key`.
 */

export const GROCERY_META = {
  name: 'QDD Fresh Hub',
  deliveryFee: 140,
  droneEtaMins: 22,
}

export const PHARMACY_META = {
  name: 'QuantumCare Pharmacy',
  deliveryFee: 160,
  droneEtaMins: 25,
}

export const GROCERY_AISLES = [
  'All',
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Snacks',
  'Beverages',
  'Household',
]

export const PHARMACY_CATEGORIES = ['All', 'Pain relief', 'Cold & flu', 'Vitamins', 'First aid']

/** @typedef {{ id: string, name: string, price: number, image: string, aisle: string, weightKg: number, isDeal?: boolean, dealLabel?: string }} GrocerySku */

/** @type {GrocerySku[]} */
export const MOCK_GROCERY_PRODUCTS = [
  {
    id: 'gv1',
    name: 'Hydroponic lettuce mix',
    price: 320,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
    aisle: 'Fruits & Vegetables',
    weightKg: 0.35,
  },
  {
    id: 'gv2',
    name: 'Avocado (2 pack)',
    price: 180,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f84d1142?w=400&h=300&fit=crop',
    aisle: 'Fruits & Vegetables',
    weightKg: 0.4,
  },
  {
    id: 'dy1',
    name: 'Farm yoghurt 500ml',
    price: 210,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    aisle: 'Dairy & Eggs',
    weightKg: 0.55,
  },
  {
    id: 'dy2',
    name: 'Free-range eggs ×6',
    price: 240,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop',
    aisle: 'Dairy & Eggs',
    weightKg: 0.4,
  },
  {
    id: 'sn1',
    name: 'Trail mix pouch',
    price: 290,
    image: 'https://images.unsplash.com/photo-1599599815769-0b8b7b543fdf?w=400&h=300&fit=crop',
    aisle: 'Snacks',
    weightKg: 0.25,
    isDeal: true,
    dealLabel: '−15%',
  },
  {
    id: 'bv1',
    name: 'Sparkling water 6-pack',
    price: 450,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
    aisle: 'Beverages',
    weightKg: 2.1,
  },
  {
    id: 'hh1',
    name: 'Eco dish soap',
    price: 380,
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=300&fit=crop',
    aisle: 'Household',
    weightKg: 0.9,
  },
]

/** Popular + deals derived in UI; buy-again references product ids */
export const MOCK_BUY_AGAIN_IDS = ['gv1', 'dy1', 'sn1']

/** @typedef {{ id: string, name: string, price: number, image: string, category: string, requiresPrescription: boolean, description: string, safetyNote: string }} PharmaSku */

/** @type {PharmaSku[]} */
export const MOCK_PHARMACY_PRODUCTS = [
  {
    id: 'pp1',
    name: 'Paracetamol 500mg',
    price: 120,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
    category: 'Pain relief',
    requiresPrescription: false,
    description: 'Tablets for mild pain and fever. Follow pack directions.',
    safetyNote: 'Consult a doctor before use if you have liver disease.',
  },
  {
    id: 'pp2',
    name: 'Ibuprofen gel',
    price: 560,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop',
    category: 'Pain relief',
    requiresPrescription: true,
    description: 'Topical anti-inflammatory — pharmacy verification required.',
    safetyNote: 'Rx required. Do not combine with oral NSAIDs without advice.',
  },
  {
    id: 'cf1',
    name: 'Vitamin C effervescent',
    price: 340,
    image: 'https://images.unsplash.com/photo-1550572017-4c772ebe7290?w=400&h=300&fit=crop',
    category: 'Cold & flu',
    requiresPrescription: false,
    description: 'Immune support supplement.',
    safetyNote: 'Consult a doctor before use if pregnant or on medication.',
  },
  {
    id: 'cf2',
    name: 'Cough syrup (codeine)',
    price: 890,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
    category: 'Cold & flu',
    requiresPrescription: true,
    description: 'Controlled formula — prescription upload mandatory.',
    safetyNote: 'Rx required. May cause drowsiness. Do not drive.',
  },
  {
    id: 'vt1',
    name: 'Multivitamin 60s',
    price: 720,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    category: 'Vitamins',
    requiresPrescription: false,
    description: 'Daily micronutrients.',
    safetyNote: 'Food supplement — not a substitute for a balanced diet.',
  },
  {
    id: 'fa1',
    name: 'Sterile bandage pack',
    price: 260,
    image: 'https://images.unsplash.com/photo-1603398938378-e6eabf6f31f6?w=400&h=300&fit=crop',
    category: 'First aid',
    requiresPrescription: false,
    description: 'Assorted sizes for minor cuts.',
    safetyNote: 'Seek medical help for deep wounds or infection signs.',
  },
]

export function toGroceryProduct(sku) {
  return {
    id: `g:${sku.id}`,
    name: sku.name,
    price: sku.price,
    image: sku.image,
    category: 'Groceries',
    isDarkStore: false,
    storeType: 'grocery',
    groceryStoreName: GROCERY_META.name,
    deliveryFee: GROCERY_META.deliveryFee,
    droneEtaMins: GROCERY_META.droneEtaMins,
    weightKg: sku.weightKg,
    aisle: sku.aisle,
    isDeal: sku.isDeal,
    dealLabel: sku.dealLabel,
  }
}

export function toPharmacyProduct(sku) {
  return {
    id: `p:${sku.id}`,
    name: sku.name,
    price: sku.price,
    image: sku.image,
    category: 'Pharmacy',
    isDarkStore: true,
    storeType: 'pharmacy',
    pharmacyName: PHARMACY_META.name,
    deliveryFee: PHARMACY_META.deliveryFee,
    droneEtaMins: PHARMACY_META.droneEtaMins,
    requiresPrescription: sku.requiresPrescription,
    description: sku.description,
    safetyNote: sku.safetyNote,
    pharmaCategory: sku.category,
  }
}
