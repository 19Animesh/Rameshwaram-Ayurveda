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
  // Distinguishes "the request failed" from "the query returned nothing".
  // Previously both produced an empty grid, so an API outage looked
  // identical to a search with no matches.
  const [error, setError] = useState(null);

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Phones and tablets show the filter panel collapsed (see globals.css);
  // on desktop it is always open and this state has no visible effect.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (selectedBrand ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

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

    setError(null);

    try {
      const res = await fetch(`/api/products?${params}`);

      // A non-2xx response still has a body, but it is an error envelope.
      // Parsing it as success data is what produced a silent blank page.
      let result = null;
      try {
        result = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status} (${res.statusText || 'error'})`);
      }

      if (!res.ok || result?.success === false) {
        throw new Error(result?.error || `Request failed with status ${res.status}`);
      }

      const productData = result.data || {};
      setProducts(productData.products || []);
      setTotalProducts(productData.total || 0);
      setTotalPages(productData.totalPages || 1);
      setCurrentPage(productData.page || 1);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setError(err.message || 'Could not load products.');
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
          <aside className={`filter-sidebar${filtersOpen ? ' is-open' : ''}`}>
            <div className="filter-sidebar-head">
              <button
                type="button"
                className="filter-toggle"
                onClick={() => setFiltersOpen(open => !open)}
                aria-expanded={filtersOpen}
                aria-controls="filter-sidebar-body"
              >
                <span>🔍 Filters</span>
                {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
                <span className="filter-toggle-icon" aria-hidden="true">▼</span>
              </button>
              <button onClick={clearFilters} className="btn btn-sm" style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                Clear All
              </button>
            </div>

            <div className="filter-sidebar-body" id="filter-sidebar-body">

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
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Product cards or empty state */}
            {loading ? (
              <div className="products-grid">
                <ProductSkeleton count={12} />
              </div>
            ) : error ? (
              <div className="empty-state">
                <span className="empty-icon">⚠️</span>
                <h3>Couldn&apos;t load products</h3>
                <p>{error}</p>
                <button onClick={() => fetchProducts(currentPage)} className="btn btn-primary">
                  Try Again
                </button>
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

