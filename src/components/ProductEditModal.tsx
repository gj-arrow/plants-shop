'use client';

import { useState, useEffect } from 'react';
import { parseImages, type Product } from '@/lib/product-utils';

interface ProductEditModalProps {
  product: Product | null;
  categories: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  image_url: string;
  out_of_stock: boolean | number;
};

export default function ProductEditModal({
  product,
  categories,
  onClose,
  onSaved,
}: ProductEditModalProps) {
  const initialImages = product ? parseImages(product) : [];

  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (product) {
      return {
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category || '',
        subcategory: product.subcategory || undefined,
        image_url: initialImages.length > 0 ? JSON.stringify(initialImages) : '',
        out_of_stock: Boolean(product.out_of_stock),
      };
    }
    return {
      name: '',
      description: '',
      price: 0,
      category: '',
      subcategory: undefined,
      image_url: '',
      out_of_stock: false,
    };
  });

  const [priceInput, setPriceInput] = useState(() => {
    if (product && !product.out_of_stock) return String(product.price);
    return '';
  });

  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(initialImages);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Клавиатурная навигация в полноэкранном режиме
  useEffect(() => {
    if (fullscreenIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setFullscreenIndex(null);
          break;
        case 'ArrowLeft':
          setFullscreenIndex((prev) =>
            prev !== null && prev > 0 ? prev - 1 : previewImages.length - 1,
          );
          break;
        case 'ArrowRight':
          setFullscreenIndex((prev) =>
            prev !== null && prev < previewImages.length - 1 ? prev + 1 : 0,
          );
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [fullscreenIndex, previewImages.length]);

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
      setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      image_url: remaining.length > 0 ? JSON.stringify(remaining) : '',
    }));
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    const reordered = [previewImages[index], ...previewImages.filter((_, i) => i !== index)];
    setPreviewImages(reordered);
    setFormData((prev) => ({
      ...prev,
      image_url: JSON.stringify(reordered),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = product ? `/api/products/${product.id}` : '/api/products';
    const method = product ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      onSaved();
      onClose();
    } else {
      const data = await response.json().catch(() => ({}));
      alert(data.error || 'Ошибка при сохранении товара');
    }
  };

  return (
    <>
      {/* Полноэкранный просмотр фото */}
      {fullscreenIndex !== null && previewImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center"
          onClick={() => setFullscreenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenIndex(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition z-10"
          >
            ✕
          </button>

          {previewImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : previewImages.length - 1,
                );
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition z-10"
            >
              ‹
            </button>
          )}

          {previewImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIndex((prev) =>
                  prev !== null && prev < previewImages.length - 1 ? prev + 1 : 0,
                );
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition z-10"
            >
              ›
            </button>
          )}

          <img
            src={previewImages[fullscreenIndex]}
            alt={`Фото ${fullscreenIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {previewImages.length > 1 && (
            <div className="absolute bottom-6 flex items-center gap-2">
              {previewImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenIndex(i);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === fullscreenIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно формы */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto slide-in relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full text-[#8a7a9a] hover:text-[#2D1B4E] hover:bg-[#E8F0EA] transition z-10 text-xl"
          >
            ✕
          </button>
          <div className="p-6">
            <h2 className="text-xl font-bold text-[#2D1B4E] mb-4 flex items-center gap-2">
              <span>{product ? '✏️' : '➕'}</span>
              {product ? 'Редактирование товара' : 'Новый товар'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A3326] mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A3326] mb-1">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition resize-none"
                />
              </div>

              {/* Чекбокс "Нет в наличии" */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.out_of_stock as boolean}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({ ...formData, out_of_stock: checked });
                    if (checked) {
                      setPriceInput('');
                      setFormData((prev) => ({ ...prev, price: 0 }));
                    }
                  }}
                  className="w-5 h-5 rounded border-2 border-[rgba(140,168,156,0.3)] accent-[#8CA89C] cursor-pointer"
                />
                <span className="text-sm font-medium text-[#1A3326]">Нет в наличии</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A3326] mb-1">
                    Цена (р.)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      setPriceInput(val);
                      const num = parseFloat(val);
                      setFormData({ ...formData, price: isNaN(num) ? 0 : num });
                    }}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition ${
                      formData.out_of_stock
                        ? 'border-gray-200 bg-gray-100 text-gray-400'
                        : 'border-[rgba(140,168,156,0.15)]'
                    }`}
                    required={!formData.out_of_stock}
                    disabled={formData.out_of_stock as boolean}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A3326] mb-1">
                    Категория
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A3326] mb-1">
                    Подкатегория
                  </label>
                  <select
                    value={formData.subcategory || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subcategory: e.target.value || undefined,
                      })
                    }
                    className="w-full px-4 py-2.5 border-2 border-[rgba(140,168,156,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CA89C] focus:border-[#8CA89C] transition bg-white appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={formData.category !== 'Гортензии'}
                  >
                    <option value="">Без подкатегории</option>
                    <option value="Метельчатые">Метельчатые</option>
                    <option value="Крупнолистные">Крупнолистные</option>
                  </select>
                </div>
              </div>

              {/* Изображения */}
              <div>
                <label className="block text-sm font-medium text-[#1A3326] mb-2">
                  Изображения (до 3 шт.)
                </label>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {previewImages.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#E8F0EA] group shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`Фото ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setFullscreenIndex(index)}
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
                      <div
                        key={`empty-${i}`}
                        className="aspect-[4/3] rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300"
                      >
                        <span className="text-gray-300 text-3xl">+</span>
                      </div>
                    ))}
                  </div>
                )}

                {previewImages.length < 3 && (
                  <div>
                    <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-[rgba(140,168,156,0.25)] rounded-xl bg-white cursor-pointer hover:bg-[#FDF6F0] transition">
                      <span className="inline-block bg-[#8CA89C] text-white px-4 py-1.5 rounded-lg text-sm font-medium btn-press">
                        {uploading ? '🔄 Загрузка...' : 'Выбрать файлы'}
                      </span>
                      <span className="text-sm text-[#8a7a9a]">
                        PNG, JPG, WebP до 10MB
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
                  <p className="text-xs text-gray-400 mt-1">
                    Загрузите до 3 изображений товара. Первое будет главным.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border-2 border-[rgba(140,168,156,0.2)] rounded-xl font-medium text-[#1A3326] btn-press hover:bg-[#FDF6F0] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#8CA89C] text-white rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
                >
                  {product ? '💾 Сохранить' : '✨ Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
