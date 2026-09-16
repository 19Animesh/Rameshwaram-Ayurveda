import { formatPrice } from '@/components/ProductCard';

export default function OrdersTable({ orders, openOrderDetail, handleOrderStatus }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📦</span>
        <h3>No Orders Yet</h3>
        <p>Orders will appear here when customers place them.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>City</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Update Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id || order._id} style={{ cursor: 'pointer' }} onClick={() => openOrderDetail(order)}>
              <td style={{ fontWeight: 600, fontSize: 12 }}>{order.id?.slice(-8) || order._id?.toString().slice(-8)}</td>
              <td style={{ fontSize: 12 }}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </td>
              <td style={{ fontWeight: 500 }}>{order.address?.fullName || order.userId?.toString().slice(-8)}</td>
              <td style={{ fontSize: 12 }}>{order.address?.city || '—'}</td>
              <td>
                <div style={{ fontSize: 12 }}>
                  {order.items?.slice(0, 2).map((item, i) => (
                    <div key={i} style={{ whiteSpace: 'nowrap' }}>{item.name} × {item.quantity}</div>
                  ))}
                  {order.items?.length > 2 && <div style={{ color: 'var(--gray-500)' }}>+{order.items.length - 2} more</div>}
                </div>
              </td>
              <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>{formatPrice(order.total || order.totalAmount || 0)}</td>
              <td style={{ textTransform: 'uppercase', fontSize: 11 }}>
                <span className="badge badge-green">{order.paymentMethod}</span>
              </td>
              <td><span className={`order-status ${order.status}`}>{order.status}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <select
                  className="sort-select"
                  value={order.status}
                  onChange={e => handleOrderStatus(order.id || order._id, e.target.value)}
                  style={{ fontSize: 12, padding: '4px 8px' }}
                >
                  <option value="confirmed">✅ Confirmed</option>
                  <option value="processing">⚙️ Processing</option>
                  <option value="shipped">🚚 Shipped</option>
                  <option value="delivered">📬 Delivered</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </td>
              <td onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => openOrderDetail(order)}
                  style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                >
                  👁 View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
