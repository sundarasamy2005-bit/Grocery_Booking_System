import nodemailer from 'nodemailer';
import { IOrder } from '../types';

const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️  Gmail credentials not set — email notifications will be skipped');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

const transporter = createTransporter();

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!transporter) {
    console.warn(`📧 [EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Local Grocery" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    // Don't throw — email failure should not break order flow
  }
};

const baseStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const headerStyle = `
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  padding: 32px 24px;
  text-align: center;
`;

const bodyStyle = `padding: 24px;`;

const footerStyle = `
  background: #f8fafc;
  padding: 16px 24px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  border-top: 1px solid #e2e8f0;
`;

const orderStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    placed: '#2563eb',
    accepted: '#059669',
    preparing: '#d97706',
    ready: '#7c3aed',
    out_for_delivery: '#0891b2',
    delivered: '#16a34a',
    cancelled: '#dc2626',
    rejected: '#dc2626',
  };
  const color = colors[status] || '#64748b';
  return `<span style="background:${color}; color:white; padding:4px 12px; border-radius:20px; font-size:14px; font-weight:600;">${status.replace(/_/g, ' ').toUpperCase()}</span>`;
};

export const emailService = {
  async sendRegistrationEmail(email: string, name: string): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin:0;font-size:28px;">🛒 Welcome to Local Grocery!</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${name}! 👋</h2>
          <p>Thank you for joining <strong>Local Grocery</strong> — your local shopping companion.</p>
          <p>You can now:</p>
          <ul>
            <li>Discover nearby grocery shops</li>
            <li>Browse and order fresh products</li>
            <li>Track your orders in real time</li>
          </ul>
          <p>Start exploring shops near you today!</p>
        </div>
        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} Local Grocery. All rights reserved.</p>
        </div>
      </div>
    `;
    await sendEmail(email, 'Welcome to Local Grocery! 🛒', html);
  },

  async sendOrderPlacedEmail(
    email: string,
    name: string,
    order: IOrder & { shopName?: string }
  ): Promise<void> {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin:0;font-size:24px;">Order Placed Successfully! ✅</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${name},</h2>
          <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px;text-align:left;">Item</th>
                <th style="padding:8px;text-align:center;">Qty</th>
                <th style="padding:8px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;">
            <p style="margin:4px 0;"><strong>Subtotal:</strong> ₹${order.subtotal.toFixed(2)}</p>
            <p style="margin:4px 0;"><strong>Delivery Fee:</strong> ₹${order.deliveryFee.toFixed(2)}</p>
            <p style="margin:4px 0;font-size:18px;"><strong>Total: ₹${order.totalAmount.toFixed(2)}</strong></p>
            <p style="margin:4px 0;"><strong>Delivery Type:</strong> ${order.deliveryType === 'pickup' ? 'Pickup' : 'Home Delivery'}</p>
            <p style="margin:4px 0;"><strong>Payment:</strong> Cash on Delivery</p>
          </div>
          <p style="margin-top:16px;">Status: ${orderStatusBadge('placed')}</p>
          <p>We'll notify you when the shop accepts your order.</p>
        </div>
        <div style="${footerStyle}">
          <p>Thank you for shopping locally! 🏪</p>
        </div>
      </div>
    `;
    await sendEmail(email, `Order #${order.orderNumber} Placed Successfully`, html);
  },

  async sendOrderStatusEmail(
    email: string,
    name: string,
    order: IOrder,
    status: string,
    customMessage?: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      accepted: "Great news! Your order has been accepted and will be prepared shortly.",
      preparing: "Your order is now being prepared fresh for you!",
      ready: order.deliveryType === 'pickup'
        ? "Your order is ready for pickup! Please collect it from the shop."
        : "Your order is ready and will be dispatched soon!",
      out_for_delivery: "Your order is on its way! Our delivery partner is heading to your location.",
      delivered: "Your order has been delivered successfully! Enjoy your groceries. 🎉",
      cancelled: "We're sorry, your order has been cancelled.",
      rejected: "We're sorry, your order could not be accepted.",
    };

    const message = customMessage || statusMessages[status] || `Your order status has been updated to ${status}.`;

    const html = `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin:0;font-size:24px;">Order Update 📦</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${name},</h2>
          <p>Your order <strong>#${order.orderNumber}</strong> has been updated.</p>
          <p>Status: ${orderStatusBadge(status)}</p>
          <p>${message}</p>
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;">
            <p style="margin:4px 0;"><strong>Order Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
            <p style="margin:4px 0;"><strong>Payment:</strong> Cash on Delivery</p>
          </div>
        </div>
        <div style="${footerStyle}">
          <p>Thank you for shopping locally! 🏪</p>
        </div>
      </div>
    `;
    const subjects: Record<string, string> = {
      accepted: `Order #${order.orderNumber} Accepted ✅`,
      preparing: `Order #${order.orderNumber} Being Prepared 👨‍🍳`,
      ready: `Order #${order.orderNumber} Ready ${order.deliveryType === 'pickup' ? 'for Pickup' : 'for Dispatch'} 🛍️`,
      out_for_delivery: `Order #${order.orderNumber} Out for Delivery 🚚`,
      delivered: `Order #${order.orderNumber} Delivered Successfully 🎉`,
      cancelled: `Order #${order.orderNumber} Cancelled`,
      rejected: `Order #${order.orderNumber} Rejected`,
    };
    await sendEmail(email, subjects[status] || `Order #${order.orderNumber} Updated`, html);
  },

  async sendNewOrderToShopEmail(
    shopEmail: string,
    shopName: string,
    order: IOrder,
    customerName: string
  ): Promise<void> {
    const itemsHtml = order.items
      .map((item) => `<li>${item.name} × ${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}</li>`)
      .join('');

    const html = `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin:0;font-size:24px;">New Order Received! 🔔</h1>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${shopName},</h2>
          <p>You have received a new order <strong>#${order.orderNumber}</strong> from <strong>${customerName}</strong>.</p>
          <ul>${itemsHtml}</ul>
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;">
            <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
            <p><strong>Delivery Type:</strong> ${order.deliveryType === 'pickup' ? 'Pickup' : 'Home Delivery'}</p>
            ${
              order.deliveryLocation?.address
                ? `<p><strong>📍 Delivery Address:</strong> ${order.deliveryLocation.address}</p>
                   <p><a href="https://www.openstreetmap.org/?mlat=${order.deliveryLocation.latitude}&mlon=${order.deliveryLocation.longitude}#map=16/${order.deliveryLocation.latitude}/${order.deliveryLocation.longitude}" style="display:inline-block;padding:8px 16px;background:#0284c7;color:white;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:4px;">🗺️ View Location on OpenStreetMap</a></p>`
                : order.deliveryAddress
                ? `<p><strong>Delivery Address:</strong> ${order.deliveryAddress.addressLine1}, ${order.deliveryAddress.city}</p>`
                : ''
            }
            ${order.customerNote ? `<p><strong>Note:</strong> ${order.customerNote}</p>` : ''}
          </div>
          <p>Please log in to your dashboard to accept or reject this order.</p>
        </div>
        <div style="${footerStyle}">
          <p>Local Grocery Shop Management System</p>
        </div>
      </div>
    `;
    await sendEmail(shopEmail, `New Order #${order.orderNumber} Received`, html);
  },

  async sendLowStockAlertEmail(
    shopEmail: string,
    shopName: string,
    items: Array<{ name: string; currentStock: number; recommendedRestock: number }>
  ): Promise<void> {
    const itemsHtml = items
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #fee2e2;font-weight:600;">${i.name}</td>
            <td style="padding:8px;border-bottom:1px solid #fee2e2;text-align:center;color:#b91c1c;font-weight:bold;">${i.currentStock} units</td>
            <td style="padding:8px;border-bottom:1px solid #fee2e2;text-align:right;color:#0284c7;font-weight:bold;">+${i.recommendedRestock} units</td>
          </tr>`
      )
      .join('');

    const html = `
      <div style="${baseStyle}">
        <div style="background:linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;">⚠️ Low Stock Inventory Alert</h1>
          <p style="margin:4px 0 0;opacity:0.9;font-size:13px;">Automated 6-Hour Inventory Monitor</p>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${shopName},</h2>
          <p>Our autonomous inventory analysis detected <strong>${items.length} product(s)</strong> at critical or depleted stock levels.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#fef2f2;">
                <th style="padding:8px;text-align:left;color:#991b1b;">Product</th>
                <th style="padding:8px;text-align:center;color:#991b1b;">Current Stock</th>
                <th style="padding:8px;text-align:right;color:#991b1b;">Recommended Restock</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="font-size:12px;color:#64748b;">
            💡 <em>Note: Restocking recommendations are estimates based on recent customer purchasing velocity and upcoming weekend multipliers.</em>
          </p>
          <div style="margin-top:20px;text-align:center;">
            <a href="http://localhost:5173/shop/products" style="display:inline-block;padding:10px 20px;background:#0284c7;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">
              Manage Catalog & Update Stock
            </a>
          </div>
        </div>
        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} Local Grocery Automated Intelligence</p>
        </div>
      </div>
    `;
    await sendEmail(shopEmail, `⚠️ Low Stock Alert: ${items.length} items require replenishment — ${shopName}`, html);
  },

  async sendDailySalesSummaryEmail(
    shopEmail: string,
    shopName: string,
    summary: { totalOrders: number; totalRevenue: number; topProduct?: string }
  ): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin:0;font-size:22px;">📊 Daily Shop Performance Summary</h1>
          <p style="margin:4px 0 0;opacity:0.9;font-size:13px;">${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${shopName},</h2>
          <p>Here is your daily business recap:</p>
          <div style="display:flex;gap:12px;margin:16px 0;">
            <div style="flex:1;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:bold;">Total Orders</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#0f172a;">${summary.totalOrders}</p>
            </div>
            <div style="flex:1;background:#f0fdf4;padding:14px;border-radius:8px;border:1px solid #bbf7d0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#166534;text-transform:uppercase;font-weight:bold;">Total Revenue</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#15803d;">₹${summary.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          ${summary.topProduct ? `<p><strong>🌟 Top Selling Item Today:</strong> ${summary.topProduct}</p>` : ''}
          <p style="font-size:13px;color:#475569;">Keep your store information and product inventory up-to-date to maximize daily basket sizes.</p>
        </div>
        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} Local Grocery Automated Intelligence</p>
        </div>
      </div>
    `;
    await sendEmail(shopEmail, `📊 Daily Summary: ₹${summary.totalRevenue.toFixed(2)} (${summary.totalOrders} orders) — ${shopName}`, html);
  },

  async sendWeeklyBusinessReportEmail(
    shopEmail: string,
    shopName: string,
    report: { totalOrders: number; totalRevenue: number; completionRate: number }
  ): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        <div style="background:linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;">📈 Weekly Executive Business Digest</h1>
          <p style="margin:4px 0 0;opacity:0.9;font-size:13px;">7-Day Comprehensive Merchant Report</p>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${shopName},</h2>
          <p>Here is your weekly summary of customer orders and revenue:</p>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;">
            <p style="margin:4px 0;"><strong>7-Day Total Revenue:</strong> ₹${report.totalRevenue.toFixed(2)}</p>
            <p style="margin:4px 0;"><strong>7-Day Completed Orders:</strong> ${report.totalOrders}</p>
            <p style="margin:4px 0;"><strong>Order Fulfillment Rate:</strong> ${report.completionRate}%</p>
          </div>
          <p style="font-size:13px;color:#475569;">View full AI demand forecasts and stock optimization in your Shop Owner Portal.</p>
        </div>
        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} Local Grocery Automated Intelligence</p>
        </div>
      </div>
    `;
    await sendEmail(shopEmail, `📈 Weekly Report: ₹${report.totalRevenue.toFixed(2)} — ${shopName}`, html);
  },

  async sendTestNotificationEmail(
    recipient: string,
    shopName: string,
    details: {
      lowStockFreq: string;
      dailyTime: string;
      weeklyTime: string;
    }
  ): Promise<void> {
    const html = `
      <div style="${baseStyle}">
        <div style="background:linear-gradient(135deg, #0284c7 0%, #2563eb 100%);color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;">🔔 Notification Test Verified</h1>
          <p style="margin:4px 0 0;opacity:0.9;font-size:13px;">Local Grocery Automated Merchant Dispatcher</p>
        </div>
        <div style="${bodyStyle}">
          <h2>Hello ${shopName}! 👋</h2>
          <p>This is a test notification confirming that your shop owner alert system is successfully configured to receive messages at <strong>${recipient}</strong>.</p>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;">
            <p style="margin:4px 0;"><strong>⚠️ Low-Stock Alert Frequency:</strong> ${details.lowStockFreq}</p>
            <p style="margin:4px 0;"><strong>📊 Daily Sales Summary Time:</strong> ${details.dailyTime}</p>
            <p style="margin:4px 0;"><strong>📈 Weekly Business Digest Time:</strong> ${details.weeklyTime}</p>
          </div>
          <p style="font-size:13px;color:#475569;">You can conveniently modify dispatch hours, intervals, and email preferences anytime from your Shop Settings.</p>
        </div>
        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} Local Grocery Automated Intelligence</p>
        </div>
      </div>
    `;
    await sendEmail(recipient, `🔔 Notification Test: Alert system active for ${shopName}`, html);
  },
};
