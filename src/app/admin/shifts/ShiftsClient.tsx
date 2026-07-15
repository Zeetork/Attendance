'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function ShiftsClient() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    shiftName: string;
    sessions: { startTime: string; endTime: string; graceTime: number }[];
    workingDays: string[];
    isActive: boolean;
  }>({
    shiftName: '',
    sessions: [{ startTime: '09:00', endTime: '18:00', graceTime: 15 }],
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
        sessions: shift.sessions?.length > 0 ? shift.sessions : [{ startTime: shift.startTime || '09:00', endTime: shift.endTime || '18:00', graceTime: shift.graceTime || 0 }],
        workingDays: shift.workingDays || [],
        isActive: shift.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        shiftName: '',
        sessions: [{ startTime: '09:00', endTime: '18:00', graceTime: 15 }],
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

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, { startTime: '', endTime: '', graceTime: 0 }]
    }));
  };

  const updateSession = (index: number, field: string, value: any) => {
    const newSessions = [...formData.sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    setFormData({ ...formData, sessions: newSessions });
  };

  const removeSession = (index: number) => {
    if (formData.sessions.length === 1) return;
    const newSessions = formData.sessions.filter((_, i) => i !== index);
    setFormData({ ...formData, sessions: newSessions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shiftName || formData.workingDays.length === 0) {
      toast.error('Please provide a name and at least one working day');
      return;
    }
    
    // Sort before sending
    const sortedSessions = [...formData.sessions].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const finalData = { ...formData, sessions: sortedSessions };

    try {
      if (editingId) {
        await axios.put(`/api/shifts/${editingId}`, finalData);
        toast.success('Shift updated');
      } else {
        await axios.post('/api/shifts', finalData);
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
          <p className="text-sm text-muted-foreground mt-1">Configure multi-session work timings and weekly offs</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 min-h-[44px] rounded-xl font-bold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Shift
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-bold">Shift Name</th>
              <th className="px-6 py-3 font-bold">Sessions</th>
              <th className="px-6 py-3 font-bold">Working Days</th>
              <th className="px-6 py-3 font-bold">Status</th>
              <th className="px-6 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shifts.map((s) => (
              <tr key={s._id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-bold text-card-foreground align-top">{s.shiftName}</td>
                <td className="px-6 py-4 text-card-foreground font-bold align-top">
                  <div className="space-y-1">
                    {s.sessions && s.sessions.length > 0 ? (
                      s.sessions.map((sess: any, idx: number) => (
                        <div key={idx} className="text-xs bg-muted/30 p-1 px-2 rounded border border-border inline-block mr-2 mb-2">
                          S{idx + 1}: {sess.startTime} - {sess.endTime} ({sess.graceTime}m grace)
                        </div>
                      ))
                    ) : (
                      <span className="text-xs">{s.startTime} - {s.endTime}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {s.workingDays?.map((d: string) => (
                      <span key={d} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full border border-border font-bold">
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${s.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <button onClick={() => handleOpenModal(s)} className="text-primary hover:text-primary/80 p-1"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s._id)} className="text-destructive hover:text-destructive/80 p-1 ml-2"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-bold">No shifts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-card-foreground">{editingId ? 'Edit Shift' : 'Create Shift'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">Shift Name</label>
                <input 
                  type="text" required
                  value={formData.shiftName} onChange={e => setFormData({...formData, shiftName: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl min-h-[44px] p-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-card-foreground mb-2">Sessions</label>
                <div className="space-y-4">
                  {formData.sessions.map((sess, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-xl bg-muted/20 relative">
                      <div className="absolute top-2 left-3 text-xs font-bold text-muted-foreground">Session {idx + 1}</div>
                      {formData.sessions.length > 1 && (
                        <button type="button" onClick={() => removeSession(idx)} className="absolute top-2 right-2 text-destructive hover:text-destructive/80 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div>
                          <label className="block text-xs font-bold text-card-foreground mb-1">Start Time</label>
                          <input 
                            type="time" required
                            value={sess.startTime} onChange={e => updateSession(idx, 'startTime', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-card-foreground mb-1">End Time</label>
                          <input 
                            type="time" required
                            value={sess.endTime} onChange={e => updateSession(idx, 'endTime', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-card-foreground mb-1">Grace (mins)</label>
                          <input 
                            type="number" min="0" required
                            value={sess.graceTime} onChange={e => updateSession(idx, 'graceTime', parseInt(e.target.value))}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={addSession}
                  className="mt-3 text-sm font-bold text-primary flex items-center hover:text-primary/80"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Session
                </button>
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
                <button type="submit" className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground">Save Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
