import { useState, useEffect } from 'react';
import { Wallet, Search, ArrowLeft, CreditCard, TrendingUp, TrendingDown, DollarSign, Download, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import managerNavItems from './managerNavItems';
import { getSupplierPaymentSummary, getSupplierLedger, recordSupplierPayment, recordSupplierPurchase } from '../../services/api';
import { toast } from 'react-toastify';

const ManagerSupplierPayments = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payDescription, setPayDescription] = useState('');
  const [paying, setPaying] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ totalCost: '', amountPaid: '', description: '' });

  const fetchSummary = async () => {
    try { setLoading(true); const res = await getSupplierPaymentSummary(); setSuppliers(res.data); }
    catch (err) { toast.error('Failed to load supplier payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSummary(); }, []);

  const openLedger = async (supplier) => {
    setSelectedSupplier(supplier);
    setLedgerLoading(true);
    try { const res = await getSupplierLedger(supplier._id); setLedger(res.data); }
    catch (err) { toast.error('Failed to load ledger'); }
    finally { setLedgerLoading(false); }
  };

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return toast.error('Enter valid amount');
    setPaying(true);
    try {
      await recordSupplierPayment(selectedSupplier._id, { amount: Number(payAmount), paymentMethod: payMethod, description: payDescription || undefined });
      toast.success('Payment recorded');
      setShowPayModal(false); setPayAmount(''); setPayDescription('');
      openLedger(selectedSupplier); fetchSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed'); }
    finally { setPaying(false); }
  };

  const handlePurchase = async () => {
    if (!purchaseForm.totalCost || Number(purchaseForm.totalCost) <= 0) return toast.error('Enter total cost');
    setPaying(true);
    try {
      await recordSupplierPurchase(selectedSupplier._id, {
        totalCost: Number(purchaseForm.totalCost),
        amountPaid: Number(purchaseForm.amountPaid || 0),
        description: purchaseForm.description || undefined,
      });
      toast.success('Purchase recorded!');
      setShowPurchaseModal(false);
      setPurchaseForm({ totalCost: '', amountPaid: '', description: '' });
      openLedger(selectedSupplier); fetchSummary();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPaying(false); }
  };

  const filtered = suppliers.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));
  const totalDue = suppliers.reduce((s, sup) => s + (sup.balanceDue || 0), 0);

  if (selectedSupplier) {
    return (
      <DashboardLayout navItems={managerNavItems} title="Manager Dashboard">
        <div style={{ maxWidth: '1000px' }}>
          <button onClick={() => { setSelectedSupplier(null); setLedger(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#d946a0', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #fbcfe8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', fontWeight: 800 }}>{selectedSupplier.name}</h2>
                <p style={{ margin: 0, color: '#7b6f69', fontSize: '0.85rem' }}>{selectedSupplier.phone} {selectedSupplier.email && `· ${selectedSupplier.email}`}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setShowPurchaseModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid #d946a0', background: 'white', color: '#d946a0', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  <TrendingUp size={16} /> Record Purchase
                </button>
                <button onClick={() => setShowPayModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #d946a0, #c026d3)', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  <CreditCard size={16} /> Record Payment
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {[
                { label: 'Purchased', value: ledger?.totalPurchased || 0, color: '#1f1f1f' },
                { label: 'Paid', value: ledger?.totalPaid || 0, color: '#059669' },
                { label: 'Due', value: ledger?.balanceDue || 0, color: ledger?.balanceDue > 0 ? '#dc2626' : '#059669' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #eaded6', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.15rem', fontSize: '0.7rem', color: '#7b6f69', textTransform: 'uppercase', fontWeight: 600 }}>{c.label}</p>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: c.color }}>LKR {c.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eaded6', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #eaded6' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Transaction Ledger</h3>
            </div>
            {ledgerLoading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#7b6f69' }}>Loading...</div> :
            !ledger?.transactions?.length ? <div style={{ padding: '3rem', textAlign: 'center', color: '#7b6f69' }}>No transactions</div> :
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#fdf2f8' }}>
                    {['Date', 'Type', 'Description', 'Amount', 'Balance'].map((h) => (
                      <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontWeight: 700, color: '#7b6f69', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.transactions.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f0ec' }}>
                      <td style={{ padding: '0.65rem 1rem' }}>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: t.type === 'purchase' ? '#fef3c7' : '#d1fae5', color: t.type === 'purchase' ? '#92400e' : '#065f46' }}>
                          {t.type === 'purchase' ? 'PURCHASE' : 'PAYMENT'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', color: '#7b6f69' }}>{t.description}</td>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: t.type === 'purchase' ? '#dc2626' : '#059669' }}>
                        {t.type === 'purchase' ? '+' : '-'} LKR {t.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: t.runningBalance > 0 ? '#dc2626' : '#059669' }}>LKR {t.runningBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </div>
        </div>

        {showPayModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Record Payment</h3>
                <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#7b6f69', marginBottom: '0.35rem' }}>Amount (LKR)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #eaded6', fontSize: '1.1rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#7b6f69', marginBottom: '0.35rem' }}>Method</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['cash', 'bank_transfer', 'cheque'].map((m) => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1px solid ${payMethod === m ? '#d946a0' : '#eaded6'}`, background: payMethod === m ? '#fdf2f8' : 'white', color: payMethod === m ? '#d946a0' : '#7b6f69', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#7b6f69', marginBottom: '0.35rem' }}>Note</label>
                <input type="text" value={payDescription} onChange={(e) => setPayDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #eaded6', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handlePayment} disabled={paying}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #d946a0, #c026d3)', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: paying ? 0.7 : 1 }}>
                {paying ? 'Processing...' : `Pay LKR ${Number(payAmount || 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {showPurchaseModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Record Purchase</h3>
                <button onClick={() => setShowPurchaseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#7b6f69', background: '#fdf2f8', padding: '0.6rem', borderRadius: '8px' }}>
                💡 Enter total cost and optional partial payment. Remaining is tracked as balance.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#7b6f69', marginBottom: '0.35rem' }}>Total Cost (LKR) *</label>
                <input type="number" value={purchaseForm.totalCost} onChange={(e) => setPurchaseForm({...purchaseForm, totalCost: e.target.value})} placeholder="e.g. 10000"
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #eaded6', fontSize: '1.1rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#7b6f69', marginBottom: '0.35rem' }}>Paid Now (LKR)</label>
                <input type="number" value={purchaseForm.amountPaid} onChange={(e) => setPurchaseForm({...purchaseForm, amountPaid: e.target.value})} placeholder="Optional"
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #eaded6', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {purchaseForm.totalCost && (
                <div style={{ background: '#fef2f2', padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#dc2626' }}>Balance: LKR {(Number(purchaseForm.totalCost || 0) - Number(purchaseForm.amountPaid || 0)).toLocaleString()}</strong>
                </div>
              )}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#7b6f69', marginBottom: '0.35rem' }}>Description</label>
                <input type="text" value={purchaseForm.description} onChange={(e) => setPurchaseForm({...purchaseForm, description: e.target.value})} placeholder="Stock batch..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #eaded6', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handlePurchase} disabled={paying}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #d946a0, #c026d3)', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: paying ? 0.7 : 1 }}>
                {paying ? 'Processing...' : 'Record Purchase'}
              </button>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={managerNavItems} title="Manager Dashboard">
      <div style={{ maxWidth: '1000px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800 }}>Supplier Payments</h1>
          <p style={{ margin: 0, color: '#7b6f69', fontSize: '0.85rem' }}>Total Due: <strong style={{ color: totalDue > 0 ? '#dc2626' : '#059669' }}>LKR {totalDue.toLocaleString()}</strong></p>
        </div>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#7b6f69' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: '12px', border: '1px solid #eaded6', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eaded6', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#7b6f69' }}>Loading...</div> :
          !filtered.length ? <div style={{ padding: '3rem', textAlign: 'center', color: '#7b6f69' }}>No suppliers</div> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#fdf2f8' }}>
                  {['Supplier', 'Purchased', 'Paid', 'Balance Due', ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#7b6f69', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid #f5f0ec', cursor: 'pointer' }} onClick={() => openLedger(s)}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{s.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>LKR {(s.totalPurchased || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#059669' }}>LKR {(s.totalPaid || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '8px', fontWeight: 700, background: s.balanceDue > 0 ? '#fef2f2' : '#d1fae5', color: s.balanceDue > 0 ? '#dc2626' : '#059669' }}>
                        LKR {(s.balanceDue || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedSupplier(s); setShowPayModal(true); }}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none', background: '#fdf2f8', color: '#d946a0', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>Pay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerSupplierPayments;
