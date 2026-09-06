'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Edit2,
  Trash2,
  FilePlus2,
  StickyNote,
} from 'lucide-react';
import { Customer } from '@/lib/types';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/storage';
import { CustomerModal } from '@/components/CustomerModal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error('Error fetching customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.site_location && c.site_location.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id'> | Customer) => {
    if ('id' in customerData && customerData.id) {
      await updateCustomer(customerData.id, customerData);
    } else {
      await createCustomer(customerData);
    }
    await loadCustomers();
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      await loadCustomers();
    } catch (e) {
      console.error('Failed to delete customer:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Customer Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Maintain customer contacts, billing addresses, and roofing site delivery locations.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, site location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500">
          Total: <b>{filteredCustomers.length}</b> customer records
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {cust.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cust.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {cust.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCustomer(cust);
                      setIsModalOpen(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: cust.id, name: cust.name })}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {cust.email && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{cust.email}</span>
                </div>
              )}

              {cust.address && (
                <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{cust.address}</span>
                </div>
              )}

              {cust.site_location && (
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-xs">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>Roofing Site Location</span>
                  </div>
                  <p className="text-slate-700 font-medium line-clamp-2">{cust.site_location}</p>
                </div>
              )}

              {cust.notes && (
                <div className="text-[11px] text-slate-500 italic flex items-center gap-1">
                  <StickyNote className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{cust.notes}</span>
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                href={`/quotations/new?customerId=${cust.id}`}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Create Quote for {cust.name.split(' ')[0]}</span>
              </Link>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p>No customers found matching your search.</p>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        customer={editingCustomer}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />

      {/* Delete Customer Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Customer"
        description={
          <span>
            Are you sure you want to permanently delete customer <strong className="font-semibold text-slate-900">&quot;{deleteTarget?.name}&quot;</strong>? This action cannot be undone.
          </span>
        }
        confirmText="Delete Customer"
        isLoading={isDeleting}
        onConfirm={confirmDeleteCustomer}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
