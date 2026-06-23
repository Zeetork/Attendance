'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function ShiftsClient() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shiftName: '',
    startTime: '09:00',
    endTime: '18:00',
    graceTime: 15,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    isActive: true
  });

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchShifts = async () => {
    try {
      const res = await axios.get('/api/shifts');
      setShifts(res.data.shifts || []);
    } catch (err) {
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenModal = (shift: any = null) => {
    if (shift) {
      setEditingId(shift._id);
      setFormData({
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        graceTime: shift.graceTime,
        workingDays: shift.workingDays || [],
        isActive: shift.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        shiftName: '',
        startTime: '09:00',
        endTime: '18:00',
        graceTime: 15,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shiftName || formData.workingDays.length === 0) {
      toast.error('Please provide a name and at least one working day');
      return;
    }
    try {
      if (editingId) {
        await axios.put(`/api/shifts/${editingId}`, formData);
        toast.success('Shift updated');
      } else {
        await axios.post('/api/shifts', formData);
        toast.success('Shift created');
      }
      setIsModalOpen(false);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save shift');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    try {
      await axios.delete(`/api/shifts/${id}`);
      toast.success('Shift deleted');
      fetchShifts();
    } catch (err) {
      toast.error('Failed to delete shift');
    }
  };

  if (loading) return <div className="text-foreground font-bold text-center p-6">Loading shifts...</div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Shift Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure work timings and weekly offs</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 min-h-[44px] rounded-xl font-bold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" /> New Shift
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-bold">Shift Name</th>
              <th className="px-6 py-3 font-bold">Timings</th>
              <th className="px-6 py-3 font-bold">Working Days</th>
              <th className="px-6 py-3 font-bold">Grace Time</th>
              <th className="px-6 py-3 font-bold">Status</th>
              <th className="px-6 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shifts.map((s) => (
              <tr key={s._id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-bold text-card-foreground">{s.shiftName}</td>
                <td className="px-6 py-4 text-card-foreground font-bold">{s.startTime} - {s.endTime}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {s.workingDays?.map((d: string) => (
                      <span key={d} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full border border-border font-bold">
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-card-foreground font-bold">{s.graceTime} mins</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${s.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenModal(s)} className="text-primary hover:text-primary/80 p-1"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s._id)} className="text-destructive hover:text-destructive/80 p-1 ml-2"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-bold">No shifts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-card-foreground mb-4">{editingId ? 'Edit Shift' : 'Create Shift'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">Shift Name</label>
                <input 
                  type="text" required
                  value={formData.shiftName} onChange={e => setFormData({...formData, shiftName: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl min-h-[44px] p-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-card-foreground mb-1">Start Time</label>
                  <input 
                    type="time" required
                    value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl min-h-[44px] p-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-card-foreground mb-1">End Time</label>
                  <input 
                    type="time" required
                    value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl min-h-[44px] p-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">Grace Time (Minutes)</label>
                <input 
                  type="number" min="0" required
                  value={formData.graceTime} onChange={e => setFormData({...formData, graceTime: parseInt(e.target.value)})}
                  className="w-full bg-background border border-border rounded-xl min-h-[44px] p-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-2">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {allDays.map(day => (
                    <button
                      key={day} type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 min-h-[36px] rounded-full text-sm font-bold transition-colors ${
                        formData.workingDays.includes(day) 
                          ? 'bg-primary text-primary-foreground border border-primary' 
                          : 'bg-muted text-muted-foreground border border-border hover:border-muted-foreground'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center mt-2">
                <input 
                  type="checkbox" id="isActive"
                  checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-2 rounded border-border bg-background text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-card-foreground">Active Shift</label>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 min-h-[44px] text-sm font-bold text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card">Save Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
