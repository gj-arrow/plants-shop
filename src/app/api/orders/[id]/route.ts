import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// PUT /api/orders/[id] - обновить статус заказа
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const validStatuses = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Отменить можно только новый заказ
    if (status === 'cancelled' && existing.status !== 'new') {
      return NextResponse.json({ error: 'Можно отменить только новый заказ' }, { status: 400 });
    }

    db.prepare(`
      UPDATE orders SET status = ? WHERE id = ?
    `).run(status || existing.status, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
