import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaPen, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/AxiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { FiEye, FiEyeOff } from "react-icons/fi";

const TABS = [
  { key: 'profile', label: 'Profile Info' },
  { key: 'password', label: 'Password Manager' },
];

const inputClass =
  'appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm bg-white disabled:bg-gray-100 mb-1';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const errorClass = 'mt-0.5 text-xs text-red-600';
const sectionClass = 'mb-8';

const AdminProfile = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  // Signature state
  const [signatureFile, setSignatureFile] = useState(null);
  const [hasSignatureChanged, setHasSignatureChanged] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState(user?.signature_image || null);

  // Profile form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm({
    defaultValues: originalData,
  });

  // Password form
  const passwordForm = useForm();
  const {
    register: pwRegister,
    handleSubmit: handlePwSubmit,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwLoading },
  } = passwordForm;
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    if (user) {
      setOriginalData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_no: user.phone_no || '',
      });
      setSignaturePreview(user.signature_image || null);
      setSignatureFile(null);
    }
  }, [user]);

  useEffect(() => {
    reset(originalData);
  }, [originalData, reset]);

  const onEdit = () => {
    setIsEditing(true);
    setSignaturePreview(user.signature_image || null);
    setSignatureFile(null);
  };
  const onCancel = () => {
    reset(originalData);
    setIsEditing(false);
    setSignatureFile(null);
    setSignaturePreview(user.signature_image || null);
    setHasSignatureChanged(false);
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
      setHasSignatureChanged(true);
    }
  };


  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const changed = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== originalData[key]) {
          changed[key] = data[key];
        }
      });
      let updatedUser = { ...user, ...changed };
      // Handle signature upload
      if (signatureFile) {
        const formData = new FormData();
        Object.entries(changed).forEach(([key, value]) => formData.append(key, value));
        formData.append('signature_image', signatureFile);
        const response = await axiosInstance.patch('/auth/user/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedUser = response.data;
        showToast('Profile and signature updated successfully', 'success');
      } else if (Object.keys(changed).length > 0) {
        const response = await axiosInstance.patch('/auth/user/', changed);
        updatedUser = { ...updatedUser, ...response.data };
        showToast('Profile updated successfully', 'success');
      }
      setUser && setUser(updatedUser);
      setOriginalData({
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
        phone_no: updatedUser.phone_no || '',
      });
      setSignaturePreview(updatedUser.signature_image || null);
      setSignatureFile(null);
      setIsEditing(false);
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
      setHasSignatureChanged(false);
    }
  };

  const onPasswordChange = async (data) => {
    try {
      await axiosInstance.post('/auth/password/change/', {
        old_password: data.old_password,
        new_password1: data.new_password1,
        new_password2: data.new_password2,
      });
      showToast('Password changed successfully!', 'success');
      resetPw();
    } catch (err) {
      let msg = 'Failed to change password.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string') msg = d;
        else if (d.detail) msg = d.detail;
        else if (d.new_password2) msg = d.new_password2.join(' ');
        else if (d.old_password) msg = d.old_password.join(' ');
      }
      showToast(msg, 'error');
    }
  };

  if (!user) return <div>Loading...</div>;

  // Helper to render a field as text or input
  const renderField = (name, label, value, inputProps, isEditable = true) => {
    if (!isEditing || !isEditable) {
      return (
        <div className="mb-4">
          <label className={labelClass}>{label}</label>
          <div className="text-gray-900 text-sm px-3 py-2 bg-gray-50 rounded-md border border-transparent">
            {value || <span className="text-gray-400">-</span>}
          </div>
        </div>
      );
    }
    return (
      <div className="mb-4">
        <label className={labelClass}>{label}</label>
        <input
          {...register(name, inputProps?.validation)}
          disabled={!isEditing}
          className={inputClass}
          placeholder={label}
          type={inputProps?.type || 'text'}
        />
        {errors[name] && <div className={errorClass}>{errors[name].message}</div>}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center text-amber-700 hover:text-amber-900 mb-6 font-medium text-sm focus:outline-none"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-2 text-amber-900">Admin Profile</h2>
      <p className="text-gray-600 text-sm mb-6">Manage your personal information and password as an administrator. Changes here affect your admin account only.</p>
      {/* Tabs */}
      <div className="flex border-b border-amber-200 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-150 focus:outline-none ${activeTab === tab.key
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-amber-700'
              }`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Profile Info Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <section className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              {!isEditing && (
                <button type="button" onClick={onEdit} className="text-amber-700 hover:text-amber-900 p-2" title="Edit Profile">
                  <FaPen />
                </button>
              )}
            </div>
            {renderField(
              'first_name',
              'First Name',
              watch('first_name'),
              { validation: { required: 'First name is required', maxLength: 50 } }
            )}
            {renderField(
              'last_name',
              'Last Name',
              watch('last_name'),
              { validation: { required: 'Last name is required', maxLength: 50 } }
            )}
            {renderField(
              'phone_no',
              'Phone Number',
              watch('phone_no'),
              { validation: { required: 'Phone number is required', pattern: { value: /^\d{10,15}$/, message: 'Enter a valid phone number' } } }
            )}
            {/* Signature Upload */}
            <div className="mb-4">
              <label className={labelClass}>Signature Image</label>
              {signaturePreview ? (
                <img src={signaturePreview} alt="Signature Preview" style={{ height: 60, marginBottom: 8, border: '1px solid #ccc', background: '#fff', padding: 2 }} />
              ) : (
                <div className="text-red-500 text-xs mb-2">No signature uploaded. You must upload a signature to approve/reject permits.</div>
              )}
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureChange}
                  className="block w-full text-sm text-gray-500"
                />
              )}
            </div>
            {/* Read-only fields */}
            <div className="mb-4">
              <label className={labelClass}>Email Address</label>
              <div className="text-gray-900 text-sm px-3 py-2 bg-gray-50 rounded-md border border-transparent cursor-not-allowed">
                {user.email}
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Role</label>
              <div className="text-gray-900 text-sm px-3 py-2 bg-gray-50 rounded-md border border-transparent cursor-not-allowed">
                {user.role}
              </div>
            </div>
          </section>
          {isEditing && (
            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                disabled={loading || (!isDirty && !hasSignatureChanged)}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      )}
      {/* Password Manager Tab */}
      {activeTab === 'password' && (
        <section className={sectionClass}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
            <form onSubmit={handlePwSubmit(onPasswordChange)}>
              <div className="mb-4">
                <label className={labelClass}>Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    {...pwRegister('old_password', { required: 'Current password is required' })}
                    className={inputClass + ' pr-10'}
                    placeholder="Current Password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
                    onClick={() => setShowCurrentPw((prev) => !prev)}
                    aria-label={showCurrentPw ? "Hide password" : "Show password"}
                  >
                    {showCurrentPw ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {pwErrors.old_password && <div className={errorClass}>{pwErrors.old_password.message}</div>}
              </div>
              <div className="mb-4">
                <label className={labelClass}>New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    {...pwRegister('new_password1', { required: 'New password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
                    className={inputClass + ' pr-10'}
                    placeholder="New Password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
                    onClick={() => setShowNewPw((prev) => !prev)}
                    aria-label={showNewPw ? "Hide password" : "Show password"}
                  >
                    {showNewPw ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {pwErrors.new_password1 && <div className={errorClass}>{pwErrors.new_password1.message}</div>}
              </div>
              <div className="mb-4">
                <label className={labelClass}>Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    {...pwRegister('new_password2', { required: 'Please confirm your new password', validate: (val) => val === passwordForm.watch('new_password1') || 'Passwords do not match' })}
                    className={inputClass + ' pr-10'}
                    placeholder="Confirm New Password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
                    onClick={() => setShowConfirmPw((prev) => !prev)}
                    aria-label={showConfirmPw ? "Hide password" : "Show password"}
                  >
                    {showConfirmPw ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {pwErrors.new_password2 && <div className={errorClass}>{pwErrors.new_password2.message}</div>}
              </div>
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50"
              >
                {pwLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminProfile; 