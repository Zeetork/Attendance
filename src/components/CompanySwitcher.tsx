'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from './CompanyProvider';
import { ChevronDown, Building2, Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

export default function CompanySwitcher() {
  const { activeCompany, companies, switchCompany, isLoading } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground font-bold">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!activeCompany || companies.length <= 1) {
    // If only one company or none, maybe don't show the switcher, or just show the name non-interactive
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-muted-foreground">
        {activeCompany?.logo ? (
           <Image src={activeCompany.logo} alt="Logo" width={24} height={24} className="rounded-full bg-muted" />
        ) : (
           <Building2 className="w-4 h-4 text-primary" />
        )}
        <span>{activeCompany?.companyName || 'No Company'}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl bg-muted/50 hover:bg-muted border border-border transition-colors text-sm font-bold text-foreground group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {activeCompany.logo ? (
           <Image src={activeCompany.logo} alt="Logo" width={20} height={20} className="rounded-full bg-card object-cover border border-border" />
        ) : (
           <Building2 className="w-4 h-4 text-primary" />
        )}
        <span className="truncate max-w-[150px]">{activeCompany.companyName}</span>
        <ChevronDown className={clsx("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 right-0 sm:left-0 sm:right-auto bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-border bg-muted/30">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Switch Company</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {companies.map((company) => (
              <button
                key={company._id}
                onClick={() => {
                  switchCompany(company._id);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  activeCompany._id === company._id 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  {company.logo ? (
                     <Image src={company.logo} alt="Logo" width={24} height={24} className="rounded-full bg-muted object-cover border border-border" />
                  ) : (
                     <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
                       {company.companyCode}
                     </div>
                  )}
                  <span className="truncate">{company.companyName}</span>
                </div>
                {activeCompany._id === company._id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
