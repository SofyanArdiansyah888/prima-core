export type ProductCategory = 'cement' | 'readymix';

export type Product = {
  uuid: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: string;
  base_price: number;
  min_order: number;
  slump: string | null;
  recommended_for: string | null;
  description: string | null;
  tag: string | null;
  specs: Record<string, string | number> | null;
};

export type Customer = {
  uuid: string;
  name: string;
  phone: string;
  email: string | null;
};

export type QuoteItem = {
  product_uuid: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
};

export type Quote = {
  category: string;
  plant: { code: string; name: string };
  distance_km: number;
  delivery_fee: number;
  subtotal: number;
  ppn: number;
  total_price: number;
  details: string;
  items: QuoteItem[];
};

export type OrderItem = {
  code: string | null;
  name: string | null;
  category: string | null;
  quantity: number;
  fulfilled_quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  notes: string | null;
};

export type CustomerOrder = {
  uuid: string;
  code: string;
  project_title: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  distance_km: number;
  delivery_fee: number;
  subtotal: number;
  ppn: number;
  total_price: number;
  payment_method: string;
  payment_method_label: string;
  payment_status: string;
  status: string;
  status_label: string;
  can_cancel: boolean;
  notes: string | null;
  plant: { code: string; name: string } | null;
  items: OrderItem[];
  created_at: string | null;
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export const PAYMENTS = [
  { value: 'CASH', label: 'Tunai / Transfer' },
  { value: 'VA_MANDIRI', label: 'Virtual Account Mandiri' },
  { value: 'VA_BRI', label: 'Virtual Account BRI' },
] as const;

export const STATUS_STEPS = [
  'CONFIRMED',
  'WORK_ORDER_CREATED',
  'IN_PRODUCTION',
  'PARTIAL_DELIVERY',
  'COMPLETED',
] as const;

export const STATUS_LABELS: Record<(typeof STATUS_STEPS)[number], string> = {
  CONFIRMED: 'Dikonfirmasi',
  WORK_ORDER_CREATED: 'SPK terbit',
  IN_PRODUCTION: 'Produksi',
  PARTIAL_DELIVERY: 'Sebagian terkirim',
  COMPLETED: 'Selesai',
};
