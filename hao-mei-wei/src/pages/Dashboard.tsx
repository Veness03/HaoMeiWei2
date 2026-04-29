import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { BarChart3, TrendingDown, TrendingUp, PackageSearch, Plus, Receipt } from 'lucide-react';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

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

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    sales: 0,
    expenses: 0,
    profit: 0,
    lowStock: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockItemsList, setLowStockItemsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const [salesRes, expensesRes, stockRes, recentSalesRes] = await Promise.all([
        supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
        supabase
          .from('expenses')
          .select('amount')
          .eq('expense_date', format(new Date(), 'yyyy-MM-dd')),
        supabase
          .from('stock_items')
          .select('id, name, chinese_name, current_quantity, minimum_quantity, unit')
          .order('name'),
        supabase
          .from('sales')
          .select(`
            id, total_amount, payment_method, created_at,
            profiles(full_name),
            sales_items(quantity, total_price, menu_items(name, chinese_name))
          `)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (stockRes.error) {
        console.error('Error fetching stock items:', stockRes.error);
      }

      const totalSales = salesRes.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalExpenses = expensesRes.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      const items = stockRes.data || [];
      const lowStock = items.filter(item => Number(item.current_quantity) <= Number(item.minimum_quantity));

      setStats({
        sales: totalSales,
        expenses: totalExpenses,
        profit: totalSales - totalExpenses,
        lowStock: lowStock.length,
      });

      setLowStockItemsList(lowStock);
      setRecentSales((recentSalesRes.data as unknown as Sale[]) || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewSale = () => {
    console.log('Navigating to /sales/new');
    try {
      navigate('/sales/new');
    } catch (e) {
      console.error('Navigation failed', e);
    }
  };

  const handleAddExpense = () => {
    console.log('Navigating to /expenses');
    try {
      navigate('/expenses');
    } catch (e) {
      console.error('Navigation failed', e);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-widest text-stone-500">
          <span>{t('dashboard.title')}</span>
          <span className="text-stone-700">/</span>
          <span className="text-stone-300">{t('dashboard.subtitle')}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-tighter">{t('dashboard.storeStatus')}</p>
            <p className="text-[10px] flex items-center gap-1.5 text-emerald-500 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('dashboard.open')}
            </p>
          </div>
          <div className="h-8 w-px bg-stone-800 hidden sm:block"></div>
          <div className="text-stone-300 font-serif text-sm">
            {format(new Date(), 'MMM dd, yyyy')}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">{t('dashboard.todaySales')}</p>
          <p className="text-3xl font-serif text-amber-500">RM {stats.sales.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-500">
            <TrendingUp size={14} /> {t('dashboard.salesRevenue')}
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">{t('dashboard.todayExpenses')}</p>
          <p className="text-3xl font-serif text-stone-100">RM {stats.expenses.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-rose-500">
            <TrendingDown size={14} /> {t('dashboard.expensesCosts')}
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">{t('dashboard.netProfit')}</p>
          <p className="text-3xl font-serif text-stone-100">RM {stats.profit.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-stone-500">
            <BarChart3 size={14} /> {t('dashboard.profitCalculation')}
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">{t('dashboard.lowStock')}</p>
          <p className="text-3xl font-serif text-amber-500">{stats.lowStock}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-amber-500">
            <PackageSearch size={14} /> {t('dashboard.itemsRestock')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 bg-[#111] rounded-2xl border border-stone-800/60 flex flex-col overflow-hidden min-h-[400px]">
          <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-900/30">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-stone-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> {t('dashboard.recentSales')}
            </h2>
            <button onClick={() => navigate('/sales')} className="text-[10px] px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded transition-colors uppercase font-bold tracking-tighter cursor-pointer">
              {t('common.viewAll')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {recentSales.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 text-stone-500 text-sm">
                {t('dashboard.viewDetails')}
              </div>
            ) : (
              <div className="divide-y divide-stone-800">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="p-4 sm:p-5 hover:bg-stone-800/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-mono tracking-widest text-stone-400 bg-stone-800/40 border border-stone-700/50 px-2 py-1 rounded uppercase">
                          #{sale.id.slice(0, 8)}
                        </span>
                        <p className="text-xs font-medium text-stone-500 mt-2">
                          {format(new Date(sale.created_at), 'hh:mm a')} • {sale.profiles?.full_name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-amber-500">RM {Number(sale.total_amount).toFixed(2)}</p>
                        <span className="inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest mt-1 bg-emerald-950/40 text-emerald-500 border-emerald-900/50">
                          {sale.payment_method}
                        </span>
                      </div>
                    </div>
                    {sale.sales_items && sale.sales_items.length > 0 && (
                      <div className="mt-2 text-xs text-stone-400 truncate pr-4">
                        {sale.sales_items.map(item => `${item.quantity}x ${language === 'zh' && item.menu_items?.chinese_name ? item.menu_items.chinese_name : item.menu_items?.name}`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-2 space-y-6">
          <div className="bg-stone-900/50 p-6 rounded-2xl border border-stone-800 flex flex-col gap-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleNewSale} className="bg-amber-600 hover:bg-amber-500 text-stone-950 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all font-bold group cursor-pointer">
                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] uppercase mt-1">{t('dashboard.newSaleAction')}</span>
              </button>
              <button onClick={handleAddExpense} className="bg-stone-800 hover:bg-stone-700 text-stone-200 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all font-bold border border-stone-700 group cursor-pointer">
                <Receipt size={24} className="text-stone-400 group-hover:text-stone-200 transition-colors" />
                <span className="text-[10px] uppercase mt-1">{t('dashboard.addExpenseAction')}</span>
              </button>
            </div>
          </div>

          <div className="bg-rose-950/20 p-6 rounded-2xl border border-rose-900/40 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-rose-500/80 flex items-center gap-2">
                <PackageSearch size={16} />
                {t('dashboard.lowStockAlert')}
              </h2>
              {lowStockItemsList.length > 0 && (
                <span className="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded font-bold">
                  {lowStockItemsList.length}
                </span>
              )}
            </div>
            
            {lowStockItemsList.length === 0 ? (
              <div className="text-sm text-stone-500 py-4 text-center">
                {t('dashboard.noLowStock')}
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {lowStockItemsList.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-stone-900/50 p-3 rounded-lg border border-stone-800">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-stone-200">
                        {language === 'zh' && item.chinese_name ? item.chinese_name : item.name}
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-rose-400 font-mono font-bold text-sm">
                        {item.current_quantity} <span className="text-xs text-rose-500/60">{item.unit}</span>
                      </span>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                        Min: {item.minimum_quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
