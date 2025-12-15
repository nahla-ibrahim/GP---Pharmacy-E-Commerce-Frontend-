import { product } from './product';

export interface Homets {
  banners: BannerTs[];
  categories: Category[];
  featuredProducts: product[];
  popularProducts: product[];
}

export interface BannerTs {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  type?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  productCount: number;
  rank?: number;
}
