import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  fetchBusinessSettings,
  updateBusinessSettings,
  fetchBusinessListings,
  addBusinessListing,
  updateBusinessListing,
  deleteBusinessListing
} from '../../services/businessSettingsService';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom'; // If not using react-router, replace with a prop or custom handler

interface SettingsPageProps {
  userProfile: UserProfile;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userProfile }) => {
  // Strict rules: Only SuperUsers, UI/theme consistency, no feature removal/duplication, avoid technical debt
  const [activeGroup, setActiveGroup] = useState<'business'>('business');
  const [businessTab, setBusinessTab] = useState<'details' | 'listing'>('details');
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Form state for business details
  const [detailsForm, setDetailsForm] = useState({
    business_name: '',
    business_email: '',
    business_address: ''
  });
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState<string | null>(null);
  // Form state for new listing
  const [listingForm, setListingForm] = useState({
    name: '',
    type: '',
    description: '',
    price: ''
  });
  const [listingSaving, setListingSaving] = useState(false);
  const [listingMessage, setListingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile.role !== UserRole.SUPERUSER) return;
    setLoading(true);
    Promise.all([
      fetchBusinessSettings(),
      fetchBusinessListings()
    ])
      .then(([settings, listings]) => {
        setBusinessSettings(settings);
        setListings(listings);
        setDetailsForm({
          business_name: settings?.business_name || '',
          business_email: settings?.business_email || '',
          business_address: settings?.business_address || ''
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load settings');
        setLoading(false);
      });
  }, [userProfile.role]);

  // Add a function to insert into business_settings if not exists
  async function insertBusinessSettings(settings: any) {
    const { data, error } = await supabase
      .from('business_settings')
      .insert([settings])
      .single();
    if (error) throw error;
    return data;
  }

  // Handle business details form submit
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsSaving(true);
    setDetailsMessage(null);
    try {
      let result;
      if (businessSettings && businessSettings.id) {
        result = await updateBusinessSettings({ ...detailsForm, id: businessSettings.id });
      } else {
        // Insert into business_settings, not business_listings
        result = await insertBusinessSettings(detailsForm);
      }
      setBusinessSettings(result);
      setDetailsMessage('Business details saved.');
    } catch (err: any) {
      setDetailsMessage('Error saving details: ' + (err.message || err));
    } finally {
      setDetailsSaving(false);
    }
  };

  // Handle listing form submit
  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingSaving(true);
    setListingMessage(null);
    try {
      const newListing = {
        ...listingForm,
        price: listingForm.price ? Number(listingForm.price) : null,
        type: listingForm.type || 'service',
        business_id: businessSettings?.id
      };
      const result = await addBusinessListing(newListing);
      if (result) {
        setListings(prev => [...prev, result]); // Only add if not null
      }
      setListingForm({ name: '', type: '', description: '', price: '' });
      setListingMessage('Service/Product added.');
    } catch (err: any) {
      setListingMessage('Error adding listing: ' + (err.message || err));
    } finally {
      setListingSaving(false);
    }
  };

  if (userProfile.role !== UserRole.SUPERUSER) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-500 dark:text-zinc-400">You do not have permission to view these settings.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-gray-500 dark:text-zinc-400">Loading settings...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-zinc-950 min-h-screen">
      {/* Settings Side Panel */}
      <aside className="w-72 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 p-8 flex flex-col shadow-lg min-h-screen">
        {/* Back arrow for settings side panel */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('navigateToDashboard');
              window.dispatchEvent(event);
            }
          }}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 focus:outline-none"
          aria-label="Back to Dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="ml-2 font-medium">Back to Dashboard</span>
        </button>
        <h2 className="text-3xl font-extrabold mb-2 text-blue-600 dark:text-blue-400 tracking-tight">Settings</h2>
        <p className="text-base text-gray-500 dark:text-zinc-400 mb-8">Manage your business profile and services</p>
        <button
          className={`mb-2 px-4 py-3 rounded-lg text-left font-semibold text-lg transition-colors duration-150 ${activeGroup === 'business' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'}`}
          onClick={() => setActiveGroup('business')}
        >
          Business Settings
        </button>
      </aside>
      {/* Main Settings Content */}
      <section className="flex-1 flex flex-col items-center px-0 sm:px-8 py-12">
        <div className="w-full max-w-3xl">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl shadow border border-gray-200 dark:border-zinc-800 px-2 py-2 mb-10">
            <button
              className={`flex-1 px-6 py-3 font-semibold text-lg rounded-lg transition-colors duration-200 focus:outline-none ${businessTab === 'details' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shadow border-b-4 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              onClick={() => setBusinessTab('details')}
            >
              Business Details
            </button>
            <button
              className={`flex-1 px-6 py-3 font-semibold text-lg rounded-lg transition-colors duration-200 focus:outline-none ${businessTab === 'listing' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shadow border-b-4 border-blue-600 dark:border-blue-400' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              onClick={() => setBusinessTab('listing')}
            >
              Listing
            </button>
          </div>
          {/* Tab Content */}
          {businessTab === 'details' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-800 p-10 mb-12">
              <h3 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-300">Business Details</h3>
              <p className="text-gray-500 dark:text-zinc-400 mb-8">Update your business name, contact email, and address.</p>
              <form className="space-y-7" onSubmit={handleDetailsSubmit}>
                <div>
                  <label className="block text-base font-medium mb-2">Business Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg"
                    value={detailsForm.business_name}
                    onChange={e => setDetailsForm(f => ({ ...f, business_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Business Email</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg"
                    value={detailsForm.business_email}
                    onChange={e => setDetailsForm(f => ({ ...f, business_email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Business Address</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg"
                    value={detailsForm.business_address}
                    onChange={e => setDetailsForm(f => ({ ...f, business_address: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-60 shadow"
                  disabled={detailsSaving}
                >
                  {detailsSaving ? 'Saving...' : (businessSettings && businessSettings.id ? 'Update' : 'Create')}
                </button>
                {detailsMessage && <div className="mt-4 text-base text-blue-600 dark:text-blue-400">{detailsMessage}</div>}
              </form>
            </div>
          )}
          {businessTab === 'listing' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-800 p-10 mb-12">
              <h3 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-300">Services & Products</h3>
              <p className="text-gray-500 dark:text-zinc-400 mb-8">Add and manage your business offerings.</p>
              <form className="space-y-7 mb-10" onSubmit={handleListingSubmit}>
                <div>
                  <label className="block text-base font-medium mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg"
                    value={listingForm.name}
                    onChange={e => setListingForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Type</label>
                  <select
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg"
                    value={listingForm.type}
                    onChange={e => setListingForm(f => ({ ...f, type: e.target.value }))}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Description</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg"
                    value={listingForm.description}
                    onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Price <span className="text-gray-400 text-sm font-normal">(optional)</span></label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg"
                    value={listingForm.price}
                    onChange={e => setListingForm(f => ({ ...f, price: e.target.value }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-60 shadow"
                  disabled={listingSaving}
                >
                  {listingSaving ? 'Adding...' : 'Add Service/Product'}
                </button>
                {listingMessage && <div className="mt-4 text-base text-blue-600 dark:text-blue-400">{listingMessage}</div>}
              </form>
              <div className="rounded-lg overflow-x-auto border border-gray-200/80 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200/80 dark:divide-zinc-800/70">
                  <thead className="bg-gray-50/70 backdrop-blur-sm dark:bg-zinc-900/80">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Type</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Description</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/80 dark:divide-zinc-800/70">
                    {listings.filter(item => !!item).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-500 dark:text-zinc-400 text-base">No services or products listed yet.</td>
                      </tr>
                    )}
                    {listings.filter(item => !!item).map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/70 dark:hover:bg-zinc-800/60 transition-colors duration-150 ease-in-out">
                        <td className="px-5 py-4 align-top text-sm text-gray-800 dark:text-zinc-100 font-medium">{item.name}</td>
                        <td className="px-5 py-4 align-top text-sm capitalize text-gray-700 dark:text-zinc-200">{item.type}</td>
                        <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-zinc-300">{item.description}</td>
                        <td className="px-5 py-4 align-top text-sm text-gray-700 dark:text-zinc-200">{item.price ? `₹${item.price}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
