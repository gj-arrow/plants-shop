import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sessions } from '../../auth/route';

// GET /api/orders - получить заказы текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const session = sessions.get(sessionId);
    
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return NextResponse.json({ error: 'Сессия истекла' }, { status: 401 });
    }

    if (session.role !== 'user') {
      return NextResponse.json({ error: 'Неверная роль' }, { status: 403 });
    }

    // Получаем все заказы пользователя
    const orders = db.prepare(`
      SELECT o.*, 
        (SELECT GROUP_CONCAT(oi.product_id || ':' || oi.quantity || ':' || oi.price) 
         FROM order_items oi WHERE oi.order_id = o.id) as items_json
      FROM orders o 
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(session.userId);

    // Преобразуем items_json в массив и добавляем названия товаров
    const ordersWithItems = orders.map((order: any) => {
      const items = order.items_json 
        ? order.items_json.split(',').map((item: string) => {
            const [productId, quantity, price] = item.split(':');
            const product = db.prepare('SELECT name FROM products WHERE id = ?').get(parseInt(productId));
            return { 
              product_id: parseInt(productId), 
              quantity: parseInt(quantity), 
              price: parseFloat(price),
              product_name: product ? (product as any).name : 'Товар удалён'
            };
          })
        : [];
      return { ...order, items };
    });

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
