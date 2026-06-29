'use client';

import { useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';

interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert('Введите название категории');
      return;
    }

    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : '/api/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() }),
    });

    if (response.ok) {
      fetchCategories();
      closeModal();
    } else {
      const data = await response.json();
      alert(data.error || 'Ошибка при сохранении категории');
    }
  };

  const handleDelete = async (cat: Category) => {
    const msg = cat.productCount > 0
      ? `Категорию "${cat.name}" используют ${cat.productCount} товаров. Удалить? Категория у товаров сбросится.`
      : `Удалить категорию "${cat.name}"?`;
    if (!confirm(msg)) return;

    const response = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
    if (response.ok) {
      fetchCategories();
    } else {
      alert('Ошибка при удалении категории');
    }
  };

  return (
    <AdminAuth>
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-6 fade-in">
          <h1 className="text-2xl font-['Playfair_Display'] text-[#2D1B4E] font-bold">📂 Управление категориями</h1>
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-5 py-2.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
          >
            + Добавить категорию
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 fade-in">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50] mb-2"></div>
            <p className="text-[#4A3267]">Загрузка...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-[0_8px_30px_rgba(76,175,80,0.12)] fade-in">
            <div className="text-5xl mb-4">📂</div>
            <h2 className="text-xl font-bold text-[#2D1B4E] mb-2">Нет категорий</h2>
            <p className="text-[#6B5B8D] mb-6">Создайте первую категорию товаров</p>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-6 py-2.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
            >
              + Создать категорию
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(76,175,80,0.12)] fade-in overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gradient-to-r from-[#E8F5E9] to-[#F1F8E9]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-[#4A3267] uppercase tracking-wider">Название</th>
                  <th className="px-4 py-3 text-left text-xs text-[#4A3267] uppercase tracking-wider">Описание</th>
                  <th className="px-4 py-3 text-left text-xs text-[#4A3267] uppercase tracking-wider">Товаров</th>
                  <th className="px-4 py-3 text-right text-xs text-[#4A3267] uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(76,175,80,0.08)]">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-[#FDF6F0] transition btn-press">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#2D1B4E]">{cat.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B5B8D] max-w-xs truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        cat.productCount > 0
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.productCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="text-[#4CAF50] hover:bg-[#E8F5E9] px-3 py-1.5 rounded-lg font-medium text-sm btn-press transition mr-2"
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full slide-in">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#2D1B4E] mb-4 flex items-center gap-2">
                  <span>{editingCategory ? '✏️' : '➕'}</span>
                  {editingCategory ? 'Редактирование категории' : 'Новая категория'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4A3267] mb-1">Название</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                      placeholder="Например: Кактусы"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4A3267] mb-1">Описание</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition resize-none"
                      placeholder="Описание категории..."
                    />
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
                      {editingCategory ? '💾 Сохранить' : '✨ Создать'}
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
