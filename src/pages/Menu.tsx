import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface MenuItem {
  id: string;
  name: string;
  chinese_name: string;
  category: string;
  price: number;
  is_active: boolean;
}

export default function Menu() {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    chinese_name: '',
    category: 'Rice',
    price: '',
    is_active: true
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('name');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching menu:', error);
      toast.error(error.message || 'Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = (item: MenuItem) => {
    console.log('Edit clicked for item:', item.id);
    setFormData({
      name: item.name,
      chinese_name: item.chinese_name || '',
      category: item.category,
      price: item.price.toString(),
      is_active: item.is_active
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    console.log('Delete clicked for item:', id);
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('menu.successDelete') || 'Menu item deleted successfully');
      fetchMenu();
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Failed to delete menu item');
      setLoading(false);
    }
  };

  const handleToggleActiveClick = async (item: MenuItem) => {
    console.log('Toggle active clicked for item:', item.id);
    try {
      setLoading(true);
      const { error } = await supabase.from('menu_items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      if (error) throw error;
      toast.success(`Menu item is now ${!item.is_active ? 'active' : 'inactive'}`);
      fetchMenu();
    } catch (error: any) {
      console.error('Error toggling menu item status:', error);
      toast.error(error.message || 'Failed to toggle status');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Menu Add/Edit form submitted', formData, 'editingId:', editingId);
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('You must be logged in');
        return;
      }

      if (editingId) {
        const { error } = await supabase.from('menu_items')
          .update({
            name: formData.name,
            chinese_name: formData.chinese_name,
            category: formData.category,
            price: parseFloat(formData.price),
            is_active: formData.is_active
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success(t('menu.successEdit') || 'Menu item updated successfully');
      } else {
        const { error } = await supabase.from('menu_items').insert([{
          name: formData.name,
          chinese_name: formData.chinese_name,
          category: formData.category,
          price: parseFloat(formData.price),
          is_active: formData.is_active
        }]);

        if (error) throw error;
        toast.success(t('menu.successAdd'));
      }
      
      setFormData({ name: '', chinese_name: '', category: 'Rice', price: '', is_active: true });
      setEditingId(null);
      setIsModalOpen(false);
      fetchMenu();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast.error(error.message || t('menu.failAdd'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('menu.title')}</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{t('menu.subtitle')}</p>
        </div>
        <button 
          onClick={() => {
            console.log('Add Menu Item clicked');
            setEditingId(null);
            setFormData({ name: '', chinese_name: '', category: 'Rice', price: '', is_active: true });
            setIsModalOpen(true);
          }}
          className="bg-amber-600 text-stone-950 font-bold px-4 py-2 rounded-xl hover:bg-amber-500 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="uppercase text-[10px] tracking-widest">{t('menu.addItem')}</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111] border-b border-stone-800 text-stone-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="p-4">{t('menu.nameEn')}</th>
                <th className="p-4">{t('menu.nameZh')}</th>
                <th className="p-4">{t('menu.category')}</th>
                <th className="p-4 text-right">{t('menu.price')}</th>
                <th className="p-4 text-center">{t('common.status')}</th>
                <th className="p-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 bg-[#161616]">
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-stone-400">{t('common.loading')}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-stone-500">{t('menu.noItems')}</td></tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="p-4 font-medium text-stone-200">{item.name}</td>
                    <td className="p-4 text-stone-400">{item.chinese_name || '-'}</td>
                    <td className="p-4">
                      <span className="bg-stone-800 border border-stone-700 text-stone-300 px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-amber-500">{item.price.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggleActiveClick(item)}
                        className={`px-2 py-1 rounded text-[10px] border tracking-widest uppercase font-bold hover:brightness-110 transition-all ${
                          item.is_active ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/50' : 'bg-rose-950/40 text-rose-500 border-rose-900/50'
                        }`}
                      >
                        {item.is_active ? t('menu.active') : t('menu.inactive')}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-1 text-stone-500 hover:text-amber-500 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id, item.name)}
                          className="p-1 text-stone-500 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
              <h2 className="text-lg font-serif font-bold text-stone-200">{t('menu.addTitle')}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('menu.nameEn')}</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('menu.nameZh')}</label>
                <input 
                  type="text" 
                  value={formData.chinese_name}
                  onChange={e => setFormData({...formData, chinese_name: e.target.value})}
                  className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('menu.price')}</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">{t('menu.category')}</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Rice">{t('menu.catRice')}</option>
                    <option value="Meat">{t('menu.catMeat')}</option>
                    <option value="Vegetable">{t('menu.catVegetable')}</option>
                    <option value="Seafood">{t('menu.catSeafood')}</option>
                    <option value="Tofu/Egg">{t('menu.catTofuEgg')}</option>
                    <option value="Drink">{t('menu.catDrink')}</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 accent-amber-600 rounded bg-[#111] border-stone-800"
                />
                <label htmlFor="isActive" className="text-sm text-stone-400">{t('menu.available')}</label>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    console.log('Cancel clicked');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-stone-700 text-stone-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 text-stone-950 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  {saving ? t('menu.saving') : t('menu.saveItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
