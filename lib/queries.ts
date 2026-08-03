import { supabase } from "./supabase";
import { Business, BusinessSupplier, Purchase } from "./types";

export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase.from("businesses").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchBusiness(id: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSupplierLinks(): Promise<BusinessSupplier[]> {
  const { data, error } = await supabase.from("business_suppliers").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addBusiness(input: {
  name: string;
  category: string;
  description: string;
  website?: string | null;
  local_respend_pct: number;
  supplierIds: string[];
}): Promise<Business> {
  const { data, error } = await supabase
    .from("businesses")
    .insert({
      name: input.name,
      category: input.category,
      description: input.description,
      website: input.website || null,
      local_respend_pct: input.local_respend_pct,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.supplierIds.length > 0) {
    const { error: linkError } = await supabase
      .from("business_suppliers")
      .insert(input.supplierIds.map((supplier_id) => ({ business_id: data.id, supplier_id })));
    if (linkError) throw linkError;
  }

  return data;
}

export async function addPurchase(input: {
  business_id: string;
  amount: number;
  spender_name?: string | null;
}): Promise<Purchase> {
  const { data, error } = await supabase
    .from("purchases")
    .insert({
      business_id: input.business_id,
      amount: input.amount,
      spender_name: input.spender_name || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
