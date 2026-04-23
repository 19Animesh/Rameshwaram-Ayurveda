import { formatPrice } from '@/components/ProductCard';

export default function ProductsTable({ products, inlineStock, setInlineStock, savingStock, saveInlineStock, handleEdit, handleDelete }) {
  if (!products || products.length === 0) {
    return <p style={{ padding: '20px' }}>No products found.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock (edit inline)</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, background: '#f5f5f5', border: '1px solid #e0e0e0' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, background: '#f0f7f4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💊</div>
                )}
              </td>
              <td style={{ fontWeight: 600, maxWidth: 180 }}>{product.name}</td>
              <td style={{ fontSize: 13 }}>{product.brandName}</td>
              <td><span className="badge badge-green">{product.category}</span></td>
              <td style={{ fontWeight: 600 }}>{formatPrice(product.price)}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min="0"
                    value={inlineStock[product.id] ?? product.stock}
                    onChange={e => setInlineStock(prev => ({ ...prev, [product.id]: e.target.value }))}
                    style={{ width: 70, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, textAlign: 'center' }}
                  />
                  <button
                    onClick={() => saveInlineStock(product.id)}
                    disabled={savingStock === product.id}
                    style={{ padding: '4px 10px', background: '#1B4332', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    {savingStock === product.id ? '...' : 'Save'}
                  </button>
                </div>
              </td>
              <td>⭐ {product.rating}</td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(product)} title="Edit product">✏️ Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)} title="Delete product">🗑️ Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
