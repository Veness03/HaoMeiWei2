import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, X, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface StockMovement {
  id: string;
  stock_item_id: string;
  movement_type: 'purchase' | 'usage' | 'waste' | 'adjustment';
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  notes: string | null;
  created_at: string;
  stock_items: {
    name: string;
    chinese_name: string | null;
    unit: string;
  };
}

interface StockItem {
  id: string;
  name: string;
  chinese_name: string | null;
  unit: string;
  current_quantity: number;
  cost_per_unit: number | null;
}

export default function StockMovements() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    stock_item_id: '',
    movement_type: 'purchase',
    quantity: '',
    unit_cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movementsRes, itemsRes] = await Promise.all([
        supabase
          .from('stock_movements')
          .select(`
            *,
            stock_items (
              name,
              chinese_name,
              unit
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('stock_items')
          .select('id, name, chinese_name, unit, current_quantity, cost_per_unit')
          .order('name')
      ]);

      if (movementsRes.error) throw movementsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      // Handle supabase single relationship potentially returning arrays based on typing
      const formattedMovements = (movementsRes.data || []).map(m => ({
        ...m,
        stock_items: Array.isArray(m.stock_items) ? m.stock_items[0] : m.stock_items
      })) as StockMovement[];

      setMovements(formattedMovements);
      setStockItems(itemsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stock_item_id) {
      toast.error('Please select a stock item');
      return;
    }
    
    // Check quantity validity
    if (!formData.quantity || isNaN(Number(formData.quantity))) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setSaving(true);

    try {
      // 1. Get current item stock
      const { data: item, error: itemError } = await supabase
        .from('stock_items')
        .select('current_quantity, cost_per_unit')
        .eq('id', formData.stock_item_id)
        .single();
        
      if (itemError) throw itemError;

      const inputQty = parseFloat(formData.quantity);
      let delta = inputQty;
      const type = formData.movement_type;

      // Calculate the delta based on movement type
      if (type === 'usage' || type === 'waste') {
        delta = -Math.abs(inputQty);
      } else if (type === 'purchase') {
        delta = Math.abs(inputQty);
      } else {
        // For adjustment, we will treat the input as the delta explicitly.
        // It can be positive or negative.
        delta = inputQty;
      }

      const newQuantity = Number(item.current_quantity) + delta;

      // Calculate total cost
      let unitCost = item.cost_per_unit;
      if (type === 'purchase' && formData.unit_cost && Number(formData.unit_cost) > 0) {
        unitCost = parseFloat(formData.unit_cost);
      }

      const totalCost = unitCost && unitCost > 0 
        ? Math.abs(delta) * unitCost
        : null;

      // 2. Insert Stock Movement
      // The quantity recorded in the table usually represents the absolute amount moved, or the delta.
      // We will store the absolute value of the change, to make reports standard. Or just the delta.
      // Let's store the delta to indicate +/-, or rely on movement_type. We'll store what user input but maybe preserve sign for adjustment.
      const recordedQty = type === 'adjustment' ? delta : Math.abs(inputQty);

      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert([{
          stock_item_id: formData.stock_item_id,
          movement_type: type,
          quantity: recordedQty,
          unit_cost: unitCost ? unitCost : null,
          total_cost: totalCost ? Math.abs(totalCost) : null,
          notes: formData.notes || null,
          created_by: profile?.id
        }]);

      if (insertError) throw insertError;

      // 3. Update stock item quantity
      const updateData: any = { current_quantity: newQuantity };
      if (type === 'purchase' && formData.unit_cost && Number(formData.unit_cost) > 0) {
        updateData.cost_per_unit = unitCost;
      }

      const { error: updateError } = await supabase
        .from('stock_items')
        .update(updateData)
        .eq('id', formData.stock_item_id);

      if (updateError) throw updateError;
      
      toast.success(t('stockMovements.successAdd'));
      setFormData({ 
        stock_item_id: '', 
        movement_type: 'purchase', 
        quantity: '', 
        unit_cost: '', 
        notes: '' 
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving movement:', error);
      toast.error(error.message || t('stockMovements.failAdd'));
    } finally {
      setSaving(false);
    }
  };

  const getMovementColor = (type: string) => {
    switch(type) {
      case 'purchase': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'usage': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'waste': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
    }
  };

  const getMovementLabel = (type: string) => {
    switch(type) {
      case 'purchase': return t('stockMovements.typePurchase');
      case 'usage': return t('stockMovements.typeUsage');
      case 'waste': return t('stockMovements.typeWaste');
      case 'adjustment': return t('stockMovements.typeAdjustment');
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('stockMovements.title')}</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('stockMovements.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 text-stone-950 px-4 py-2 rounded-xl font-bold hover:bg-amber-500 flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="uppercase text-[10px] tracking-widest">{t('stockMovements.addMovement')}</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden bg-[#111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#111] border-b border-stone-800 text-stone-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="p-4">{t('stockMovements.date')}</th>
                <th className="p-4">{t('stockMovements.item')}</th>
                <th className="p-4">{t('stockMovements.type')}</th>
                <th className="p-4">{t('stockMovements.quantity')}</th>
                <th className="p-4 text-right">{t('stockMovements.unitCost')}</th>
                <th className="p-4">{t('stockMovements.notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 bg-[#161616]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-stone-500">{t('common.loading')}</td></tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-500">
                    <ArrowRightLeft size={48} className="mx-auto text-stone-800 mb-4" />
                    <p>{t('stockMovements.noRecords')}</p>
                  </td>
                </tr>
              ) : (
                movements.map(m => (
                  <tr key={m.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-medium text-stone-200">{format(new Date(m.created_at), 'dd MMM yyyy')}</div>
                      <div className="text-[10px] text-stone-500">{format(new Date(m.created_at), 'hh:mm a')}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-stone-200">
                        {language === 'zh' && m.stock_items?.chinese_name ? m.stock_items.chinese_name : (m.stock_items?.name || 'Unknown Item')}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] border tracking-widest uppercase font-bold ${getMovementColor(m.movement_type)}`}>
                        {getMovementLabel(m.movement_type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-stone-300">
                        {m.movement_type === 'purchase' ? '+' : (m.movement_type === 'usage' || m.movement_type === 'waste' ? '-' : '')}
                        {m.quantity} <span className="text-stone-500 text-xs">{m.stock_items?.unit}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-stone-400">
                      {m.unit_cost ? `RM ${m.unit_cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 text-sm text-stone-400 max-w-[200px] truncate">
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161616] border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
              <h2 className="text-lg font-serif font-bold text-stone-200">{t('stockMovements.addTitle')}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stockMovements.item')}</label>
                <select 
                  required
                  value={formData.stock_item_id}
                  onChange={e => setFormData({...formData, stock_item_id: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-[#111] text-stone-200"
                >
                  <option value="" disabled>{t('stockMovements.selectItem')}</option>
                  {stockItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {language === 'zh' && item.chinese_name ? item.chinese_name : item.name} ({item.current_quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stockMovements.type')}</label>
                  <select 
                    value={formData.movement_type}
                    onChange={e => setFormData({...formData, movement_type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-[#111] text-stone-200"
                  >
                    <option value="purchase">{t('stockMovements.typePurchase')}</option>
                    <option value="usage">{t('stockMovements.typeUsage')}</option>
                    <option value="waste">{t('stockMovements.typeWaste')}</option>
                    <option value="adjustment">{t('stockMovements.typeAdjustment')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stockMovements.quantity')}</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-2 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-[#111] text-stone-200"
                  />
                </div>
              </div>

              {formData.movement_type === 'purchase' && (
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">
                    {t('stockMovements.unitCost')}
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder={`Current: RM ${stockItems.find(i => i.id === formData.stock_item_id)?.cost_per_unit?.toFixed(2) || '0.00'}`}
                    value={formData.unit_cost}
                    onChange={e => setFormData({...formData, unit_cost: e.target.value})}
                    className="w-full px-4 py-2 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-[#111] text-stone-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('stockMovements.notesOpt')}</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-[#111] text-stone-200 resize-none h-20"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-stone-700 text-stone-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 text-stone-950 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {saving ? t('stockMovements.saving') : t('stockMovements.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
