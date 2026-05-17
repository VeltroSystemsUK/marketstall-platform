import type { Timestamp } from "firebase/firestore";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

export interface User {
  id: string;
  role: "consumer" | "producer" | "admin";
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
  favourites: string[];
  createdAt: Timestamp | Date;
}

export interface Producer {
  id: string;
  userId: string;
  name: string;
  slug: string;
  bio: string;
  story?: string;
  location: string;
  address: Address;
  categories: string[];
  images: { banner: string; logo: string };
  stripeConnectId?: string;
  status: "pending" | "approved" | "suspended";
  commissionRate: number;
  fulfilmentOptions: ("ship" | "collect" | "consolidate")[];
  socialLinks?: { instagram?: string; facebook?: string; website?: string };
  rating?: number;
  reviewCount?: number;
  createdAt: Timestamp | Date;
}

export interface Product {
  id: string;
  producerId: string;
  producerName?: string;
  producerSlug?: string;
  name: string;
  description: string;
  slug: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  dietary: string[];
  allergens: string[];
  seasonal: boolean;
  available: boolean;
  featured?: boolean;
  createdAt: Timestamp | Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  producerId: string;
  producerName: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  consumerId: string;
  consumerName?: string;
  items: OrderItem[];
  producerIds: string[];
  status:
    | "pending"
    | "confirmed"
    | "packed"
    | "dispatched"
    | "delivered"
    | "cancelled";
  fulfilmentMethod: "delivery" | "collection";
  deliveryAddress?: Address;
  collectionPoint?: string;
  subtotal: number;
  commission: number;
  deliveryFee: number;
  total: number;
  stripePaymentIntentId?: string;
  notes?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Review {
  id: string;
  orderId: string;
  consumerId: string;
  consumerName: string;
  producerId: string;
  productId?: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | Date;
}

export interface Subscription {
  id: string;
  consumerId: string;
  items: { productId: string; quantity: number }[];
  frequency: "weekly" | "fortnightly" | "monthly";
  nextDelivery: Timestamp | Date;
  status: "active" | "paused" | "cancelled";
  deliveryAddress: Address;
  createdAt: Timestamp | Date;
}

export interface BasketItem {
  product: Product;
  quantity: number;
}

export const CATEGORIES = [
  { id: "vegetables", label: "Vegetables", emoji: "🥦" },
  { id: "fruit", label: "Fruit", emoji: "🍎" },
  { id: "dairy", label: "Dairy & Eggs", emoji: "🥛" },
  { id: "meat", label: "Meat & Poultry", emoji: "🥩" },
  { id: "bakery", label: "Bakery", emoji: "🍞" },
  { id: "preserves", label: "Preserves & Jams", emoji: "🫙" },
  { id: "drinks", label: "Drinks", emoji: "🍵" },
  { id: "plants", label: "Plants & Flowers", emoji: "🌱" },
  { id: "honey", label: "Honey & Bee Products", emoji: "🍯" },
  { id: "other", label: "Other", emoji: "🌾" },
] as const;

export const DIETARY_FLAGS = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "dairy-free",
  "organic",
  "free-range",
  "nut-free",
] as const;

export const ORDER_STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
