import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import SelectDropdown from '../../components/SelectDropdown';
import StatusBadge from '../../components/StatusBadge';
import t from '../../theme';

const EQUIPMENT_STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational' },
  { value: 'under_repair', label: 'Under Repair' },
  { value: 'out_of_service', label: 'Out of Service' },
];

const MAINTENANCE_STATUS_OPTIONS = [
  { value: 'reported', label: 'Reported' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

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
            <SelectDropdown
              label="Equipment"
              value={issueForm.equipment_id}
              onChange={(val) => setIssueForm({ ...issueForm, equipment_id: val })}
              options={data.equipment_list.map(eq => ({ value: eq.equipment_id, label: `${eq.name} (${eq.type})` }))}
              placeholder="Select equipment..."
              searchable={data.equipment_list.length > 5}
            />
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
              <SelectDropdown
                value={r.status}
                onChange={(val) => updateStatus(r.equipment_id, val)}
                options={EQUIPMENT_STATUS_OPTIONS}
                placeholder="Status"
                searchable={false}
                floating
              />
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
              <SelectDropdown
                value={r.status}
                onChange={(val) => updateMaintenance(r.log_id, val)}
                options={MAINTENANCE_STATUS_OPTIONS}
                placeholder="Status"
                searchable={false}
                floating
              />
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
