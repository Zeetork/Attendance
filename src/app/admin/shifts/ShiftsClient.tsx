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

  if (loading) return <div className="text-white p-6">Loading shifts...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto text-neutral-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shift Management</h1>
          <p className="text-sm text-neutral-400">Configure work timings and weekly offs</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Shift
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="px-6 py-3 font-medium">Shift Name</th>
              <th className="px-6 py-3 font-medium">Timings</th>
              <th className="px-6 py-3 font-medium">Working Days</th>
              <th className="px-6 py-3 font-medium">Grace Time</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {shifts.map((s) => (
              <tr key={s._id} className="hover:bg-neutral-800/50">
                <td className="px-6 py-4 font-medium">{s.shiftName}</td>
                <td className="px-6 py-4">{s.startTime} - {s.endTime}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {s.workingDays?.map((d: string) => (
                      <span key={d} className="px-2 py-0.5 bg-neutral-800 text-xs rounded-full border border-neutral-700">
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">{s.graceTime} mins</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenModal(s)} className="text-blue-400 hover:text-blue-300 p-1"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s._id)} className="text-red-400 hover:text-red-300 p-1 ml-2"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No shifts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Shift' : 'Create Shift'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Shift Name</label>
                <input 
                  type="text" required
                  value={formData.shiftName} onChange={e => setFormData({...formData, shiftName: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Start Time</label>
                  <input 
                    type="time" required
                    value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">End Time</label>
                  <input 
                    type="time" required
                    value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Grace Time (Minutes)</label>
                <input 
                  type="number" min="0" required
                  value={formData.graceTime} onChange={e => setFormData({...formData, graceTime: parseInt(e.target.value)})}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {allDays.map(day => (
                    <button
                      key={day} type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.workingDays.includes(day) 
                          ? 'bg-blue-600 text-white border border-blue-500' 
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-500'
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
                  className="mr-2 rounded border-neutral-700 bg-neutral-800"
                />
                <label htmlFor="isActive" className="text-sm text-neutral-300">Active Shift</label>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">Save Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
