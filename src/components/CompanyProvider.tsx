'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

interface Company {
  _id: string;
  companyName: string;
  companyCode: string;
  logo: string;
  address?: string;
  email?: string;
  phone?: string;
}

interface CompanyContextType {
  activeCompany: Company | null;
  companies: Company[];
  switchCompany: (companyId: string) => Promise<void>;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  
  const { data, error, isLoading } = useSWR('/api/companies', fetcher);
  
  useEffect(() => {
    if (data?.companies && data.companies.length > 0) {
      // First check if cookie dictates an active company (we can't read httpOnly cookie, but we can check if it was set via API previously)
      // Actually, since we can't read httpOnly cookie, we could rely on the backend to tell us the active company, or we can just read a non-httpOnly cookie, or localStorage.
      // Let's rely on localStorage as a fallback sync for the frontend, or just pick the first one if not set.
      const storedId = localStorage.getItem('activeCompanyId');
      if (storedId) {
        const found = data.companies.find((c: Company) => c._id === storedId);
        if (found) {
          setActiveCompany(found);
          // Sync backend cookie just in case
          fetch('/api/companies/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: storedId })
          });
          return;
        }
      }
      
      // Default to first company
      setActiveCompany(data.companies[0]);
      localStorage.setItem('activeCompanyId', data.companies[0]._id);
      fetch('/api/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: data.companies[0]._id })
      });
    }
  }, [data]);

  const switchCompany = async (companyId: string) => {
    try {
      const res = await fetch('/api/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      
      if (!res.ok) throw new Error('Failed to switch company');
      
      const found = data?.companies?.find((c: Company) => c._id === companyId);
      if (found) {
        setActiveCompany(found);
        localStorage.setItem('activeCompanyId', companyId);
        // Refresh page to trigger SWR revalidations with new activeCompany context
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Error switching company');
    }
  };

  return (
    <CompanyContext.Provider value={{ activeCompany, companies: data?.companies || [], switchCompany, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
