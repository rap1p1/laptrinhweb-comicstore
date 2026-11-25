export type CartItem = {
  id: number;
  title: string;
  issue: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  color: string | null;
  mark: string | null;
};

export function calculateCartTotal(items: CartItem[]) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

export function calculateShippingFee(total: number) {
  if (total >= 499000) return 0;
  return 30000;
}
