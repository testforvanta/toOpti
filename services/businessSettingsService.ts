import { supabase } from './supabaseClient';

// Business Settings
export async function fetchBusinessSettings() {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .maybeSingle(); // Use maybeSingle to avoid 406 error if table is empty
  if (error) throw error;
  return data;
}

export async function updateBusinessSettings(settings) {
  const { data, error } = await supabase
    .from('business_settings')
    .update(settings)
    .eq('id', settings.id)
    .single();
  if (error) throw error;
  return data;
}

// Business Listings
export async function fetchBusinessListings() {
  const { data, error } = await supabase
    .from('business_listings')
    .select('*');
  if (error) throw error;
  return data;
}

export async function addBusinessListing(listing) {
  const { data, error } = await supabase
    .from('business_listings')
    .insert([listing])
    .single();
  if (error) throw error;
  return data;
}

export async function updateBusinessListing(listing) {
  const { data, error } = await supabase
    .from('business_listings')
    .update(listing)
    .eq('id', listing.id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBusinessListing(id) {
  const { error } = await supabase
    .from('business_listings')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
