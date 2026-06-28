'use client';

import { useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';
import { parseImages } from '@/contexts/CartContext';

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
  const [stockInput, setStockInput] = useState('0');
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
      setStockInput(String(product.stock));
      setPreviewImages(images);
    } else {
      setEditingProduct(null);
      setFormData(emptyProduct);
      setPriceInput('0');
      setStockInput('0');
      setPreviewImages([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
    setPriceInput('0');
    setStockInput('0');
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
            className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-5 py-2.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
          >
            + Добавить товар
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 fade-in">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50] mb-2"></div>
            <p className="text-[#4A3267]">Загрузка...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(76,175,80,0.12)] overflow-hidden fade-in">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#E8F5E9] to-[#F1F8E9]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-[#4A3267] uppercase tracking-wider">Товар</th>
                  <th className="px-4 py-3 text-left text-xs text-[#4A3267] uppercase tracking-wider">Категория</th>
                  <th className="px-4 py-3 text-left text-xs text-[#4A3267] uppercase tracking-wider">Цена</th>
                  <th className="px-4 py-3 text-left text-xs text-[#4A3267] uppercase tracking-wider">Остаток</th>
                  <th className="px-4 py-3 text-right text-xs text-[#4A3267] uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(76,175,80,0.08)]">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-[#FDF6F0] transition btn-press">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#E8F5E9] via-[#FDF6F0] to-[#F1F8E9] rounded-xl flex items-center justify-center shadow-sm">
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
                      <span className="text-sm px-3 py-1 rounded-full bg-[#E8F5E9] text-[#4CAF50] font-medium">
                        {product.category || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#2D1B4E]">{product.price} р.</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        product.stock > 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#C62828]'
                      }`}>
                        {product.stock > 0 ? `✓ ${product.stock}` : '✗ Нет в наличии'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(product)}
                        className="text-[#4CAF50] hover:bg-[#E8F5E9] px-3 py-1.5 rounded-lg font-medium text-sm btn-press transition mr-2"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto slide-in">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#2D1B4E] mb-4 flex items-center gap-2">
                  <span>{editingProduct ? '✏️' : '➕'}</span>
                  {editingProduct ? 'Редактирование товара' : 'Новый товар'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4A3267] mb-1">Название</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                      placeholder="Например: Монстера деликатесная"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4A3267] mb-1">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition resize-none"
                      placeholder="Описание растения..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4A3267] mb-1">Цена (р.)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={priceInput}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, '');
                          setPriceInput(digits);
                          setFormData({ ...formData, price: digits === '' ? 0 : parseInt(digits, 10) });
                        }}
                        className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4A3267] mb-1">Остаток</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={stockInput}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, '');
                          setStockInput(digits);
                          setFormData({ ...formData, stock: digits === '' ? 0 : parseInt(digits, 10) });
                        }}
                        className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                      />
                    </div>
                  </div>

                  {/* Категория — на всю ширину */}
                  <div>
                    <label className="block text-sm font-medium text-[#4A3267] mb-1">Категория</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Изображения — на всю ширину, крупнее */}
                  <div>
                    <label className="block text-sm font-medium text-[#4A3267] mb-2">
                      Изображения (до 3 шт.)
                    </label>

                    {/* Сетка превью */}
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {previewImages.map((url, index) => (
                          <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#E8F5E9] group shadow-sm">
                            <img
                              src={url}
                              alt={`Фото ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1.5 right-1.5 bg-[#66BB6A] text-white p-1.5 rounded-full btn-press hover:bg-[#4CAF50] transition opacity-0 group-hover:opacity-100"
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
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          multiple
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="w-full px-4 py-3 border-2 border-[rgba(76,175,80,0.15)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-[#E8F5E9] file:text-[#4CAF50] file:font-medium file:text-sm hover:file:bg-[#C8E6C9]"
                        />
                        {uploading && (
                          <p className="text-xs text-[#4CAF50]">🔄 Загрузка...</p>
                        )}
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
                      className="flex-1 px-4 py-2.5 border-2 border-[rgba(76,175,80,0.2)] rounded-xl font-medium text-[#4A3267] btn-press hover:bg-[#FDF6F0] transition"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
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
