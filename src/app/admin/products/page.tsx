'use client';

import { useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';

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
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');

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
  }, []);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category || '',
        image_url: product.image_url || '',
      });
      setPreviewImage(product.image_url || '');
    } else {
      setEditingProduct(null);
      setFormData(emptyProduct);
      setPreviewImage('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
    setPreviewImage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки');
      }

      setFormData(prev => ({ ...prev, image_url: data.url }));
      setPreviewImage(data.url);
    } catch (error: any) {
      alert(error.message || 'Ошибка при загрузке изображения');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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
      <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-6 fade-in">
          <h1 className="text-2xl font-bold text-gray-800">🌿 Управление товарами</h1>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
          >
            + Добавить товар
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 fade-in">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden fade-in">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товар</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категория</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Остаток</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition btn-press">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl flex items-center justify-center shadow-sm">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-xl">🪴</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                        {product.category || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{product.price} ₽</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                        product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock > 0 ? `✓ ${product.stock}` : '✗ Нет'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(product)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-medium text-sm btn-press transition mr-2"
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium text-sm btn-press transition"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto slide-in">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>{editingProduct ? '✏️' : '➕'}</span>
                  {editingProduct ? 'Редактирование товара' : 'Новый товар'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                      placeholder="Например: Монстера деликатесная"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none"
                      placeholder="Описание растения..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Остаток</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                        placeholder="Комнатные"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                        />
                        {uploading && (
                          <p className="text-xs text-green-600">🔄 Загрузка...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Предпросмотр изображения */}
                  {previewImage && (
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
                      <img
                        src={previewImage}
                        alt="Предпросмотр"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage('');
                          setFormData({ ...formData, image_url: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full btn-press hover:bg-red-600 transition"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 btn-press hover:bg-gray-50 transition"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
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
