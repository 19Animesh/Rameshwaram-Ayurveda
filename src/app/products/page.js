'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';

// ── Number of products to load per page ──
const PRODUCTS_PER_PAGE = 12;

function ProductsContent() {
  const searchParams = useSearchParams();

  // ── State for products and pagination ──
  const [products, setProducts] = useState([]);       // products for current page
  const [loading, setLoading] = useState(true);       // loading spinner
  const [currentPage, setCurrentPage] = useState(1);  // current page number
  const [totalProducts, setTotalProducts] = useState(0); // total matching products
  const [totalPages, setTotalPages] = useState(1);    // total number of pages

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // ── Dynamic DB filter lists ──
  const [dbCategories, setDbCategories] = useState([]);
  const [dbBrands, setDbBrands] = useState([]);

  // Fetch dynamic filters on mount
  useEffect(() => {
    fetch('/api/products/filters')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setDbCategories(data.data.categories || []);
          setDbBrands(data.data.brands || []);
        }
      })
      .catch(err => console.error("Failed to load DB filters", err));
  }, []);

  // ── Sync with URL search params ──
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  /**
   * fetchProducts - Fetches a specific page of products from the API
   * @param {number} page - Page number to fetch
   * @param {boolean} append - If true, append to existing products (Load More)
   */
  const fetchProducts = useCallback(async (page) => {
    // Build query string with all active filters
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedBrand) params.append('brand', selectedBrand);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (sort) params.append('sort', sort);

    // Add pagination params
    params.append('page', page);
    params.append('limit', PRODUCTS_PER_PAGE);

    setLoading(true);

    try {
      const res = await fetch(`/api/products?${params}`);
      const result = await res.json();
      const productData = result.data || {};
      setProducts(productData.products || []);
      setTotalProducts(productData.total || 0);
      setTotalPages(productData.totalPages || 1);
      setCurrentPage(productData.page || 1);
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedBrand, minPrice, maxPrice, sort]);

  // ── Fetch page 1 whenever any filter/sort changes ──
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // ── Go to a specific page ──
  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchProducts(page);
    // Scroll to top of products area
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  // ── Build page numbers array for pagination UI ──
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Show at most 5 page numbers
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    // Adjust start if we're near the end
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ── Reset all filters back to defaults ──
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSort('');
    setSearchQuery('');
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Home</a> <span>/</span> <span>Products</span>
            {selectedCategory && <><span>/</span> <span style={{ textTransform: 'capitalize' }}>{selectedCategory.replace('-', ' ')}</span></>}
          </div>
          <h1>
            {searchQuery ? `Search: "${searchQuery}"` : selectedCategory ? selectedCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Ayurvedic Medicines'}
          </h1>
        </div>
      </div>

      <div className="container">
        <div className="products-layout">
          {/* ── Filter Sidebar ── */}
          <aside className="filter-sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ fontSize: '16px', margin: 0, fontFamily: 'var(--font-heading)' }}>🔍 Filters</h3>
              <button onClick={clearFilters} className="btn btn-sm" style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                Clear All
              </button>
            </div>

            {/* Category filter */}
            <div className="filter-section">
              <h3>Category</h3>
              {dbCategories.length === 0 && <div style={{fontSize:'12px', color:'gray'}}>Loading categories...</div>}
              {dbCategories.map(cat => (
                <label key={cat.id} className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.id}
                    onChange={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>

            {/* Brand filter */}
            <div className="filter-section">
              <h3>Brand</h3>
              {dbBrands.length === 0 && <div style={{fontSize:'12px', color:'gray'}}>Loading brands...</div>}
              {dbBrands.map(brand => (
                <label key={brand} className="filter-option">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === brand}
                    onChange={() => setSelectedBrand(selectedBrand === brand ? '' : brand)}
                  />
                  {brand}
                </label>
              ))}
            </div>

            {/* Price range filter */}
            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </aside>

          {/* ── Products Grid ── */}
          <div>
            {/* Toolbar: product count + sort dropdown */}
            <div className="products-toolbar">
              <span className="result-count">
                {loading
                  ? 'Loading...'
                  : `Page ${currentPage} of ${totalPages} (${totalProducts} product${totalProducts !== 1 ? 's' : ''})`
                }
              </span>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="">Sort by: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Product cards or empty state */}
            {loading ? (
              <div className="products-grid">
                <ProductSkeleton count={12} />
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                {/* Product grid */}
                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* ── Numbered Page Navigation ── */}
                {totalPages > 1 && (
                  <div className="pagination">
                    {/* Previous button */}
                    <button
                      className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      « Prev
                    </button>

                    {/* First page + ellipsis if needed */}
                    {getPageNumbers()[0] > 1 && (
                      <>
                        <button className="pagination-btn" onClick={() => goToPage(1)}>1</button>
                        {getPageNumbers()[0] > 2 && <span className="pagination-dots">...</span>}
                      </>
                    )}

                    {/* Page number buttons */}
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Last page + ellipsis if needed */}
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                      <>
                        {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && <span className="pagination-dots">...</span>}
                        <button className="pagination-btn" onClick={() => goToPage(totalPages)}>{totalPages}</button>
                      </>
                    )}

                    {/* Next button */}
                    <button
                      className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next »
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="loading-spinner" style={{ marginTop: '100px' }}></div>}>
      <ProductsContent />
    </Suspense>
  );
}

