export interface ApiImage {
  id: number;
  path: string;
  type: string | null;
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
  stock: number;
  active: boolean;
  category: ApiCategory | null;
  images: ApiImage[];
}

export interface ApiUser {
  id: number;
  name: string;
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
  status: string;
  reviews_avg_rating: number | null;
  reviews_count: number;
  images: ApiImage[];
  products: ApiProduct[];
  reviews: ApiReview[];
}

export interface ApiBusinessListItem {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  status: string;
  reviews_avg_rating: number | null;
  reviews_count: number;
  images: ApiImage[];
  categories: ApiCategory[];
}
