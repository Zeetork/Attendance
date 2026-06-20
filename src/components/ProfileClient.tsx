'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { Camera, Save, User, Lock, Upload } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProfileClient() {
  const { data, error, mutate } = useSWR('/api/profile', fetcher);
  
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    emergencyContact: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = data?.user;

  // Initialize form data when user loads
  if (user && !formData.name && !isEditing) {
    setFormData({
      ...formData,
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      emergencyContact: user.emergencyContact || '',
      profileImage: user.profileImage || '',
    });
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      
      if (res.ok) {
        setMessage({ text: 'Profile updated successfully', type: 'success' });
        setIsEditing(false);
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        mutate();
      } else {
        setMessage({ text: result.error || 'Failed to update', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'An error occurred', type: 'error' });
    }
    setSaving(false);
  };

  if (error) return <div className="text-red-500">Failed to load profile</div>;
  if (!user) return <div className="h-64 animate-pulse bg-neutral-900 rounded-xl"></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column - Profile Card */}
        <div className="w-full md:w-1/3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="px-6 pb-6 relative">
              <div className="relative inline-block -mt-12 mb-4 group" onClick={() => user.role === 'admin' && fileInputRef.current?.click()}>
                <div className="h-24 w-24 rounded-full border-4 border-neutral-900 bg-neutral-800 overflow-hidden flex items-center justify-center">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-neutral-500" />
                  )}
                </div>
                {user.role === 'admin' && (
                  <>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-sm text-neutral-400 mb-4">{user.designation} • {user.department}</p>
              
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Employee ID</span>
                  <span className="text-white font-medium">{user.employeeId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Role</span>
                  <span className="text-white font-medium capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Joining Date</span>
                  <span className="text-white font-medium">{format(new Date(user.joiningDate), 'MMM dd, yyyy')}</span>
                </div>
                {user.role === 'employee' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Shift</span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                      {user.shiftId ? user.shiftId.shiftName : 'Not Assigned'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details and Forms */}
        <div className="w-full md:w-2/3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm min-h-[400px]">
            <div className="flex border-b border-neutral-800">
              <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'details' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-neutral-400 hover:text-white'}`}
                onClick={() => setActiveTab('details')}
              >
                Personal Details
              </button>
              <button 
                className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'security' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-neutral-400 hover:text-white'}`}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
            </div>

            <div className="p-6">
              {message.text && (
                <div className={`mb-6 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {message.text}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-500">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, name: e.target.value}); setIsEditing(true); }}
                        className={`w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-500">Email Address</label>
                      <input 
                        type="email" 
                        value={user.email} 
                        disabled
                        className="w-full bg-neutral-800/50 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-500">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phoneNumber} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, phoneNumber: e.target.value}); setIsEditing(true); }}
                        className={`w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-500">Emergency Contact</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, emergencyContact: e.target.value}); setIsEditing(true); }}
                        className={`w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="Name - Phone"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs text-neutral-500">Address</label>
                      <textarea 
                        value={formData.address} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, address: e.target.value}); setIsEditing(true); }}
                        rows={3}
                        className={`w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="Full Address"
                      ></textarea>
                    </div>
                  </div>
                  
                  {isEditing && user.role === 'admin' && (
                    <div className="flex justify-end pt-4">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4 animate-in fade-in max-w-md">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-500">Current Password</label>
                    <input 
                      type="password" 
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-500">New Password</label>
                    <input 
                      type="password" 
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={saving || !formData.currentPassword || !formData.newPassword}
                      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
