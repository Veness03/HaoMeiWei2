import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { format, subDays } from 'date-fns';
import { Search, Receipt, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  profiles: { full_name: string };
  sales_items: { 
    quantity: number; 
    total_price: number;
    menu_items: { name: string, chinese_name: string } 
  }[];
}

export default function SalesHistory() {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchSales();
  }, [dateFilter]);

  async function fetchSales() {
    setLoading(true);
    try {
      const start = new Date(dateFilter);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateFilter);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, total_amount, payment_method, created_at,
          profiles(full_name),
          sales_items(quantity, total_price, menu_items(name, chinese_name))
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales((data as unknown) as Sale[] || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  }

  const dailyTotal = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('salesHistory.title')}</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('salesHistory.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#111] border border-stone-800 text-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">{t('salesHistory.totalTx')}</p>
          <p className="text-3xl font-serif text-stone-100">{sales.length}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-stone-500">
             <Receipt size={14} className="text-stone-400" />
             {t('salesHistory.count')}
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col justify-between">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">{t('salesHistory.dailyRev')}</p>
          <p className="text-3xl font-serif text-amber-500">RM {dailyTotal.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-500">
             <BanknoteIcon />
             {t('salesHistory.income')}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden bg-[#111]">
        {loading ? (
          <div className="p-8 text-center text-stone-500 animate-pulse">{t('common.loading')}</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <Receipt size={48} className="mx-auto text-stone-800 mb-4" />
            <h3 className="text-lg font-medium text-stone-300">{t('salesHistory.noSales')}</h3>
            <p className="text-sm">{t('salesHistory.noSalesDesc')} {format(new Date(dateFilter), 'dd MMM yyyy')}</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-800">
            {sales.map((sale) => (
              <div key={sale.id} className="p-4 sm:p-6 hover:bg-stone-800/20 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-mono tracking-widest text-stone-400 bg-stone-800/40 border border-stone-700/50 px-2 py-1 rounded uppercase">
                      #{sale.id.slice(0, 8)}
                    </span>
                    <p className="text-sm font-medium text-stone-300 mt-2">
                      {format(new Date(sale.created_at), 'hh:mm a')} • {sale.profiles?.full_name || t('salesHistory.unknownCashier')}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-amber-500">RM {Number(sale.total_amount).toFixed(2)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest mt-1 ${
                      sale.payment_method === 'cash' ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/50' : 'bg-blue-950/40 text-blue-500 border-blue-900/50'
                    }`}>
                      {sale.payment_method}
                    </span>
                  </div>
                </div>
                
                <div className="bg-stone-900/40 border border-stone-800/60 rounded-lg p-4">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-3">{t('salesHistory.orderItems')}</p>
                  <div className="space-y-2">
                    {sale.sales_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-stone-300">
                          <span className="font-bold text-stone-100">{item.quantity}x</span> {item.menu_items?.name} 
                          {item.menu_items?.chinese_name && <span className="text-stone-500 ml-2 text-xs">({item.menu_items.chinese_name})</span>}
                        </span>
                        <span className="font-bold text-stone-400">RM {Number(item.total_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BanknoteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
  );
}
