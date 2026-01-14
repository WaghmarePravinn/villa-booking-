
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export enum AppTheme {
  REPUBLIC_DAY = 'REPUBLIC_DAY',
  HOLI = 'HOLI',
  DIWALI = 'DIWALI',
  INDEPENDENCE_DAY = 'INDEPENDENCE_DAY',
  SUMMER = 'SUMMER',
  WINTER = 'WINTER',
  DEFAULT = 'DEFAULT'
}

export interface SiteSettings {
  activeTheme: AppTheme;
  promoText: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
}

export interface Villa {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  description: string;
  longDescription?: string;
  imageUrls: string[]; 
  videoUrls: string[]; 
  amenities: string[];
  includedServices: string[];
  isFeatured: boolean;
  rating: number;
  ratingCount: number;
  numRooms: number;
  mealsAvailable: boolean;
  petFriendly: boolean;
  refundPolicy: string;
}

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  avatar: string;
  category: 'Trip' | 'Booking' | 'Food' | 'Service' | 'Hospitality';
  timestamp?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface VillaFilters {
  location: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export interface Lead {
  id: string;
  villaId: string;
  villaName: string;
  timestamp: string;
  status: 'new' | 'contacted' | 'booked' | 'lost';
  source: 'WhatsApp' | 'Direct Inquiry';
  userId?: string;
  customerName?: string;
  checkIn?: string;
  checkOut?: string;
}
