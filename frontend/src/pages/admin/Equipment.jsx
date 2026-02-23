import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import t from '../../theme';

export default function Equipment() {
  const [data, setData] = useState(null);
  const [issueForm, setIssueForm] = useState({ equipment_id: '', issue_description: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/admin/equipment').then(setData), []);
  useEffect(() => { load(); }, [load]);

  async function logIssue(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/equipment/issue', issueForm);
      toast.success('Issue logged.');
      setIssueForm({ equipment_id: '', issue_description: '' });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function updateStatus(equipmentId, status) {
    try { await api.put(`/admin/equipment/${equipmentId}/status`, { status }); toast.success('Status updated.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  async function updateMaintenance(logId, status) {
    const body = { status };
    if (status === 'resolved') body.resolved_date = new Date().toISOString().split('T')[0];
    try { await api.put(`/admin/equipment/maintenance/${logId}`, body); toast.success('Log updated.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (!data) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Equipment & Maintenance</h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-200">Log Maintenance Issue</h2>
        <form onSubmit={logIssue} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Equipment</label>
            <select className={t.input} value={issueForm.equipment_id} onChange={e => setIssueForm({ ...issueForm, equipment_id: e.target.value })} required>
              <option value="">Select equipment...</option>
              {data.equipment_list.map(eq => <option key={eq.equipment_id} value={eq.equipment_id}>{eq.name} ({eq.type})</option>)}
            </select>
          </div>
          <div className="min-w-[250px] flex-[2]">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Description</label>
            <input className={t.input} value={issueForm.issue_description} onChange={e => setIssueForm({ ...issueForm, issue_description: e.target.value })} required placeholder="Describe the issue..." />
          </div>
          <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Logging...' : 'Log Issue'}</button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Equipment Inventory</h2>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type', filter: 'enum' },
            { key: 'status', label: 'Status', filter: 'enum', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'purchase_date', label: 'Purchased', filter: 'date', render: (r) => fmtDate(r.purchase_date) },
            { key: 'last_maintenance_date', label: 'Last Maint.', render: (r) => fmtDate(r.last_maintenance_date) },
            { key: 'action', label: 'Action', render: (r) => (
              <select className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 text-xs"
                value={r.status} onChange={e => updateStatus(r.equipment_id, e.target.value)}>
                <option value="operational">Operational</option>
                <option value="under_repair">Under Repair</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            )},
          ]}
          data={data.equipment_list}
          emptyMessage="No equipment found."
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Maintenance Logs</h2>
        <DataTable
          columns={[
            { key: 'equipment_name', label: 'Equipment', filter: 'enum' },
            { key: 'equipment_type', label: 'Type', filter: 'enum' },
            { key: 'issue_description', label: 'Issue' },
            { key: 'reported_date', label: 'Reported', filter: 'date', render: (r) => fmtDate(r.reported_date) },
            { key: 'resolved_date', label: 'Resolved', render: (r) => fmtDate(r.resolved_date) },
            { key: 'status', label: 'Status', filter: 'enum', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'action', label: '', render: (r) => r.status !== 'resolved' && (
              <select className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 text-xs"
                value={r.status} onChange={e => updateMaintenance(r.log_id, e.target.value)}>
                <option value="reported">Reported</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            )},
          ]}
          data={data.maintenance_logs}
          emptyMessage="No maintenance logs."
        />
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
