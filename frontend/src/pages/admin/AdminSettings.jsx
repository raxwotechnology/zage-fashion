import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, Store, Tag, ShoppingBag, Monitor, BarChart3, Ticket, Settings, Save, Upload, Globe, Phone, Mail, MapPin, Palette, DollarSign, Gift, Shield } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getSettings, updateSettings, uploadLogo } from '../../services/api';
import { toast } from 'react-toastify';

const navItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/vouchers', label: 'Vouchers', icon: Ticket },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  { path: '/cashier-login', label: 'POS Terminal', icon: Monitor },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');
  const fileRef = useRef(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await getSettings();
      setSettings(data);
    } catch (err) { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field, value) => {
    setSettings(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateSettings(settings);
      setSettings(data);
      toast.success('Settings saved successfully!');
    } catch (err) { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await uploadLogo(formData);
      setSettings(prev => ({ ...prev, logo: data.logo }));
      toast.success('Logo uploaded!');
    } catch (err) { toast.error('Failed to upload logo'); }
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Admin Panel"><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  const tabs = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'commerce', label: 'Commerce', icon: DollarSign },
    { key: 'loyalty', label: 'Loyalty', icon: Gift },
    { key: 'social', label: 'Social', icon: Palette },
    { key: 'advanced', label: 'Advanced', icon: Shield },
  ];

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '', suffix = '' }) => (
    <div>
      <label className="text-xs font-medium text-muted-text block mb-1">{label}</label>
      <div className="relative">
        <input type={type} value={value || ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full border border-card-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
          placeholder={placeholder} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-text">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">⚙️ Site Settings</h1>
            <p className="text-muted-text text-sm mt-1">Manage your store configuration</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-primary-green hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors shadow-md disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab === t.key ? 'bg-primary-green text-white' : 'bg-gray-100 text-muted-text hover:bg-gray-200'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* General */}
        {tab === 'general' && (
          <div className="space-y-6">
            {/* Logo */}
            <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
              <h2 className="font-semibold text-dark-navy mb-4">Shop Branding</h2>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-card-border flex items-center justify-center overflow-hidden bg-gray-50">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={32} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                    <Upload size={14} /> Upload Logo
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <p className="text-xs text-muted-text mt-2">PNG, JPG, or SVG. Max 2MB.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Shop Name" value={settings.shopName} onChange={(v) => handleChange('shopName', v)} placeholder="FreshCart" />
                <InputField label="Tagline" value={settings.tagline} onChange={(v) => handleChange('tagline', v)} placeholder="Fresh Groceries Delivered" />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
              <h2 className="font-semibold text-dark-navy mb-4">Footer</h2>
              <InputField label="Footer Text" value={settings.footerText} onChange={(v) => handleChange('footerText', v)} placeholder="© 2026 FreshCart. All rights reserved." />
            </div>
          </div>
        )}

        {/* Contact */}
        {tab === 'contact' && (
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4 flex items-center gap-2"><Phone size={18} /> Contact Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" value={settings.email} onChange={(v) => handleChange('email', v)} placeholder="info@freshcart.lk" />
              <InputField label="Primary Phone" value={settings.phone} onChange={(v) => handleChange('phone', v)} placeholder="+94 11 255 5000" />
              <InputField label="Secondary Phone" value={settings.phone2} onChange={(v) => handleChange('phone2', v)} placeholder="Optional" />
              <InputField label="Country" value={settings.country} onChange={(v) => handleChange('country', v)} placeholder="Sri Lanka" />
              <InputField label="City" value={settings.city} onChange={(v) => handleChange('city', v)} placeholder="Colombo" />
              <div className="sm:col-span-2">
                <InputField label="Full Address" value={settings.address} onChange={(v) => handleChange('address', v)} placeholder="123 Market Street, Colombo 03" />
              </div>
            </div>
          </div>
        )}

        {/* Commerce */}
        {tab === 'commerce' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
              <h2 className="font-semibold text-dark-navy mb-4 flex items-center gap-2"><DollarSign size={18} /> Currency & Pricing</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <InputField label="Default Currency" value={settings.currency} onChange={(v) => handleChange('currency', v)} />
                <InputField label="USD → LKR Rate" value={settings.exchangeRate} onChange={(v) => handleChange('exchangeRate', v)} type="number" suffix="LKR per USD" />
                <InputField label="Tax Rate" value={settings.taxRate} onChange={(v) => handleChange('taxRate', v)} type="number" suffix="e.g. 0.08 = 8%" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
              <h2 className="font-semibold text-dark-navy mb-4 flex items-center gap-2">🚚 Delivery</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Free Delivery Threshold" value={settings.deliveryFeeThreshold} onChange={(v) => handleChange('deliveryFeeThreshold', v)} type="number" suffix="Rs." />
                <InputField label="Delivery Fee" value={settings.deliveryFee} onChange={(v) => handleChange('deliveryFee', v)} type="number" suffix="Rs." />
              </div>
              <p className="text-xs text-muted-text mt-3">Orders above the threshold get free delivery. Otherwise delivery fee is charged.</p>
            </div>
          </div>
        )}

        {/* Loyalty */}
        {tab === 'loyalty' && (
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4 flex items-center gap-2"><Gift size={18} /> Loyalty Points Configuration</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <InputField label="Points Per Unit Spent" value={settings.loyaltyPointsPerUnit} onChange={(v) => handleChange('loyaltyPointsPerUnit', v)} type="number" suffix="Rs. per 1 point" />
              <InputField label="Point Redemption Value" value={settings.loyaltyPointValue} onChange={(v) => handleChange('loyaltyPointValue', v)} type="number" suffix="Rs. per point" />
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800">
              <p className="font-medium mb-1">How it works:</p>
              <p className="text-xs">Customer earns 1 point for every Rs. {settings.loyaltyPointsPerUnit} spent.</p>
              <p className="text-xs">Each point is worth Rs. {settings.loyaltyPointValue} when redeemed.</p>
            </div>
          </div>
        )}

        {/* Social */}
        {tab === 'social' && (
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4 flex items-center gap-2"><Palette size={18} /> Social Media Links</h2>
            <div className="space-y-4">
              <InputField label="Facebook URL" value={settings.socialLinks?.facebook} onChange={(v) => handleSocialChange('facebook', v)} placeholder="https://facebook.com/freshcart" />
              <InputField label="Instagram URL" value={settings.socialLinks?.instagram} onChange={(v) => handleSocialChange('instagram', v)} placeholder="https://instagram.com/freshcart" />
              <InputField label="Twitter URL" value={settings.socialLinks?.twitter} onChange={(v) => handleSocialChange('twitter', v)} placeholder="https://twitter.com/freshcart" />
            </div>
          </div>
        )}

        {/* Advanced */}
        {tab === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
              <h2 className="font-semibold text-dark-navy mb-4 flex items-center gap-2"><Shield size={18} /> Maintenance Mode</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark-navy">Enable Maintenance Mode</p>
                  <p className="text-xs text-muted-text">When enabled, customers will see a maintenance page</p>
                </div>
                <button onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`w-14 h-7 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-md ${settings.maintenanceMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              {settings.maintenanceMode && (
                <div className="mt-3 bg-red-50 rounded-xl p-3 text-xs text-red-600 font-medium">⚠️ Maintenance mode is ON. Customers cannot access the site.</div>
              )}
            </div>

            {/* Config Summary */}
            <div className="bg-gray-50 rounded-2xl border border-card-border p-6">
              <h2 className="font-semibold text-dark-navy mb-3">Current Configuration</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { l: 'Currency', v: settings.currency },
                  { l: 'Exchange Rate', v: `1 USD = ${settings.exchangeRate} LKR` },
                  { l: 'Tax Rate', v: `${(settings.taxRate * 100).toFixed(0)}%` },
                  { l: 'Delivery Fee', v: `Rs. ${settings.deliveryFee}` },
                  { l: 'Free Delivery Above', v: `Rs. ${settings.deliveryFeeThreshold}` },
                  { l: 'Points per Rs.', v: `${settings.loyaltyPointsPerUnit}` },
                  { l: 'Point Value', v: `Rs. ${settings.loyaltyPointValue}` },
                  { l: 'Maintenance', v: settings.maintenanceMode ? '🔴 ON' : '🟢 OFF' },
                ].map(c => (
                  <div key={c.l} className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="text-muted-text">{c.l}</p>
                    <p className="font-semibold text-dark-navy mt-1">{c.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
