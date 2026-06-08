import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface MenuItem {
  id: string;
  name: string;
  chinese_name: string;
  category: string;
  price: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  cartItemId: string;
}

export default function SalesNew() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchMenu() {
      const { data } = await supabase.from('menu_items').select('*').eq('is_active', true);
      if (data) setMenuItems(data);
      setLoading(false);
    }
    fetchMenu();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.chinese_name && item.chinese_name.includes(searchTerm));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, cartItemId: Math.random().toString(36).substring(7) }];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'qrpays') => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);

    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          cashier_id: profile?.id,
          total_amount: totalAmount,
          payment_method: paymentMethod
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase.from('sales_items').insert(saleItems);
      if (itemsError) throw itemsError;

      setCart([]);
      toast.success(t('salesNew.successCheckout'));
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || t('salesNew.failCheckout'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col h-full gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold text-stone-200">{t('salesNew.title')}</h1>
        </div>
        
        <div className="flex gap-2 mb-2 lg:hidden overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-xs uppercase tracking-widest font-bold transition-colors ${
                selectedCategory === cat ? 'bg-amber-600 text-stone-950' : 'bg-[#111] text-stone-400 border border-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="glass-card flex-1 p-4 flex flex-col min-h-[50vh]">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={20} />
              <input
                type="text"
                placeholder={t('salesNew.searchMenu')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-800 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-[#111] text-stone-200"
              />
            </div>
            <div className="hidden lg:flex gap-2">
               {categories.slice(0, 4).map(cat => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-colors ${
                     selectedCategory === cat ? 'bg-amber-600 text-stone-950' : 'bg-[#111] text-stone-400 border border-stone-800 hover:bg-stone-800'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
               {categories.length > 4 && (
                 <select 
                   className="pl-2 pr-8 py-2 rounded-lg border border-stone-800 text-xs uppercase tracking-widest font-bold bg-[#111] text-stone-400"
                   value={selectedCategory}
                   onChange={(e) => setSelectedCategory(e.target.value)}
                 >
                   {categories.slice(4).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-stone-500">{t('common.loading')}</div>
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full py-12 text-center text-stone-500">{t('menu.noItems')}</div>
            ) : (
              filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-[#111] border border-stone-800/60 rounded-xl p-4 text-left hover:border-amber-500/50 hover:shadow-xl transition-all group flex flex-col h-full"
                >
                  <div className="flex-1">
                    <p className="font-serif font-bold text-stone-200 group-hover:text-amber-500 line-clamp-2">{item.name}</p>
                    {item.chinese_name && <p className="text-sm text-stone-500">{item.chinese_name}</p>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-amber-500 text-lg">RM {item.price.toFixed(2)}</span>
                    <div className="w-8 h-8 rounded-full border border-stone-700 bg-stone-800/50 text-stone-400 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-colors">
                      <Plus size={16} />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cart/Ticket Area */}
      <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-6rem)]">
        <div className="glass-card flex-1 flex flex-col overflow-hidden bg-[#111]">
          <div className="p-4 border-b border-stone-800 bg-stone-900/50 flex items-center gap-2">
            <ShoppingCart size={20} className="text-stone-400" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-stone-200">{t('salesNew.currentOrder')}</h2>
            <span className="ml-auto bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold px-2 py-1 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} {t('salesNew.items')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-500 p-6 text-center">
                <ShoppingCart size={48} className="mb-4 text-stone-800" />
                <p className="text-sm">{t('salesNew.emptyCart')}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartItemId} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium text-stone-200 text-sm">{item.name}</p>
                      <p className="font-bold text-amber-500 text-sm">RM {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    {item.chinese_name && <p className="text-xs text-stone-500">{item.chinese_name}</p>}
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">RM {item.price.toFixed(2)} / {t('salesNew.each')}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-stone-900/50 border border-stone-800 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-rose-500">
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-stone-200">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-emerald-500">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.cartItemId)} className="p-2 text-stone-500 hover:text-rose-500 hover:bg-rose-950/30 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-stone-900/50 border-t border-stone-800 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-stone-500">{t('salesNew.totalAmount')}</span>
              <span className="text-3xl font-serif font-bold text-stone-100">RM {totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleCheckout('cash')}
                disabled={cart.length === 0 || processing}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
              >
                <Banknote size={16} /> {processing ? t('salesNew.processing') : t('salesNew.cash')}
              </button>
              <button 
                onClick={() => handleCheckout('qrpays')}
                disabled={cart.length === 0 || processing}
                className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
              >
                <CreditCard size={16} /> {processing ? t('salesNew.processing') : t('salesNew.qrCard')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
