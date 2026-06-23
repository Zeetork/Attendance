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

  if (error) return <div className="text-destructive">Failed to load profile</div>;
  if (!user) return <div className="h-64 animate-pulse bg-card rounded-2xl"></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column - Profile Card */}
        <div className="w-full md:w-1/3">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="h-24 bg-gradient-to-r from-primary to-primary/60"></div>
            <div className="px-6 pb-6 relative">
              <div className="relative inline-block -mt-12 mb-4 group" onClick={() => user.role === 'admin' && fileInputRef.current?.click()}>
                <div className="h-24 w-24 rounded-full border-4 border-card bg-muted overflow-hidden flex items-center justify-center">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground/30" />
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
              
              <h2 className="text-xl font-bold text-card-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user.designation} • {user.department}</p>
              
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Employee ID</span>
                  <span className="text-card-foreground font-bold">{user.employeeId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="text-card-foreground font-bold capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joining Date</span>
                  <span className="text-card-foreground font-bold">{format(new Date(user.joiningDate), 'MMM dd, yyyy')}</span>
                </div>
                {user.role === 'employee' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shift</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20">
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
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
            <div className="flex border-b border-border">
              <button 
                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('details')}
              >
                Personal Details
              </button>
              <button 
                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'security' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
            </div>

            <div className="p-6">
              {message.text && (
                <div className={`mb-6 p-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                  {message.text}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-card-foreground">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, name: e.target.value}); setIsEditing(true); }}
                        className={`w-full bg-background border border-border rounded-xl px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-card-foreground">Email Address</label>
                      <input 
                        type="email" 
                        value={user.email} 
                        disabled
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 min-h-[44px] text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-card-foreground">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phoneNumber} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, phoneNumber: e.target.value}); setIsEditing(true); }}
                        className={`w-full bg-background border border-border rounded-xl px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-card-foreground">Emergency Contact</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, emergencyContact: e.target.value}); setIsEditing(true); }}
                        className={`w-full bg-background border border-border rounded-xl px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
                        placeholder="Name - Phone"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-card-foreground">Address</label>
                      <textarea 
                        value={formData.address} 
                        disabled={user.role === 'employee'}
                        onChange={(e) => { setFormData({...formData, address: e.target.value}); setIsEditing(true); }}
                        rows={3}
                        className={`w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none ${user.role === 'employee' ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}
                        placeholder="Full Address"
                      ></textarea>
                    </div>
                  </div>
                  
                  {isEditing && user.role === 'admin' && (
                    <div className="flex justify-end pt-4 border-t border-border">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center w-full sm:w-auto px-6 py-2 min-h-[44px] bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-5 animate-in fade-in max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-card-foreground">Current Password</label>
                    <input 
                      type="password" 
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-card-foreground">New Password</label>
                    <input 
                      type="password" 
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={saving || !formData.currentPassword || !formData.newPassword}
                      className="flex items-center justify-center w-full sm:w-auto px-6 py-2 min-h-[44px] bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
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
