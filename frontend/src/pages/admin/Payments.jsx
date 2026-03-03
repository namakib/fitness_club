import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import NumberInput from '../../components/NumberInput';
import SelectDropdown from '../../components/SelectDropdown';
import t from '../../theme';

export default function Payments() {
  const [data, setData] = useState(null);
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ member_id: '', amount: '', payment_status: 'pending', payment_method: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/payments').then(d => setData(d.payments || []));
    api.get('/admin/room-booking').then(d => setMembers(d.members || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/payments', {
        member_id: Number(form.member_id),
        amount: Number(form.amount),
        payment_status: form.payment_status || 'pending',
        payment_method: form.payment_method || null,
      });
      toastSuccess('Payment recorded.');
      setModalOpen(false);
      setForm({ member_id: '', amount: '', payment_status: 'pending', payment_method: '' });
      load();
    } catch (err) {
      toastError(err.message, err.details);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payments</h1>
        <button onClick={() => setModalOpen(true)} className={t.btnSmall}>
          + Record Payment
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Simulated billing records. No real payment processing.
      </p>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <form onSubmit={submit} className="space-y-4">
          <SelectDropdown
            label="Member"
            value={form.member_id}
            onChange={(val) => setForm({ ...form, member_id: val })}
            options={members.map(m => ({ value: m.member_id, label: `${m.name} (${m.email})` }))}
            placeholder="Select member"
            searchable={members.length > 5}
          />
          <NumberInput
            label="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            step={0.01}
            min={0}
            placeholder="0.00"
            required
            fullWidth
          />
          <SelectDropdown
            label="Status"
            value={form.payment_status}
            onChange={(val) => setForm({ ...form, payment_status: val })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ]}
            placeholder="Select status"
            searchable={false}
          />
          <SelectDropdown
            label="Payment Method (optional)"
            value={form.payment_method}
            onChange={(val) => setForm({ ...form, payment_method: val })}
            options={[
              { value: '', label: '—' },
              { value: 'credit_card', label: 'Credit Card' },
              { value: 'debit', label: 'Debit' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' },
            ]}
            placeholder="Select method"
            searchable={false}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className={t.cancelButton}>Cancel</button>
            <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <DataTable
        columns={[
          { key: 'payment_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.payment_date) },
          { key: 'member_name', label: 'Member', filter: 'enum' },
          { key: 'amount', label: 'Amount', render: (r) => `$${Number(r.amount).toFixed(2)}` },
          { key: 'payment_status', label: 'Status', filter: 'enum', render: (r) => <span className="capitalize">{r.payment_status}</span> },
          { key: 'payment_method', label: 'Method', filter: 'enum' },
        ]}
        data={data}
        emptyMessage="No payments recorded."
      />
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
