import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Package, AlertTriangle, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface StockItem {
  id: string;
  name: string;
  chinese_name: string;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  cost_per_unit: number | null;
}

export default function Stock() {
  const { t } = useLanguage();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [saving, setSaving] = useState(false);
  
  const [addFormData, setAddFormData] = useState({
    name: '',
    chinese_name: '',
    unit: 'kg',
    current_quantity: '',
    minimum_quantity: '',
    cost_per_unit: ''
  });

  useEffect(() => {
    fetchStock();
  }, []);

  async function fetchStock() {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to fetch stock items');
    } finally {
      setLoading(false);
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase.from('stock_items').insert([{
        name: addFormData.name,
        chinese_name: addFormData.chinese_name,
        unit: addFormData.unit,
        current_quantity: parseFloat(addFormData.current_quantity),
        minimum_quantity: parseFloat(addFormData.minimum_quantity),
        cost_per_unit: addFormData.cost_per_unit ? parseFloat(addFormData.cost_per_unit) : null
      }]);

      if (error) throw error;
      
      toast.success(t('stock.successAdd'));
      setAddFormData({ name: '', chinese_name: '', unit: 'kg', current_quantity: '', minimum_quantity: '', cost_per_unit: '' });
      setIsAddModalOpen(false);
      fetchStock();
    } catch (error: any) {
      console.error('Error saving stock item:', error);
      toast.error(error.message || t('stock.failAdd'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('stock.title')}</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('stock.subtitle')}</p>
          <p className="text-[10px] text-emerald-500/80 mt-1">{t('stock.autoUpdateNote')}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-600 text-stone-950 font-bold px-4 py-2 rounded-xl hover:bg-amber-500 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="uppercase text-[10px] tracking-widest">{t('stock.addItem')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-stone-800 text-stone-400 rounded-xl"><Package size={24} /></div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-widest">{t('stock.totalItems')}</p>
            <p className="text-3xl font-serif text-stone-100">{items.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-amber-500">
          <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-widest">{t('stock.lowStockAlert')}</p>
            <p className="text-3xl font-serif text-amber-500">
              {items.filter(i => Number(i.current_quantity) <= Number(i.minimum_quantity)).length}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111] border-b border-stone-800 text-stone-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="p-4">{t('stock.name')}</th>
                <th className="p-4">{t('stock.currentQty')}</th>
                <th className="p-4">{t('stock.minQty')}</th>
                <th className="p-4">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 bg-[#161616]">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-stone-500">{t('common.loading')}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-stone-500">{t('stock.noItems')}</td></tr>
              ) : (
                items.map(item => {
                  const isLow = Number(item.current_quantity) <= Number(item.minimum_quantity);
                  return (
                    <tr key={item.id} className="hover:bg-stone-800/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-stone-200">{item.name}</p>
                        {item.chinese_name && <p className="text-xs text-stone-500">{item.chinese_name}</p>}
                      </td>
                      <td className="p-4 font-bold text-stone-200">
                        {item.current_quantity} <span className="font-normal text-stone-500 text-sm">{item.unit}</span>
                      </td>
                      <td className="p-4 text-stone-400">{item.minimum_quantity} {item.unit}</td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-950/40 border border-rose-900/50 px-2 py-1 rounded w-fit uppercase tracking-widest">
                            <AlertTriangle size={12} /> {t('stock.lowStock')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-950/40 border border-emerald-900/50 px-2 py-1 rounded w-fit uppercase tracking-widest">
                            {t('stock.adequate')}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161616] border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
              <h2 className="text-lg font-serif font-bold text-stone-200">{t('stock.addTitle')}</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stock.name')}</label>
                <input 
                  required
                  type="text" 
                  value={addFormData.name}
                  onChange={e => setAddFormData({...addFormData, name: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stock.chineseNameOpt')}</label>
                <input 
                  type="text" 
                  value={addFormData.chinese_name}
                  onChange={e => setAddFormData({...addFormData, chinese_name: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stock.unit')}</label>
                  <input 
                    required
                    type="text" 
                    placeholder="kg, pcs, L..."
                    value={addFormData.unit}
                    onChange={e => setAddFormData({...addFormData, unit: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stock.costPerUnit')}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={addFormData.cost_per_unit}
                    onChange={e => setAddFormData({...addFormData, cost_per_unit: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stock.current')}</label>
                  <input 
                    required
                    type="number" 
                    step="0.1"
                    min="0"
                    value={addFormData.current_quantity}
                    onChange={e => setAddFormData({...addFormData, current_quantity: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stock.minimum')}</label>
                  <input 
                    required
                    type="number" 
                    step="0.1"
                    min="0"
                    value={addFormData.minimum_quantity}
                    onChange={e => setAddFormData({...addFormData, minimum_quantity: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-stone-700 text-stone-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 text-stone-950 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {saving ? t('stock.saving') : t('stock.saveItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
