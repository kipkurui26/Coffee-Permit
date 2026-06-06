import React, { useEffect, useState } from 'react';
import AxiosInstance from '../../../utils/AxiosInstance';
import { useToast } from "../../../context/ToastContext";

const roleColors = {
  ADMIN: 'bg-amber-100 text-amber-800',
  STAFF: 'bg-blue-100 text-blue-800',
  FARMER: 'bg-green-100 text-green-800',
};

const statusColors = {
  true: 'bg-green-100 text-green-800',   // Active
  false: 'bg-yellow-100 text-yellow-800', // Pending/Inactive
};

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await AxiosInstance.get('users/users/');
      setUsers(response.data);
    } catch (err) {
      showToast('Failed to fetch users', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('Approve this user? Their society will also be approved.')) return;
    try {
      await AxiosInstance.post(`users/users/${userId}/approve/`);
      showToast('User approved successfully', "success");
      fetchUsers();
    } catch (err) {
      showToast('Failed to approve user', "error");
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // Cancelled
    try {
      await AxiosInstance.post(`users/users/${userId}/reject/`, { rejection_reason: reason });
      showToast('User rejected successfully', "success");
      fetchUsers();
    } catch (err) {
      showToast('Failed to reject user', "error");
    }
  };

  // Filtering logic
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(search.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(search.toLowerCase())) ||
      (user.phone_no && user.phone_no.includes(search));
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesStatus = statusFilter
      ? (statusFilter === 'active' ? user.is_active : !user.is_active)
      : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone"
          className="rounded-md border-amber-300 px-3 py-2 focus:border-amber-600 focus:ring-amber-600"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="rounded-md border-amber-300 px-3 py-2 focus:border-amber-600 focus:ring-amber-600"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="FARMER">Farmer</option>
        </select>
        <select
          className="rounded-md border-amber-300 px-3 py-2 focus:border-amber-600 focus:ring-amber-600"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending/Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Managed Society</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[user.is_active]}`}>
                      {user.is_active ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.managed_society ? user.managed_society.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.is_active ? (
                      <button
                        className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold"
                        onClick={() => handleReject(user.id)}
                      >
                        Reject
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold"
                        onClick={() => handleApprove(user.id)}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;