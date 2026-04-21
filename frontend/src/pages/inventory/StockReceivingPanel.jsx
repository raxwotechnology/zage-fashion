import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { createStockReceipt, getStockReceipts, getSuppliers } from '../../services/api';

const StockReceivingPanel = ({ storeId, products }) => {
  const user = useAuthStore((s) => s.user);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', qty: 1, unitCost: 0 }]);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState({ startDate: '', endDate: '' });

  const productOptions = useMemo(
    () => (products || []).filter(Boolean).map((p) => ({ id: p._id, label: p.name })),
    [products]
  );

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user?.role === 'admin' && storeId) params.storeId = storeId;
      const { data } = await getSuppliers(params);
      setSuppliers(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && !storeId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    fetchSuppliers();
  }, [storeId, user?.role]);

  const fetchHistory = async () => {
    try {
      const params = {};
      if (user?.role === 'admin' && storeId) params.storeId = storeId;
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;
      const { data } = await getStockReceipts(params);
      setHistory(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchHistory(); }, [storeId, range.startDate, range.endDate]);

  const addLine = () => setItems((prev) => [...prev, { productId: '', qty: 1, unitCost: 0 }]);
  const removeLine = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx, patch) => setItems((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role === 'admin' && !storeId) {
      toast.error('Please select a store');
      return;
    }
    if (!supplierId) {
      toast.error('Supplier is required');
      return;
    }
    const cleaned = items
      .map((l) => ({ ...l, qty: Number(l.qty), unitCost: Number(l.unitCost) }))
      .filter((l) => l.productId && l.qty > 0);
    if (cleaned.length === 0) {
      toast.error('Add at least one valid item');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplierId,
        invoiceNo: invoiceNo || undefined,
        receivedAt: receivedAt || undefined,
        notes: notes || undefined,
        items: cleaned,
      };
      if (user?.role === 'admin') payload.storeId = storeId;

      await createStockReceipt(payload);
      toast.success('Stock receipt saved');
      setSupplierId('');
      setInvoiceNo('');
      setReceivedAt('');
      setNotes('');
      setItems([{ productId: '', qty: 1, unitCost: 0 }]);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-dark-navy mb-4">Stock Receiving (GRN)</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1">Supplier *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-white">
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1">Invoice No</label>
            <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1">Received Date</label>
            <input type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-dark-navy mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
          </div>
        </div>

        <div className="border-t border-card-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-dark-navy">Items</h3>
            <button type="button" onClick={addLine} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-green hover:underline">
              <Plus size={16} /> Add line
            </button>
          </div>

          <div className="space-y-3">
            {items.map((l, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="text-xs text-muted-text block mb-1">Product *</label>
                  <select value={l.productId} onChange={(e) => updateLine(idx, { productId: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-white">
                    <option value="">Select product</option>
                    {productOptions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-text block mb-1">Qty *</label>
                  <input type="number" min="1" value={l.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs text-muted-text block mb-1">Unit Cost (LKR) *</label>
                  <input type="number" min="0" step="0.01" value={l.unitCost} onChange={(e) => updateLine(idx, { unitCost: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button type="button" onClick={() => removeLine(idx)} disabled={items.length === 1} className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-40" title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-primary-green hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Receipt'}
          </button>
        </div>
      </form>

      <div className="mt-8 bg-white rounded-2xl border border-card-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-dark-navy">Recent Receipts</h3>
          <div className="flex gap-2">
            <input type="date" value={range.startDate} onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))} className="border border-card-border rounded-xl py-2 px-3 text-sm" />
            <input type="date" value={range.endDate} onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))} className="border border-card-border rounded-xl py-2 px-3 text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">Supplier</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">Invoice</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {history.slice(0, 20).map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2.5 text-muted-text">{new Date(r.receivedAt || r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">{r.supplierId?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-text">{r.invoiceNo || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-text">{r.items?.length || 0}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-text">No receipts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockReceivingPanel;

