'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Gift, 
  Search, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Trash2, 
  Edit3, 
  Plus, 
  History, 
  ArrowLeft,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { api } from '@/services/api';

interface BonusHistoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface IBonusEmployeeItem {
  userId: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  monthlySalary: number;
  basicSalary: number;
  bonusAmount: number;
  remarks?: string;
}

interface IBonusRecord {
  _id: string;
  title: string;
  month: number;
  year: number;
  totalAmount: number;
  distributedCount: number;
  employees: IBonusEmployeeItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BonusHistoryManager({ isOpen, onClose, onUpdate }: BonusHistoryManagerProps) {
  // Main page is distribution history by default
  const [viewMode, setViewMode] = useState<'entry' | 'history'>('history');
  const [historyList, setHistoryList] = useState<IBonusRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form State
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [bonusTitle, setBonusTitle] = useState<string>('');
  const [bonusNotes, setBonusNotes] = useState<string>('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Employees in the entry form
  const [employees, setEmployees] = useState<IBonusEmployeeItem[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Status banners
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingNotice, setExistingNotice] = useState<string | null>(null);

  // Load history records
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api('/api/admin/payroll/bonus-history');
      const data = await res.json();
      if (res.ok && data.bonusHistories) {
        setHistoryList(data.bonusHistories);
      }
    } catch (err: any) {
      console.error('Failed to load bonus history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load employees & existing record for selected month/year
  const fetchEmployeesForMonth = async (month: number, year: number) => {
    setIsLoadingEmployees(true);
    setError(null);
    setExistingNotice(null);

    try {
      const res = await api(`/api/admin/payroll/bonus-history?fetchEmployees=true&month=${month}&year=${year}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load employee list');
      }

      if (data.existingRecord) {
        setEditingRecordId(data.existingRecord._id);
        setBonusTitle(data.existingRecord.title || '');
        setBonusNotes(data.existingRecord.notes || '');
        setExistingNotice(`Existing distribution found for ${MONTH_NAMES[month - 1]} ${year}. Saving will update this record.`);
      } else {
        setEditingRecordId(null);
        if (!bonusTitle || bonusTitle.includes('Bonus')) {
          setBonusTitle(`${MONTH_NAMES[month - 1]} Bonus ${year}`);
        }
      }

      setEmployees(data.employees || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Always reset to history view when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode('history');
      setEditingRecordId(null);
      setError(null);
      setSuccess(null);
      fetchHistory();
    }
  }, [isOpen]);

  const handleBackToHistory = () => {
    setEditingRecordId(null);
    setError(null);
    setExistingNotice(null);
    setViewMode('history');
    fetchHistory();
  };

  const handleStartNewDistribution = () => {
    setEditingRecordId(null);
    const m = currentDate.getMonth() + 1;
    const y = currentDate.getFullYear();
    setSelectedMonth(m);
    setSelectedYear(y);
    setBonusTitle(`${MONTH_NAMES[m - 1]} Bonus ${y}`);
    setBonusNotes('');
    setError(null);
    setSuccess(null);
    setExistingNotice(null);
    setViewMode('entry');
    fetchEmployeesForMonth(m, y);
  };

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setSuccess(null);
    fetchEmployeesForMonth(newMonth, newYear);
  };

  const handleBonusAmountChange = (userId: string, newAmountStr: string) => {
    const val = Math.max(0, Number(newAmountStr) || 0);
    setEmployees(prev =>
      prev.map(emp => (emp.userId === userId ? { ...emp, bonusAmount: val } : emp))
    );
  };

  const handleRemarksChange = (userId: string, remarks: string) => {
    setEmployees(prev =>
      prev.map(emp => (emp.userId === userId ? { ...emp, remarks } : emp))
    );
  };

  // Bulk actions: 50% and 100% of Total Salary (Basic Pay + HRA + DA = monthlySalary)
  const applyFiftyPercentTotalSalaryToAll = () => {
    setEmployees(prev =>
      prev.map(emp => ({
        ...emp,
        bonusAmount: Math.round((Number(emp.monthlySalary) || 0) * 0.5)
      }))
    );
  };

  const applyHundredPercentTotalSalaryToAll = () => {
    setEmployees(prev =>
      prev.map(emp => ({
        ...emp,
        bonusAmount: Math.round(Number(emp.monthlySalary) || 0)
      }))
    );
  };

  const setAllToZero = () => {
    setEmployees(prev =>
      prev.map(emp => ({
        ...emp,
        bonusAmount: 0
      }))
    );
  };

  // Calculations
  const totalPayout = useMemo(() => {
    return employees.reduce((sum, e) => sum + (Number(e.bonusAmount) || 0), 0);
  }, [employees]);

  const recipientCount = useMemo(() => {
    return employees.filter(e => (Number(e.bonusAmount) || 0) > 0).length;
  }, [employees]);

  // Filtered employees by search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Save Bonus Distribution
  const handleSave = async () => {
    if (!bonusTitle.trim()) {
      setError('Please provide a Bonus Title (e.g., Diwali Bonus 2026)');
      return;
    }

    if (employees.length === 0) {
      setError('No employees available to distribute bonus');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        id: editingRecordId,
        title: bonusTitle.trim(),
        month: selectedMonth,
        year: selectedYear,
        notes: bonusNotes.trim(),
        employees: employees.map(e => ({
          userId: e.userId,
          employeeId: e.employeeId,
          name: e.name,
          department: e.department,
          designation: e.designation,
          monthlySalary: e.monthlySalary,
          basicSalary: e.basicSalary,
          bonusAmount: Number(e.bonusAmount) || 0,
          remarks: e.remarks || ''
        }))
      };

      const res = await api('/api/admin/payroll/bonus-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save bonus distribution');
      }

      setSuccess(`Bonus distribution for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} saved successfully! It will be applied during payroll generation.`);
      setEditingRecordId(null);
      fetchHistory();
      if (onUpdate) onUpdate();
      // Return to main history page
      setViewMode('history');
    } catch (err: any) {
      setError(err.message || 'Error saving bonus distribution');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit from history record
  const handleEditRecord = (record: IBonusRecord) => {
    setSelectedYear(record.year);
    setSelectedMonth(record.month);
    setBonusTitle(record.title);
    setBonusNotes(record.notes || '');
    setEditingRecordId(record._id);
    setViewMode('entry');
    setSuccess(null);
    fetchEmployeesForMonth(record.month, record.year);
  };

  // Delete from history
  const handleDeleteRecord = async (record: IBonusRecord) => {
    if (!confirm(`Are you sure you want to delete the bonus distribution "${record.title}" (${MONTH_NAMES[record.month - 1]} ${record.year})?`)) {
      return;
    }

    try {
      const res = await api(`/api/admin/payroll/bonus-history?id=${record._id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete record');

      fetchHistory();
      if (editingRecordId === record._id) {
        setEditingRecordId(null);
      }
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-card border border-border text-card-foreground rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30">
          {viewMode === 'history' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  Bonus History
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review historical one-time bonus records or initiate a new bulk distribution.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-bold rounded-xl transition-colors border border-border"
                title="Back to Bonus History"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  {editingRecordId ? 'Edit Bonus Distribution' : 'New Bonus Distribution'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingRecordId
                    ? `Updating bonus for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                    : `Bulk assign one-time bonuses for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} without altering salary timelines.`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {viewMode === 'entry' && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                editingRecordId
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                {editingRecordId ? 'Editing Record' : 'New Distribution'}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {existingNotice && viewMode === 'entry' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0 text-blue-500" />
              <span>{existingNotice}</span>
            </div>
          )}

          {/* VIEW MODE 1: BONUS HISTORY (MAIN PAGE) */}
          {viewMode === 'history' ? (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Distribution Records ({historyList.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select an existing distribution to edit or click &quot;New Distribution&quot; to assign bonuses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartNewDistribution}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  New Distribution
                </button>
              </div>
              {isLoadingHistory ? (
                <div className="p-12 text-center text-xs text-muted-foreground font-bold">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading bonus history...
                </div>
              ) : historyList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-muted/20">
                  <Gift className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                  <div className="text-sm font-bold text-foreground">No Bonus History Records</div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    You haven&apos;t created any bulk bonus distributions yet. Click below to create your first bonus distribution.
                  </p>
                  <button
                    onClick={handleStartNewDistribution}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Bonus Distribution
                  </button>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/40">
                      <tr>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Bonus Title
                        </th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Period
                        </th>
                        <th scope="col" className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Recipients
                        </th>
                        <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Total Distributed
                        </th>
                        <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {historyList.map(record => (
                        <tr key={record._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                              {record.title}
                            </div>
                            {record.notes && (
                              <div className="text-xs text-muted-foreground mt-0.5">{record.notes}</div>
                            )}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-muted border border-border text-foreground text-xs font-bold rounded-lg inline-block">
                              {MONTH_NAMES[record.month - 1]} {record.year}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-center">
                            <span className="text-xs font-bold text-emerald-500">
                              {record.distributedCount || (record.employees?.filter(e => e.bonusAmount > 0).length || 0)} employees
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-bold text-foreground">
                              ₹{(record.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditRecord(record)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                title="Edit this bonus distribution"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record)}
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE 2: ENTRY / EDIT FORM */
            <div className="space-y-5">
              {/* Top Configuration Controls */}
              <div className="bg-muted/40 p-4 border border-border rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bonus Title */}
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Bonus Name / Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Diwali Bonus 2026"
                      className="w-full bg-background border border-border rounded-xl text-foreground px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary placeholder:font-normal"
                      value={bonusTitle}
                      onChange={e => setBonusTitle(e.target.value)}
                    />
                  </div>

                  {/* Month */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Payroll Month <span className="text-destructive">*</span>
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-xl text-foreground px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      value={selectedMonth}
                      onChange={e => handleMonthYearChange(Number(e.target.value), selectedYear)}
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Year <span className="text-destructive">*</span>
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-xl text-foreground px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      value={selectedYear}
                      onChange={e => handleMonthYearChange(selectedMonth, Number(e.target.value))}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(yr => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Approved semi-annual performance bonus for all active team members"
                    className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                    value={bonusNotes}
                    onChange={e => setBonusNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Table Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="relative max-w-sm w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search staff by name, ID, department..."
                    className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-foreground text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={applyFiftyPercentTotalSalaryToAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-colors border border-primary/20"
                    title="Fill all rows with 50% of Total Salary (Basic Pay + HRA + DA)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    50% of Total Salary
                  </button>
                  <button
                    type="button"
                    onClick={applyHundredPercentTotalSalaryToAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-xl transition-colors shadow-sm"
                    title="Fill all rows with 100% of Total Salary (Full month: Basic Pay + HRA + DA)"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    100% of Total Salary
                  </button>
                  <button
                    type="button"
                    onClick={setAllToZero}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-colors border border-border"
                    title="Set all bonus fields to 0"
                  >
                    Clear All (₹0)
                  </button>
                </div>
              </div>

              {/* Employees Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/40 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Employee
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Dept & Role
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <div>Total Salary</div>
                          <div className="text-[10px] text-muted-foreground/70 normal-case font-normal">(Basic + HRA + DA)</div>
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Basic Pay
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-bold text-primary uppercase tracking-wider w-[200px]">
                          Bonus Amount (₹)
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {isLoadingEmployees ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground font-bold">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                            Loading employee list...
                          </td>
                        </tr>
                      ) : filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-xs text-muted-foreground font-bold">
                            No employees match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map(emp => {
                          return (
                            <tr key={emp.userId} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs font-bold text-foreground">{emp.name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">{emp.employeeId}</div>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs text-foreground font-medium">{emp.department}</div>
                                <div className="text-[10px] text-muted-foreground">{emp.designation}</div>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold text-foreground">
                                ₹{emp.monthlySalary.toLocaleString('en-IN')}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-xs font-bold text-foreground">
                                  ₹{emp.basicSalary.toLocaleString('en-IN')}
                                </div>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    className={`w-full pl-6 pr-2 py-1.5 rounded-lg border text-xs font-bold outline-none focus:ring-1 focus:ring-primary ${
                                      emp.bonusAmount > 0
                                        ? 'bg-background border-primary/40 text-primary'
                                        : 'bg-muted/30 border-border text-muted-foreground'
                                    }`}
                                    value={emp.bonusAmount}
                                    onChange={e => handleBonusAmountChange(emp.userId, e.target.value)}
                                  />
                                </div>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="text"
                                  placeholder="Add note..."
                                  className="w-full bg-background border border-border rounded-lg text-foreground px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                                  value={emp.remarks || ''}
                                  onChange={e => handleRemarksChange(emp.userId, e.target.value)}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          {viewMode === 'history' ? (
            <>
              <div className="text-xs text-muted-foreground">
                Total distributions recorded: <span className="font-bold text-foreground">{historyList.length}</span>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-muted text-foreground text-xs font-bold rounded-xl hover:bg-accent transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground font-medium">
                {recipientCount} staff receiving total <span className="text-primary font-bold">₹{totalPayout.toLocaleString('en-IN')}</span> bonus for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleBackToHistory}
                  disabled={isSaving}
                  className="px-4 py-2 bg-muted text-foreground text-xs font-bold rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancel / Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || employees.length === 0}
                  className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {editingRecordId ? 'Update Distribution' : 'Save Bonus Distribution'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
