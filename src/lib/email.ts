import nodemailer from 'nodemailer';

interface OrderEmailData {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  delivery_method: string;
  total: number;
  created_at: string;
  items: { product_name: string; quantity: number; price: number }[];
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOrderEmail(order: OrderEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('SMTP not configured — email not sent');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@plant-shop.by';

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">${item.product_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:right;">${item.price * item.quantity} р.</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1B5E20, #4CAF50); padding: 32px 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Спасибо за заказ!</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Номер заказа: <strong>#${order.id}</strong></p>
      </div>
      <div style="padding: 24px; background: #fff;">
        <p style="color: #333; margin: 0 0 16px;">Здравствуйте, <strong>${order.customer_name}</strong>!</p>
        <p style="color: #666; margin: 0 0 20px;">Ваш заказ оформлен и передан в обработку.</p>

        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f0fdf4;">
              <th style="padding:10px 12px;text-align:left;font-size:14px;">Товар</th>
              <th style="padding:10px 12px;text-align:center;font-size:14px;">Кол-во</th>
              <th style="padding:10px 12px;text-align:right;font-size:14px;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;font-size:16px;">Итого:</td>
              <td style="padding:12px;text-align:right;font-weight:bold;font-size:16px;color:#4CAF50;">${order.total} р.</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px; font-size: 14px; color: #333;">Детали доставки</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">🚚 Способ доставки: <strong>${order.delivery_method}</strong></p>
          ${order.delivery_method !== 'Самовывоз' ? `<p style="margin: 4px 0 0; color: #666; font-size: 14px;">📍 Адрес: ${order.address}</p>` : ''}
        </div>

        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          ${new Date(order.created_at + 'Z').toLocaleString('ru-RU')}
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: order.email,
      subject: `Заказ #${order.id} оформлен — Plant Shop`,
      html,
    });
    console.log(`Order email sent to ${order.email}`);
  } catch (err) {
    console.error('Failed to send order email:', err);
  }
}
