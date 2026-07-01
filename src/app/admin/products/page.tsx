'use client';

import { useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';
import { parseImages } from '@/lib/product-utils';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
}

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: '',
  image_url: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [priceInput, setPriceInput] = useState('0');
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

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
    if (product) {
      setEditingProduct(product);
      const images = parseImages(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category || '',
        image_url: images.length > 0 ? JSON.stringify(images) : '',
      });
      setPriceInput(String(product.price));
      setPreviewImages(images);
    } else {
      setEditingProduct(null);
      setFormData(emptyProduct);
      setPriceInput('0');
      setPreviewImages([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
    setPriceInput('0');
    setPreviewImages([]);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formDataObj });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка загрузки');
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        newUrls.push(url);
      }

      const allUrls = [...previewImages, ...newUrls].slice(0, 3);
      setPreviewImages(allUrls);
      setFormData(prev => ({
        ...prev,
        image_url: allUrls.length > 0 ? JSON.stringify(allUrls) : '',
      }));
    } catch (error: any) {
      alert(error.message || 'Ошибка при загрузке изображения');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const remaining = previewImages.filter((_, i) => i !== index);
    setPreviewImages(remaining);
    setFormData(prev => ({
      ...prev,
      image_url: remaining.length > 0 ? JSON.stringify(remaining) : '',
    }));
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    const reordered = [previewImages[index], ...previewImages.filter((_, i) => i !== index)];
    setPreviewImages(reordered);
    setFormData(prev => ({
      ...prev,
      image_url: JSON.stringify(reordered),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      fetchProducts();
      closeModal();
    } else {
      alert('Ошибка при сохранении товара');
    }
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

  return (
    <AdminAuth>
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-6 fade-in">
          <h1 className="text-2xl font-['Playfair_Display'] text-[#2D1B4E] font-bold">🌿 Управление товарами</h1>
          <button
            onClick={() => openModal()}
            className="bg-[#8CA89C] text-white px-5 py-2.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
          >
            + Добавить товар
          </button>
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
              {products.map(product => (
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
                    <div className="text-base font-bold text-[#2D1B4E] mt-1">{product.price} р.</div>
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
                  <th className="px-4 py-3 text-left text-xs text-[#1A3326] uppercase tracking-wider">Товар</th>
                  <th className="px-4 py-3 text-left text-xs text-[#1A3326] uppercase tracking-wider">Категория</th>
                  <th className="px-4 py-3 text-left text-xs text-[#1A3326] uppercase tracking-wider">Цена</th>
                  <th className="px-4 py-3 text-right text-xs text-[#1A3326] uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(140,168,156,0.08)]">
                {products.map(product => (
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
                    <td className="px-4 py-3 text-sm font-bold text-[#2D1B4E]">{product.price} р.</td>
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

        {/* Модальное окно */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto slide-in">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#2D1B4E] mb-4 flex items-center gap-2">
                  <span>{editingProduct ? '✏️' : '➕'}</span>
                  {editingProduct ? 'Редактирование товара' : 'Новый товар'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A3326] mb-1">Название</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition"
                      placeholder="Например: Монстера деликатесная"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A3326] mb-1">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition resize-none"
                      placeholder="Описание растения..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A3326] mb-1">Цена (р.)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={priceInput}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, '');
                          setPriceInput(digits);
                          setFormData({ ...formData, price: digits === '' ? 0 : parseInt(digits, 10) });
                        }}
                        className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A3326] mb-1">Категория</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition bg-white appearance-none cursor-pointer"
                      >
                        <option value="">Выберите категорию</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Изображения — на всю ширину, крупнее */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A3326] mb-2">
                      Изображения (до 3 шт.)
                    </label>

                    {/* Сетка превью */}
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {previewImages.map((url, index) => (
                          <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#E8F0EA] group shadow-sm">
                            <img
                              src={url}
                              alt={`Фото ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1.5 right-1.5 bg-[#8CA89C] text-white p-1.5 rounded-full btn-press hover:bg-[#5B7F6B] transition opacity-0 group-hover:opacity-100"
                              title="Удалить"
                            >
                              ✕
                            </button>
                            {index === 0 ? (
                              <div className="absolute bottom-1.5 left-1.5 bg-yellow-500 text-white text-xs px-2.5 py-1 rounded-full shadow font-medium">
                                ⭐ Главная
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setMainImage(index)}
                                className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-yellow-600 font-medium"
                                title="Сделать главной"
                              >
                                ⭐ Сделать главной
                              </button>
                            )}
                          </div>
                        ))}
                        {/* Пустые слоты */}
                        {Array.from({ length: 3 - previewImages.length }).map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-[4/3] rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                            <span className="text-gray-300 text-3xl">+</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Кнопка загрузки */}
                    {previewImages.length < 3 && (
                      <div>
                        <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-[rgba(140,168,156,0.25)] rounded-xl bg-white cursor-pointer hover:bg-[#FDF6F0] transition">
                          <span className="inline-block bg-[#8CA89C] text-white px-4 py-1.5 rounded-lg text-sm font-medium btn-press">
                            {uploading ? '🔄 Загрузка...' : 'Выбрать файлы'}
                          </span>
                          <span className="text-sm text-[#8a7a9a]">
                            PNG, JPG, WebP до 5MB
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                    {previewImages.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Загрузите до 3 изображений товара. Первое будет главным.</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 border-2 border-[rgba(140,168,156,0.2)] rounded-xl font-medium text-[#1A3326] btn-press hover:bg-[#FDF6F0] transition"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-[#8CA89C] text-white rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
                    >
                      {editingProduct ? '💾 Сохранить' : '✨ Создать'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAuth>
  );
}
