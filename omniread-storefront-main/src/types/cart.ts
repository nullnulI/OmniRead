export interface CartItem {
  id: number;
  productId: number;
  sku: string;
  title: string;
  authorName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  id: number;
  customerId: number;
  items: CartItem[];
  subtotal: number;
}
