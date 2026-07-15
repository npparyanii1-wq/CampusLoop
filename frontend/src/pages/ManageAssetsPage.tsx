import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import type { Asset, Department } from '../types';

export default function ManageAssetsPage() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'equipment',
    departmentId: '',
    condition: 'excellent',
    status: 'available',
    bookingLeadTime: 0,
    isHighValue: false,
  });
  const { addToast } = useToastStore();

  useEffect(() => {
    loadAssets();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (user?.departmentId) {
      setForm((f) => ({ ...f, departmentId: user.departmentId || '' }));
    }
  }, [user]);

  const loadAssets = async () => {
    try {
      const data = await api.get<Asset[]>('/assets');
      setAssets(data);
    } catch {
      addToast('error', 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await api.get<Department[]>('/auth/departments').catch(() => []);
      setDepartments(data);
    } catch {
      // Quiet fail if not accessible
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/assets', {
        ...form,
        bookingLeadTime: Number(form.bookingLeadTime),
      });
      addToast('success', 'Asset registered successfully!');
      setShowCreate(false);
      setForm({
        name: '',
        description: '',
        category: 'equipment',
        departmentId: user?.departmentId || '',
        condition: 'excellent',
        status: 'available',
        bookingLeadTime: 0,
        isHighValue: false,
      });
      loadAssets();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/assets/${id}`, { status });
      addToast('success', 'Asset status updated');
      loadAssets();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      addToast('success', 'Asset removed');
      loadAssets();
    } catch (err: unknown) {
      addToast('error', (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 style={{ fontSize: 'var(--cl-font-3xl)', fontWeight: 800 }}>⚙️ Manage Assets</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            {user?.role === 'admin' ? 'Manage all university assets' : 'Manage your department\'s assets'}
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          + Register Asset
        </button>
      </div>

      <div className="glass-card glass-card--static" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Condition</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td className="font-semibold">{a.name}</td>
                <td>
                  <span className="badge badge--neutral">{a.category}</span>
                </td>
                <td>
                  <span className="badge badge--primary">{a.condition}</span>
                </td>
                <td className="text-secondary text-sm">{a.department?.name || '—'}</td>
                <td>
                  <select
                    className="form-select"
                    value={a.status}
                    onChange={(e) => handleStatusChange(a.id, e.target.value)}
                    style={{ width: 140, padding: '4px 8px', fontSize: 'var(--cl-font-xs)' }}
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </td>
                <td>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleDelete(a.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Register New Asset</h3>
              <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label" htmlFor="asset-name">Name</label>
                <input id="asset-name" className="form-input" placeholder="e.g. Electron Microscope #3" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="asset-desc">Description</label>
                <textarea id="asset-desc" className="form-textarea" placeholder="Asset description..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="asset-cat">Category</label>
                <select id="asset-cat" className="form-select" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="equipment">Equipment</option>
                  <option value="room">Room</option>
                  <option value="loanable">Loanable</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="asset-dept">Department</label>
                {user?.role === 'admin' && departments.length > 0 ? (
                  <select id="asset-dept" className="form-select" value={form.departmentId} onChange={(e) => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.faculty})</option>
                    ))}
                  </select>
                ) : (
                  <input id="asset-dept" className="form-input" value={user?.department?.name || 'My Department'} disabled />
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="asset-cond">Condition</label>
                <select id="asset-cond" className="form-select" value={form.condition} onChange={(e) => setForm(f => ({ ...f, condition: e.target.value }))}>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="asset-lead">Booking Lead Time (days)</label>
                <input id="asset-lead" className="form-input" type="number" min="0" value={form.bookingLeadTime} onChange={(e) => setForm(f => ({ ...f, bookingLeadTime: Number(e.target.value) }))} />
              </div>
              <div className="form-group flex-row items-center gap-sm">
                <input id="asset-highval" type="checkbox" checked={form.isHighValue} onChange={(e) => setForm(f => ({ ...f, isHighValue: e.target.checked }))} />
                <label className="form-label" htmlFor="asset-highval" style={{ cursor: 'pointer' }}>High Value Asset (Requires approval)</label>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleCreate} disabled={!form.name || !form.description || !form.departmentId}>Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
