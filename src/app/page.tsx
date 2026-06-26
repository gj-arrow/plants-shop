'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, Product } from '@/contexts/CartContext';

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { items, addToCart, updateQuantity: updateCartQuantity } = useCart();
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setLoading(false);
      });
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter((c): c is string => Boolean(c))))];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleAddToCartWithFeedback = (product: Product) => {
    addToCart(product, 1);
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 600);
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number, maxStock: number) => {
    if (newQuantity <= 0) {
      updateCartQuantity(productId, 0);
    } else if (newQuantity <= maxStock) {
      updateCartQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="bg-gradient-animated min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero секция */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 rounded-3xl p-8 mb-8 text-white shadow-xl fade-in">
          <h1 className="text-4xl font-bold mb-2">🌿 Добро пожаловать в Plant Shop</h1>
          <p className="text-green-100 text-lg">Лучшие комнатные растения для вашего дома и офиса</p>
        </div>

        {/* Фильтр по категориям */}
        <div className="mb-6 flex flex-wrap gap-2 fade-in" style={{ animationDelay: '0.1s' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium btn-press ripple ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              {cat === 'all' ? '🌱 Все' : cat}
            </button>
          ))}
        </div>

        {/* Каталог товаров */}
        {loading ? (
          <div className="text-center py-12 fade-in">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>
            <p className="text-gray-600">Загрузка товаров...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 fade-in">
            <span className="text-4xl block mb-2">🍃</span>
            <p>Товары не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
              const cartItem = items.find(item => item.id === product.id);
              const quantityInCart = cartItem?.quantity || 0;

              return (
                <div
                  key={product.id}
                  className="fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ProductCard
                    product={product}
                    quantityInCart={quantityInCart}
                    onAddToCart={handleAddToCartWithFeedback}
                    onUpdateQuantity={handleUpdateQuantity}
                    isHighlighted={lastAddedId === product.id}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (p: Product) => void;
  onUpdateQuantity: (id: number, qty: number, maxStock: number) => void;
  isHighlighted: boolean;
}

function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  isHighlighted,
}: ProductCardProps) {
  const router = useRouter();
  const isInCart = quantityInCart > 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-2xl shadow-md overflow-hidden card-hover flex flex-col h-full cursor-pointer ${
        isHighlighted ? 'pulse-soft ring-2 ring-green-400' : ''
      }`}
    >
      <div className="h-48 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🪴</span>
        )}
        {/* Бэдж количества в корзине */}
        {isInCart && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pulse-soft">
            ✓ {quantityInCart} шт.
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-green-600 font-medium mb-1 bg-green-50 inline-block px-2 py-1 rounded-full self-start">
          {product.category}
        </div>
        <h3 className="font-semibold text-lg text-gray-800 mb-1 mt-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-gray-900">{product.price} ₽</span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              product.stock > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {product.stock > 0 ? `✓ ${product.stock} шт.` : '✗ Нет'}
          </span>
        </div>

        {product.stock > 0 ? (
          <div className="flex gap-2">
            {isInCart ? (
              // Контролы количества в корзине
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1, product.stock)}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-bold text-lg btn-press hover:bg-red-100 transition flex items-center justify-center"
                  aria-label="Уменьшить количество"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span className="text-sm text-gray-500 block">В корзине</span>
                  <span className="text-xl font-bold text-green-600">{quantityInCart} шт.</span>
                </div>
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1, product.stock)}
                  className="w-10 h-10 rounded-xl bg-green-600 text-white font-bold text-lg btn-press hover:bg-green-700 transition flex items-center justify-center"
                  aria-label="Увеличить количество"
                  disabled={quantityInCart >= product.stock}
                >
                  +
                </button>
              </div>
            ) : (
              // Кнопка добавления в корзину
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-3 rounded-xl font-medium btn-press ripple hover:from-green-700 hover:to-emerald-600 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>🛒</span>
                <span>В корзину</span>
              </button>
            )}
          </div>
        ) : (
          <button
            disabled
            className="w-full bg-gray-200 text-gray-500 px-4 py-3 rounded-xl font-medium cursor-not-allowed"
          >
            Нет в наличии
          </button>
        )}
      </div>
    </div>
  );
}
