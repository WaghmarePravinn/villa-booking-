
import { Villa, Testimonial, Service } from './types';

export const BRAND_NAME = "Peak Stay Destination";
export const CONTACT_EMAIL = "peakstaydestination@gmail.com";
export const WHATSAPP_NUMBER = "+919157928471";

export const HOTSPOT_LOCATIONS = [
  { name: "Lonavala", count: 12, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=400" },
  { name: "Karjat", count: 8, image: "https://images.unsplash.com/photo-1593073830229-3a2ce9bad277?auto=format&fit=crop&q=80&w=400" },
  { name: "Khopoli", count: 5, image: "https://images.unsplash.com/photo-1618140052121-39fc6db33972?auto=format&fit=crop&q=80&w=400" },
  { name: "Goa", count: 25, image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=400" },
  { name: "Konkan", count: 10, image: "https://images.unsplash.com/photo-1621334185523-281512e09477?auto=format&fit=crop&q=80&w=400" },
  { name: "Diveagar", count: 4, image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400" }
];

export const INITIAL_VILLAS: Villa[] = [
  {
    id: 'v6',
    name: "Villa Aarti 2BHK Anjuna",
    location: "Anjuna, Goa",
    pricePerNight: 28500,
    bedrooms: 2,
    bathrooms: 2,
    capacity: 6,
    description: "Chic 2BHK sanctuary with a private pool and contemporary white-brick interiors.",
    longDescription: "Villa Aarti is a masterclass in modern coastal living. Located in the heart of Anjuna, it features stunning white brick walls, designer patterned flooring, and a private azure pool. Each bedroom is designed with minimalist elegance, featuring plush four-poster beds or modern benches. The villa includes a fully equipped modular kitchen and exquisite bathrooms with premium copper fixtures and artisanal tiling.",
    imageUrl: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&q=80&w=1200",
    amenities: ["Private Pool", "Wi-Fi", "AC", "Modern Kitchen", "In-unit Laundry", "Four-poster Beds"],
    includedServices: ["Daily Housekeeping", "Personal Concierge", "Welcome Drinks"],
    isFeatured: true,
    rating: 4.9,
    ratingCount: 18,
    numRooms: 2,
    mealsAvailable: true,
    petFriendly: true,
    refundPolicy: "Full refund if cancelled 7 days before check-in."
  },
  {
    id: '1',
    name: "Lazy Daze 3BHK",
    location: "Lonavala, Maharashtra",
    pricePerNight: 53495,
    bedrooms: 3,
    bathrooms: 4,
    capacity: 12,
    description: "A serene getaway with sprawling lawns and a private pool.",
    longDescription: "Lazy Daze is the ultimate luxury retreat for large groups. Featuring massive lawns perfect for outdoor activities, a sparkling private pool, and staff that caters to your every need. The villa is designed with high ceilings and large windows to let in the beautiful Lonavala mist.",
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200",
    amenities: ["Private Pool", "Lawn", "Wi-Fi", "AC", "TV", "In-home Chef"],
    includedServices: ["Daily Cleaning", "Evening Turn-down", "Butler Service"],
    isFeatured: true,
    rating: 5,
    ratingCount: 29,
    numRooms: 3,
    mealsAvailable: true,
    petFriendly: true,
    refundPolicy: "Full refund if cancelled 48 hours before check-in."
  },
  {
    id: 'v10',
    name: "The Riverstone 4BHK",
    location: "Karjat, Maharashtra",
    pricePerNight: 42000,
    bedrooms: 4,
    bathrooms: 4,
    capacity: 14,
    description: "Industrial chic meets rustic charm right by the Pej river.",
    longDescription: "Located on the banks of the Pej river, Riverstone is a stunning 4BHK industrial-style villa. It features floor-to-ceiling windows, a riverside pool, and a massive terrace for sundowners. The property is surrounded by dense greenery and offers a truly secluded experience.",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    amenities: ["Riverside View", "Infinity Pool", "Billiard Table", "Barbecue", "AC"],
    includedServices: ["Riverside Breakfast", "Kayak Access", "Evening Bonfire"],
    isFeatured: true,
    rating: 4.8,
    ratingCount: 22,
    numRooms: 4,
    mealsAvailable: true,
    petFriendly: true,
    refundPolicy: "50% refund if cancelled 10 days before."
  },
  {
    id: 'v11',
    name: "Imagica Retreat 3BHK",
    location: "Khopoli, Maharashtra",
    pricePerNight: 35000,
    bedrooms: 3,
    bathrooms: 3,
    capacity: 10,
    description: "Modern villa just minutes away from Imagica Theme Park.",
    longDescription: "Ideal for families visiting Imagica, this 3BHK retreat offers contemporary comforts and a private plunge pool. The villa is designed for fun, with a dedicated kids' corner and a state-of-the-art gaming room.",
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200",
    amenities: ["Plunge Pool", "PS5 Gaming Zone", "Home Theater", "Wi-Fi", "AC"],
    includedServices: ["Kids' Breakfast", "Theme Park Transfer", "Night Guard"],
    isFeatured: false,
    rating: 4.7,
    ratingCount: 15,
    numRooms: 3,
    mealsAvailable: true,
    petFriendly: false,
    refundPolicy: "Non-refundable during peak theme park season."
  },
  {
    id: 'v12',
    name: "Konkan Heritage 6BHK",
    location: "Konkan, Maharashtra",
    pricePerNight: 65000,
    bedrooms: 6,
    bathrooms: 6,
    capacity: 20,
    description: "A restored ancestral mansion overlooking the Arabian Sea.",
    longDescription: "Step back in time at Konkan Heritage. This 6BHK property combines traditional 'Wada' architecture with modern luxuries like an infinity pool and premium bath fittings. Enjoy authentic Malvani cuisine prepared by our local chefs on traditional wood-fired stoves.",
    imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1200",
    amenities: ["Sea View", "Infinity Pool", "Traditional Kitchen", "Heritage Architecture", "AC"],
    includedServices: ["Malvani Thali", "Village Walk Guide", "Coconut Grove Yoga"],
    isFeatured: true,
    rating: 4.9,
    ratingCount: 31,
    numRooms: 6,
    mealsAvailable: true,
    petFriendly: true,
    refundPolicy: "Full refund 15 days before check-in."
  },
  {
    id: 'v13',
    name: "Diveagar Sands 2BHK",
    location: "Diveagar, Maharashtra",
    pricePerNight: 18000,
    bedrooms: 2,
    bathrooms: 2,
    capacity: 6,
    description: "Cozy beachside cottage just 200 meters from the golden sands.",
    longDescription: "Diveagar Sands is a perfect weekend getaway for small families. This 2BHK cottage offers a lush garden, hammocks for relaxing, and easy access to the pristine Diveagar beach. The interiors are light and airy, reflecting the coastal vibe.",
    imageUrl: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=1200",
    amenities: ["Garden", "Hammocks", "Beach Access", "Wi-Fi", "AC"],
    includedServices: ["Beach Umbrella Setup", "Sand Cycle Rental", "Housekeeping"],
    isFeatured: false,
    rating: 4.6,
    ratingCount: 12,
    numRooms: 2,
    mealsAvailable: true,
    petFriendly: true,
    refundPolicy: "72 hours cancellation policy."
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: "Sarah Jenkins",
    content: "The most seamless booking experience I've ever had. Lazy Daze was a dream come true for our family reunion.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: '2',
    name: "Michael Chen",
    content: "The curators really know their properties. Every detail was exactly as described, especially the private chef service.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=michael"
  },
  {
    id: '3',
    name: "Anita Desai",
    content: "The Glass House in Kasauli provided the most tranquil vacation I've ever had. The AI-suggested description was spot on!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=anita"
  },
  {
    id: '4',
    name: "Raj Malhotra",
    content: "Excellent management. From the WhatsApp inquiry to the checkout, everything was handled with extreme professionalism.",
    rating: 4,
    avatar: "https://i.pravatar.cc/150?u=raj"
  }
];

export const SERVICES: Service[] = [
  {
    id: 's1',
    title: "Private Chef",
    description: "World-class culinary experiences tailored to your dietary preferences right in your villa.",
    icon: "fa-utensils"
  },
  {
    id: 's2',
    title: "Chauffeur Service",
    description: "Luxury transport available 24/7 to take you wherever your heart desires.",
    icon: "fa-car"
  },
  {
    id: 's3',
    title: "Spa & Wellness",
    description: "In-villa massage and spa treatments to rejuvenate your mind, body, and soul.",
    icon: "fa-spa"
  }
];
