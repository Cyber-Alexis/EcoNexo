export interface ApiImage {
  id: number;
  path: string;
  url: string;
  type: string | null;
  position?: number;
}

export interface ApiCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  price_unit: string | null;
  stock: number;
  active: boolean;
  category: ApiCategory | null;
  images: ApiImage[];
}

export interface ApiUser {
  id: number;
  name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  postal_code?: string | null;
}

export interface ApiReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: ApiUser;
}

export interface ApiBusiness {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  phone: string | null;
  contact_person_name?: string | null;
  website: string | null;
  opening_hours: string | null;
  status: string;
  reviews_avg_rating: number | null;
  reviews_count: number;
  images: ApiImage[];
  categories: ApiCategory[];
  products: ApiProduct[];
  reviews: ApiReview[];
  user?: ApiUser | null;
}

export interface ApiBusinessListItem {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  status: string;
  reviews_avg_rating: number | null;
  reviews_count: number;
  images: ApiImage[];
  categories: ApiCategory[];
  user?: ApiUser | null;
}
