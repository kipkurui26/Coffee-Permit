import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/AxiosInstance';
import { useToast } from '../../context/ToastContext';

const NotificationPreference = () => {
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState({
    notify_permit_status: true,
    notify_permit_expiry: true,
    digest_frequency: 'weekly',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [original, setOriginal] = useState(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/auth/notification-preferences/')
      .then(res => {
        setPrefs(res.data);
        setOriginal(res.data);
      })
      .catch(() => showToast('Failed to load notification preferences', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const newPrefs = {
      ...prefs,
      [name]: type === 'checkbox' ? checked : value,
    };
    setPrefs(newPrefs);
    setDirty(JSON.stringify(newPrefs) !== JSON.stringify(original));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.put('/auth/notification-preferences/', prefs);
      setPrefs(res.data);
      setOriginal(res.data);
      setDirty(false);
      showToast('Notification preferences updated', 'success');
    } catch {
      showToast('Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading notification preferences...</div>;

  return (
    <div className="bg-gray-50 border border-amber-200 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="notify_permit_status"
          name="notify_permit_status"
          checked={prefs.notify_permit_status}
          onChange={handleChange}
          className="mr-2"
        />
        <label htmlFor="notify_permit_status" className="text-sm text-gray-700">
          Email me about permit status changes (approved, rejected, etc.)
        </label>
      </div>
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="notify_permit_expiry"
          name="notify_permit_expiry"
          checked={prefs.notify_permit_expiry}
          onChange={handleChange}
          className="mr-2"
        />
        <label htmlFor="notify_permit_expiry" className="text-sm text-gray-700">
          Email me reminders before permit expiry
        </label>
      </div>
      <div className="mb-4">
        <label htmlFor="digest_frequency" className="block text-sm font-medium text-gray-700 mb-1">
          Digest Frequency
        </label>
        <select
          id="digest_frequency"
          name="digest_frequency"
          value={prefs.digest_frequency}
          onChange={handleChange}
          className="border border-amber-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || saving}
        className="py-2 px-4 rounded bg-amber-700 text-white font-medium hover:bg-amber-800 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

export default NotificationPreference; 