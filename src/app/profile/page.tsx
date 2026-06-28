'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
  avatar_url?: string | null;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
}

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  delivery_method: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  new: 'Новый',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [isCustomAuth, setIsCustomAuth] = useState(false);

  // Переключение таба из query-параметра
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'orders') setActiveTab('orders');
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    // Если есть NextAuth-сессия — используем её
    if (session?.user) {
      const userWithRole = session.user as any;
      if (userWithRole.role === 'admin') {
        router.push('/admin/products');
        return;
      }
      setUser({
        id: userWithRole.id,
        email: userWithRole.email,
        name: userWithRole.name,
        phone: userWithRole.phone || null,
        created_at: userWithRole.created_at || new Date().toISOString(),
        avatar_url: userWithRole.avatar_url,
      });
      setEditForm({
        name: userWithRole.name || '',
        phone: userWithRole.phone || '',
      });
      fetchUserOrders();
      return;
    }

    // Если нет NextAuth — проверяем кастомную auth (email/password)
    fetch('/api/auth')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.authenticated && data.user) {
          if (data.user.role === 'admin') {
            router.push('/admin/products');
            return;
          }
          setIsCustomAuth(true);
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.email,
            phone: data.user.phone || null,
            created_at: data.user.created_at || new Date().toISOString(),
          });
          setEditForm({
            name: data.user.name || data.user.email,
            phone: data.user.phone || '',
          });
          fetchUserOrders();
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [session, status, router]);

  const fetchUserOrders = async () => {
    try {
      const response = await fetch('/api/orders/user');
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!confirm('Вы уверены, что хотите отменить заказ?')) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        const err = await response.json();
        alert(err.error || 'Ошибка при отмене заказа');
      }
    } catch (error) {
      alert('Ошибка при отмене заказа');
    }
  };

  const handleLogout = async () => {
    if (isCustomAuth) {
      await fetch('/api/auth', { method: 'DELETE' });
    } else {
      await signOut({ callbackUrl: '/' });
    }
    window.location.href = '/';
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="bg-gradient-animated min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden fade-in">
          {/* Header профиля */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                  👤
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-green-100">{user.email}</p>
                  <p className="text-green-200 text-sm">
                    С нами с {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-medium btn-press transition"
              >
                Выйти
              </button>
            </div>
          </div>

          {/* Табы */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'profile'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👤 Профиль
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'orders'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📦 Заказы ({orders.length})
              </button>
            </div>
          </div>

          {/* Контент */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Личные данные</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-green-600 hover:text-green-700 font-medium btn-press"
                    >
                      ✏️ Редактировать
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                        placeholder="+7 (999) 000-00-00"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 btn-press hover:bg-gray-50"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-medium btn-press ripple"
                      >
                        Сохранить
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Имя</p>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{user.email}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Телефон</p>
                        <p className="font-semibold text-gray-900">{user.phone || 'Не указан'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Дата регистрации</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <Link
                    href="/"
                    className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg"
                  >
                    🛒 В каталог
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-4">История заказов</h2>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                    <p className="text-gray-600">Загрузка заказов...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-5xl block mb-3">📦</span>
                    <p className="text-gray-600 mb-4">У вас пока нет заказов</p>
                    <Link
                      href="/"
                      className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg"
                    >
                      Перейти в каталог
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">Заказ #{order.id}</span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  statusColors[order.status] || 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {statusLabels[order.status] || order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at + 'Z').toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-2xl font-bold text-green-600">{order.total} р.</p>
                            {order.status === 'new' && (
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200"
                              >
                                Отменить заказ
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Состав заказа — всегда виден */}
                        <div className="bg-[#F8FAF5] rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-[#4CAF50] uppercase tracking-wider mb-2">Состав заказа</p>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.product_name} <span className="text-gray-400">×</span> {item.quantity}
                                </span>
                                <span className="font-medium text-gray-800">{item.price * item.quantity} р.</span>
                              </div>
                            ))}
                            <div className="border-t border-[#E0E8D8] mt-2 pt-1 flex justify-between text-sm font-bold">
                              <span className="text-gray-700">Итого</span>
                              <span className="text-green-600">{order.total} р.</span>
                            </div>
                          </div>
                        </div>

                        {/* Детали доставки — под катом */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-green-600 font-medium hover:text-green-700 list-none flex items-center gap-1">
                            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            Детали доставки
                          </summary>
                          <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1">
                            <p className="text-sm text-gray-600">
                              🚚 Способ: <span className="font-medium text-gray-800">{order.delivery_method}</span>
                            </p>
                            {order.delivery_method !== 'Самовывоз' && (
                              <p className="text-sm text-gray-600">
                                📍 Адрес: <span className="font-medium text-gray-800">{order.address}</span>
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              👤 {order.customer_name} | 📞 {order.phone}
                            </p>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
