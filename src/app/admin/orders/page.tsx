'use client';

import { useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
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
  new: 'bg-[#E3F2FD] text-[#1565C0]',
  processing: 'bg-[#FFF8E1] text-[#F57F17]',
  shipped: 'bg-[#E8F5E9] text-[#4CAF50]',
  delivered: 'bg-[#E8F5E9] text-[#2E7D32]',
  cancelled: 'bg-[#FFEBEE] text-[#C62828]',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(res => res.json()),
      fetch('/api/products').then(res => res.json()),
    ]).then(([ordersData, productsData]) => {
      setOrders(ordersData);
      setProducts(productsData);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (orderId: number, newStatus: string) => {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || `Товар #${productId}`;
  };

  return (
    <AdminAuth>
      <div>
        <h1 className="text-3xl font-bold text-[#2D1B4E] font-['Playfair_Display'] mb-6">Заказы</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#4CAF50]"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center text-lg text-[#8a7a9a] border border-[rgba(76,175,80,0.1)]">
            Заказы пока отсутствуют
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(76,175,80,0.1)] overflow-hidden border border-[rgba(76,175,80,0.08)]">
                <div className="p-5">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-xl text-[#2D1B4E]">Заказ #{order.id}</span>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>

                      <div className="text-base text-[#4A3267] space-y-1">
                        <p className="text-sm text-[#8a7a9a]">
                          {new Date(order.created_at + 'Z').toLocaleString('ru-RU')}
                        </p>
                        <p className="text-sm text-[#4CAF50] font-medium">🚚 {order.delivery_method}</p>
                      </div>

                      {/* Состав заказа — всегда виден */}
                      <div className="mt-3 space-y-1.5">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-base">
                            <span className="text-[#4A3267]">
                              {getProductName(item.product_id)} × {item.quantity}
                            </span>
                            <span className="font-medium text-[#2D1B4E] ml-4">{item.price * item.quantity} р.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#2D1B4E] mb-2">{order.total} р.</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="px-4 py-2 border border-[rgba(76,175,80,0.2)] rounded-lg text-base focus:outline-none focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="px-4 py-2 text-base font-medium text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition"
                    >
                      {expandedOrder === order.id ? 'Скрыть клиента' : 'Показать клиента'}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t border-[rgba(76,175,80,0.08)] bg-[#FDF6F0] p-5">
                    <h3 className="font-semibold text-lg text-[#4A3267] mb-3">Информация о клиенте:</h3>
                    <div className="text-base text-[#4A3267] space-y-1.5">
                      <p>👤 {order.customer_name}</p>
                      <p>📞 {order.phone}</p>
                      <p>✉️ {order.email}</p>
                      {order.delivery_method !== 'Самовывоз' && <p>📍 {order.address}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminAuth>
  );
}
