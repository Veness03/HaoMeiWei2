import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Reports() {
  const { t } = useLanguage();
  const [data, setData] = useState<{date: string, sales: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeeklySales() {
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, 6); // Last 7 days

        const { data: salesData } = await supabase
          .from('sales')
          .select('total_amount, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        // Group by day
        const grouped: Record<string, number> = {};
        for (let i = 0; i <= 6; i++) {
            const d = subDays(endDate, 6 - i);
            grouped[format(d, 'MMM dd')] = 0;
        }

        if (salesData) {
            salesData.forEach(sale => {
                const day = format(new Date(sale.created_at), 'MMM dd');
                if (grouped[day] !== undefined) {
                    grouped[day] += Number(sale.total_amount);
                }
            });
        }

        setData(Object.entries(grouped).map(([date, sales]) => ({ date, sales })));
      } catch (err) {
        console.error('Error fetching report', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWeeklySales();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-200">{t('reports.title')}</h1>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('reports.subtitle')}</p>
      </div>

      <div className="glass-card p-6 border border-stone-800/60 bg-[#161616]">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg">
            <BarChart3 size={20} />
          </div>
          <h2 className="text-sm font-semibold tracking-widest uppercase text-stone-400">{t('reports.salesTrend')}</h2>
        </div>
        
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-stone-500">{t('common.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#292524" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#78716c', fontSize: 12, fontFamily: 'Inter' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#78716c', fontSize: 12, fontFamily: 'Inter' }}
                  width={80}
                  tickFormatter={(val) => `RM ${val}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#44403c', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', border: '1px solid #44403c', color: '#f5f5f4', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#f5b800' }}
                  labelStyle={{ color: '#a8a29e', marginBottom: '4px' }}
                  formatter={(value: number) => [`RM ${value.toFixed(2)}`, t('reports.salesTooltip')]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f5b800" 
                  strokeWidth={3}
                  dot={{ fill: '#1c1917', strokeWidth: 2, r: 4, stroke: '#f5b800' }}
                  activeDot={{ r: 6, fill: '#f5b800', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 bg-[#161616]">
              <h3 className="text-xs tracking-widest uppercase font-semibold text-stone-400 mb-4">{t('reports.topProfit')}</h3>
              <p className="text-stone-500 text-sm">{t('reports.profitPlaceholder')}</p>
          </div>
          <div className="glass-card p-6 bg-[#161616]">
              <h3 className="text-xs tracking-widest uppercase font-semibold text-stone-400 mb-4">{t('reports.stockValue')}</h3>
              <p className="text-stone-500 text-sm">{t('reports.stockPlaceholder')}</p>
          </div>
      </div>
    </div>
  );
}
