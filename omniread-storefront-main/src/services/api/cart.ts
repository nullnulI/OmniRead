/* Copyright (c) 2026, Yao Zeran 
 * 
 * The api services that fetch cart data. */


import type { Cart, CartItem } from "@/types/cart";
import type { Order } from "@/types/order";

import { fetchJson } from "@/services/http";


export async function fetchCart(): Promise<Cart> {
  return fetchJson<Cart>("/cart");
}


export async function fetchCartItems(): Promise<CartItem[]> {
  const cart = await fetchCart();
  return cart.items;
}


export async function fetchCartItemsByUserId(userId: string): Promise<CartItem[]> {
  void userId;
  return fetchCartItems();
}


export async function addBookToCart(userId: string, bookId: string, quantity = 1): Promise<Cart> {
  void userId;
  return fetchJson<Cart>("/cart/items", {
    method: "POST",
    body: JSON.stringify({
      productId: Number(bookId),
      quantity,
    }),
  });
}


export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  return fetchJson<Cart>(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}


export async function removeCartItem(itemId: number): Promise<Cart> {
  return fetchJson<Cart>(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
}


export async function checkoutCart(shippingAddress: string): Promise<Order> {
  return fetchJson<Order>("/cart/checkout", {
    method: "POST",
    body: JSON.stringify({ shippingAddress }),
  });
}
