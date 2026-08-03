export type Business = {
  id: string;
  name: string;
  category: string;
  description: string;
  suburb: string;
  website: string | null;
  local_respend_pct: number;
  is_seed: boolean;
  created_at: string;
};

export type BusinessSupplier = {
  id: string;
  business_id: string;
  supplier_id: string;
  created_at: string;
};

export type Purchase = {
  id: string;
  business_id: string;
  amount: number;
  spender_name: string | null;
  created_at: string;
};
