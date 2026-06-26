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
        <h1 className="text-2xl font-bold text-[#2D1B4E] font-['Playfair_Display'] mb-6">Заказы</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50]"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-[#8a7a9a] border border-[rgba(76,175,80,0.1)]">
            Заказы пока отсутствуют
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(76,175,80,0.1)] overflow-hidden border border-[rgba(76,175,80,0.08)]">
                <div className="p-4">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-[#2D1B4E]">Заказ #{order.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <div className="text-sm text-[#4A3267] space-y-1">
                        <p>👤 {order.customer_name}</p>
                        <p>📞 {order.phone}</p>
                        <p>✉️ {order.email}</p>
                        <p>📍 {order.address}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#2D1B4E] mb-2">{order.total} р.</div>
                      <div className="text-sm text-[#8a7a9a]">
                        {new Date(order.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="px-3 py-1.5 border border-[rgba(76,175,80,0.2)] rounded-lg text-sm focus:outline-none focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="px-3 py-1.5 text-sm font-medium text-[#4CAF50] hover:bg-[#E8F5E9] rounded-lg transition"
                    >
                      {expandedOrder === order.id ? 'Скрыть детали' : 'Показать детали'}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t border-[rgba(76,175,80,0.08)] bg-[#FDF6F0] p-4">
                    <h3 className="font-medium text-[#4A3267] mb-3">Состав заказа:</h3>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-[#4A3267]">
                            {getProductName(item.product_id)} × {item.quantity}
                          </span>
                          <span className="font-medium text-[#2D1B4E]">{item.price * item.quantity} р.</span>
                        </div>
                      ))}
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
