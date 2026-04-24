import { create } from 'zustand';
import { getSettings } from '../services/api';

const toAbsoluteLogoUrl = (logoPath) => {
  if (!logoPath) return '';
  if (/^https?:\/\//i.test(logoPath)) return logoPath;
  const apiBase = 'https://beauty.zage.lk';
  return apiBase ? `${apiBase}${logoPath}` : logoPath;
};

const useSettingsStore = create((set) => ({
  settings: null,
  loading: false,
  loaded: false,
  fetchSettings: async (force = false) => {
    if (!force && useSettingsStore.getState().loaded) return;
    set({ loading: true });
    try {
      const { data } = await getSettings();
      set({
        settings: {
          ...data,
          logoUrl: toAbsoluteLogoUrl(data.logo),
        },
        loaded: true,
      });
    } catch (err) {
      // keep defaults in UI
    } finally {
      set({ loading: false });
    }
  },
  setSettingsLocal: (settings) => {
    set({
      settings: settings ? { ...settings, logoUrl: toAbsoluteLogoUrl(settings.logo) } : null,
      loaded: true,
    });
  },
}));

export default useSettingsStore;
