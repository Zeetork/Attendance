'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Building2, Plus, Edit2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CompaniesPage() {
  const { data, error, mutate, isLoading } = useSWR('/api/admin/companies', fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyCode: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    status: true,
  });

  const openModal = (company: any = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        companyName: company.companyName || '',
        companyCode: company.companyCode || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        logo: company.logo || '',
        status: company.status ?? true,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        companyName: '',
        companyCode: '',
        email: '',
        phone: '',
        address: '',
        logo: '',
        status: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingCompany ? `/api/admin/companies/${editingCompany._id}` : '/api/admin/companies';
      const method = editingCompany ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      await mutate();
      setIsModalOpen(false);
      setFormData({
        companyName: '',
        companyCode: '',
        email: '',
        phone: '',
        address: '',
        logo: '',
        status: true,
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Company Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage multiple organizations and branches</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl min-h-[44px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-card-foreground">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Company</th>
                <th className="px-6 py-4 font-bold">Code</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Added On</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-bold">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data?.companies?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-bold">
                    No companies found. Create one to get started.
                  </td>
                </tr>
              ) : (
                data?.companies?.map((company: any) => (
                  <tr key={company._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {company.logo ? (
                          <Image src={company.logo} alt="" width={32} height={32} className="rounded-md object-cover bg-muted" />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {company.companyCode}
                          </div>
                        )}
                        <span className="font-bold text-card-foreground">{company.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-muted-foreground">{company.companyCode}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-card-foreground">{company.email}</div>
                      <div className="text-xs font-bold text-muted-foreground">{company.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {company.status ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-success/10 text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-muted-foreground">
                      {company.createdAt ? format(new Date(company.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(company)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-card-foreground">{editingCompany ? 'Edit Company' : 'Add New Company'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[44px] text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">Company Code</label>
                <input
                  type="text"
                  required
                  value={formData.companyCode}
                  onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[44px] text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="e.g. ACME"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-card-foreground mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[44px] text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-card-foreground mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[44px] text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-card-foreground mb-1">Logo URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[44px] text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="/uploads/logo.png"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                  className="w-4 h-4 bg-background border-border rounded text-primary focus:ring-primary focus:ring-offset-background"
                />
                <label htmlFor="status" className="text-sm font-bold text-card-foreground">
                  Active (Employees can be assigned)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl min-h-[44px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl min-h-[44px] font-bold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingCompany ? 'Save Changes' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
