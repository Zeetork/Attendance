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
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!activeCompany || companies.length <= 1) {
    // If only one company or none, maybe don't show the switcher, or just show the name non-interactive
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-300">
        {activeCompany?.logo ? (
           <Image src={activeCompany.logo} alt="Logo" width={24} height={24} className="rounded-full bg-neutral-800" />
        ) : (
           <Building2 className="w-4 h-4 text-blue-500" />
        )}
        <span>{activeCompany?.companyName || 'No Company'}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 transition-colors text-sm font-medium text-white group"
      >
        {activeCompany.logo ? (
           <Image src={activeCompany.logo} alt="Logo" width={20} height={20} className="rounded-full bg-neutral-900 object-cover" />
        ) : (
           <Building2 className="w-4 h-4 text-blue-400" />
        )}
        <span className="truncate max-w-[150px]">{activeCompany.companyName}</span>
        <ChevronDown className={clsx("w-4 h-4 text-neutral-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 right-0 sm:left-0 sm:right-auto bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2 border-b border-neutral-800">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2">Switch Company</span>
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
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                  activeCompany._id === company._id 
                    ? "bg-blue-600/10 text-blue-500" 
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  {company.logo ? (
                     <Image src={company.logo} alt="Logo" width={24} height={24} className="rounded-full bg-neutral-800 object-cover" />
                  ) : (
                     <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                       {company.companyCode}
                     </div>
                  )}
                  <span className="truncate">{company.companyName}</span>
                </div>
                {activeCompany._id === company._id && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
