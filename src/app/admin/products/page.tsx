'use client';

import { useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';
import { parseImages, formatPrice } from '@/lib/product-utils';
import ProductEditModal from '@/components/ProductEditModal';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  image_url: string;
  out_of_stock: boolean | number;
  created_at?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [sortField, setSortField] = useState<'name' | 'price' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: 'name' | 'price') => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Скролл вверх при заходе на страницу (чтобы не было авто-восстановления скролла)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  const openModal = (product?: Product) => {
    setEditingProduct(product || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (response.ok) {
      fetchProducts();
    } else {
      alert('Ошибка при удалении товара');
    }
  };

  // Доступные подкатегории — из товаров отфильтрованной категории
  const availableSubcategories = [...new Set(
    (filterCategory
      ? products.filter(p => p.category === filterCategory)
      : products
    )
      .map(p => p.subcategory)
      .filter(Boolean)
  )];

  // Сбрасываем подкатегорию при смене категории
  useEffect(() => {
    setFilterSubcategory('');
  }, [filterCategory]);

  const filteredProducts = (filterCategory
    ? products.filter(p => p.category === filterCategory)
    : products
  ).filter(p => !filterSubcategory || p.subcategory === filterSubcategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortField === 'created_at') {
      return (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()) * dir;
    }
    return (a.price - b.price) * dir;
  });

  const sortArrow = (field: 'name' | 'price' | 'created_at') => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <AdminAuth>
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-4 fade-in">
          <h1 className="text-2xl font-['Playfair_Display'] text-[#2D1B4E] font-bold">🌿 Управление товарами</h1>
          <button
            onClick={() => openModal()}
            className="bg-[#8CA89C] text-white px-5 py-2.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
          >
            + Добавить товар
          </button>
        </div>

        {/* Фильтры */}
        <div className="mb-4 fade-in flex flex-wrap items-center gap-3">
          <label className="text-sm text-[#1A3326] font-medium">Фильтр:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border-2 border-[rgba(140,168,156,0.15)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition bg-white appearance-none cursor-pointer"
          >
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          {filterCategory && availableSubcategories.length > 0 && (
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="px-3 py-2 border-2 border-[rgba(140,168,156,0.15)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition bg-white appearance-none cursor-pointer"
            >
              <option value="">Все подкатегории</option>
              {availableSubcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )}

          {(filterCategory || filterSubcategory) && (
            <span className="text-sm text-[#8a7a9a]">
              {filteredProducts.length} товар{filteredProducts.length !== 1 ? 'ов' : ''}
            </span>
          )}

          {/* Сортировка */}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-[#1A3326] font-medium hidden sm:inline">Сортировка:</label>
            <select
              value={`${sortField}-${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-') as ['name' | 'price' | 'created_at', 'asc' | 'desc'];
                setSortField(field);
                setSortDir(dir);
              }}
              className="px-3 py-2 border-2 border-[rgba(140,168,156,0.15)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition bg-white appearance-none cursor-pointer"
            >
              <option value="created_at-desc">Новые сначала</option>
              <option value="created_at-asc">Старые сначала</option>
              <option value="name-asc">Название А→Я</option>
              <option value="name-desc">Название Я→А</option>
              <option value="price-asc">Цена ↑</option>
              <option value="price-desc">Цена ↓</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 fade-in">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8CA89C] mb-2"></div>
            <p className="text-[#1A3326]">Загрузка...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(140,168,156,0.12)] fade-in">
            {/* Мобильные карточки */}
            <div className="divide-y divide-[rgba(140,168,156,0.08)] sm:hidden">
              {sortedProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#E8F0EA] via-[#F5F5F0] to-[#E8F0EA] rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                    {(() => {
                      const imgs = parseImages(product);
                      return imgs.length > 0 ? (
                        <img src={imgs[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-lg">🪴</span>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#2D1B4E] text-base leading-snug">{product.name}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F0EA] text-[#8CA89C] inline-block mt-1">{product.category || '-'}</span>
                    <div className="text-base font-bold text-[#2D1B4E] mt-1">
                      {product.out_of_stock ? (
                        <span className="text-red-400 text-sm font-medium">Нет в наличии</span>
                      ) : (
                        <>{formatPrice(product.price)} р.</>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openModal(product)} className="text-[#8CA89C] hover:bg-[#E8F0EA] w-11 h-11 rounded-xl text-lg btn-press transition flex items-center justify-center" title="Редактировать">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:bg-red-50 w-11 h-11 rounded-xl text-lg btn-press transition flex items-center justify-center" title="Удалить">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Десктопная таблица */}
            <table className="w-full hidden sm:table">
              <thead className="bg-[#E8F0EA]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-[#1A3326] uppercase tracking-wider cursor-pointer select-none hover:text-[#8CA89C] transition" onClick={() => toggleSort('name')}>
                    Товар{sortArrow('name')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-[#1A3326] uppercase tracking-wider">Категория</th>
                  <th className="px-4 py-3 text-left text-xs text-[#1A3326] uppercase tracking-wider cursor-pointer select-none hover:text-[#8CA89C] transition" onClick={() => toggleSort('price')}>
                    Цена{sortArrow('price')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-[#1A3326] uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(140,168,156,0.08)]">
                {sortedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-[#FDF6F0] transition btn-press">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#E8F0EA] via-[#F5F5F0] to-[#E8F0EA] rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                          {(() => {
                            const imgs = parseImages(product);
                            return imgs.length > 0 ? (
                              <img src={imgs[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span className="text-xl">🪴</span>
                            );
                          })()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2D1B4E]">{product.name}</div>
                          <div className="text-sm text-[#6B5B8D] truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm px-3 py-1 rounded-full bg-[#E8F0EA] text-[#8CA89C] font-medium">
                        {product.category || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#2D1B4E]">
                      {product.out_of_stock ? (
                        <span className="text-red-400 font-medium">Нет в наличии</span>
                      ) : (
                        <>{formatPrice(product.price)} р.</>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openModal(product)}
                        className="text-[#8CA89C] hover:bg-[#E8F0EA] px-3 py-1.5 rounded-lg font-medium text-sm btn-press transition mr-2"
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium text-sm btn-press transition"
                      >
                        🗑️ Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <ProductEditModal
            product={editingProduct}
            categories={categories}
            onClose={closeModal}
            onSaved={fetchProducts}
          />
        )}
      </div>
    </AdminAuth>
  );
}
