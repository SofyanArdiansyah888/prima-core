export type ProductCategory = string;

export type HomeBanner = {
  uuid: string;
  badge: string;
  title: string;
  description: string | null;
  cta_label: string;
  category: string | null;
  image_url: string;
};

export type CatalogCategory = {
  slug: string;
  name: string;
  default_unit: string;
};

export type Product = {
  uuid: string;
  code: string;
  name: string;
  category: ProductCategory;
  category_name?: string | null;
  unit: string;
  base_price: number;
  min_order: number;
  slump: string | null;
  recommended_for: string | null;
  description: string | null;
  tag: string | null;
  specs: Record<string, string | number> | null;
  image_url?: string | null;
  is_featured?: boolean;
  is_best_seller?: boolean;
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
  admin_fee: number;
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

export type OrderWorkOrder = {
  uuid: string;
  code: string;
  status: string;
  product_name?: string | null;
  product_code?: string | null;
  target_quantity: number;
  produced_quantity: number;
  dispatched_quantity: number;
  unit: string;
  batch_recipe_code?: string | null;
  slump_target?: string | null;
  scheduled_date?: string | null;
  scheduled_time_slot?: string | null;
  assigned_user_name?: string | null;
  created_at?: string | null;
};

export type OrderSuratJalan = {
  uuid: string;
  code: string;
  status: string;
  vehicle_number: string;
  vehicle_type: string;
  driver_name: string;
  driver_phone?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  created_at?: string | null;
  items: {
    product_name?: string | null;
    quantity: number;
    unit: string;
    recipient_name?: string | null;
    received_at?: string | null;
  }[];
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
  admin_fee: number;
  subtotal: number;
  ppn: number;
  total_price: number;
  payment_method: string;
  payment_method_label: string;
  payment_status: string;
  snap_token?: string | null;
  snap_redirect_url?: string | null;
  midtrans_client_key?: string | null;
  paid_at?: string | null;
  status: string;
  status_label: string;
  approved_at?: string | null;
  survey_notes?: string | null;
  delivered_at?: string | null;
  customer_confirmed_at?: string | null;
  completed_by?: string | null;
  can_pay: boolean;
  can_cancel: boolean;
  can_confirm_complete?: boolean;
  auto_complete_at?: string | null;
  has_spk: boolean;
  has_surat_jalan: boolean;
  has_faktur: boolean;
  notes: string | null;
  plant: { code: string; name: string; phone: string | null; whatsapp: string | null } | null;
  items: OrderItem[];
  work_orders?: OrderWorkOrder[];
  surat_jalans?: OrderSuratJalan[];
  customer?: { name: string; phone?: string | null; email?: string | null } | null;
  created_at: string | null;
};

export type StaffUser = {
  id: number;
  uuid: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'sales' | 'driver' | string;
  branch?: { id: number; code: string; name: string } | null;
};

export type SalesOrderSummary = {
  uuid: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  project_title: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  distance_km: number;
  total_price: number;
  status: string;
  approved_at?: string | null;
  approver_name?: string | null;
  survey_notes?: string | null;
  rejection_reason?: string | null;
  created_at: string | null;
  plant: {
    id: number;
    code: string;
    name: string;
    lat: number | null;
    lng: number | null;
  } | null;
  items: { name?: string | null; quantity: number; unit: string }[];
};

export type DriverDeliverySummary = {
  uuid: string;
  code: string;
  vehicle_number: string;
  vehicle_type: string;
  driver_name: string;
  driver_phone: string | null;
  status: string;
  departure_time?: string | null;
  arrival_time?: string | null;
  notes?: string | null;
  plant: { code: string; name: string; phone: string | null } | null;
  items: {
    id: number;
    product_name?: string | null;
    quantity_delivered: number;
    unit: string;
    destination_customer_name: string;
    destination_project_title?: string | null;
    destination_address: string;
    destination_lat: number | null;
    destination_lng: number | null;
    status: string;
    recipient_name?: string | null;
    received_at?: string | null;
    order_code?: string | null;
    customer_phone?: string | null;
  }[];
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export const PAYMENTS = [
  { 
    value: 'MIDTRANS', 
    label: 'Midtrans Online Payment', 
    sublabel: 'QRIS, Virtual Account (Mandiri, BCA, BRI, BNI), GoPay, ShopeePay, Kartu Kredit',
    badge: 'Otomatis'
  },
] as const;

export const STATUS_STEPS = [
  'PENDING_APPROVAL',
  'CONFIRMED',
  'PROCESSING',
  'ON_DELIVERY',
  'COMPLETED',
] as const;

export const STATUS_LABELS: Record<(typeof STATUS_STEPS)[number], string> = {
  PENDING_APPROVAL: 'Verifikasi Tempat',
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  ON_DELIVERY: 'Dalam Pengiriman',
  COMPLETED: 'Selesai',
};
