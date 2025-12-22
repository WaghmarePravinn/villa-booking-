
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
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
  imageUrl: string;
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
