import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/orders - получить все заказы (admin only)
export async function GET() {
  try {
    const orders = db.prepare(`
      SELECT o.*, 
        (SELECT GROUP_CONCAT(oi.product_id || ':' || oi.quantity || ':' || oi.price) 
         FROM order_items oi WHERE oi.order_id = o.id) as items_json
      FROM orders o 
      ORDER BY o.created_at DESC
    `).all();

    // Преобразуем items_json в массив
    const ordersWithItems = orders.map((order: any) => {
      const items = order.items_json 
        ? order.items_json.split(',').map((item: string) => {
            const [productId, quantity, price] = item.split(':');
            return { product_id: parseInt(productId), quantity: parseInt(quantity), price: parseFloat(price) };
          })
        : [];
      return { ...order, items };
    });

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - создать заказ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, phone, email, address, items, user_id } = body;

    if (!customer_name || !phone || !email || !address || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Рассчитываем общую сумму и проверяем товары
    let total = 0;
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 400 });
      }
      total += (product as any).price * item.quantity;
    }

    // Создаём заказ с user_id (может быть null)
    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, customer_name, phone, email, address, total, status)
      VALUES (?, ?, ?, ?, ?, ?, 'new')
    `).run(user_id || null, customer_name, phone, email, address, total);

    // Добавляем элементы заказа
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      insertItem.run(orderResult.lastInsertRowid, item.product_id, item.quantity, (product as any).price);
      
      // Обновляем остаток на складе
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderResult.lastInsertRowid);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
