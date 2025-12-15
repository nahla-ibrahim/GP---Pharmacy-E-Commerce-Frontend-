///////////////////TESTING///////////////////
export interface theproduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  images: string[];
}
export type products = {
  products: theproduct[];
};
