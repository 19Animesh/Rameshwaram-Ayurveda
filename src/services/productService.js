import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';


export async function getProducts({ page = 1, limit = 12, search, category, brand, minPrice, maxPrice, sort, featured, fetchAll = false } = {}) {
  await connectToDatabase();
  
  const where = {};
  
  if (featured === true) where.featured = true;
  if (category) {
    const searchCat = category.replace(/-/g, '.*');
    where.category = { $regex: new RegExp(`^${searchCat}$`, 'i') };
  }
  if (brand) where.brandName = { $regex: new RegExp(`^${brand}$`, 'i') };
  
  if (search) {
    where.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brandName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  if (minPrice || maxPrice) {
    where.price = {};
    const min = Number(minPrice);
    if (!isNaN(min)) where.price.$gte = min;
    const max = Number(maxPrice);
    if (!isNaN(max)) where.price.$lte = max;
    if (Object.keys(where.price).length === 0) delete where.price;
  }

  let sortObj = {};
  if (sort) {
    switch (sort) {
      case 'price-asc':  sortObj = { price: 1 }; break;
      case 'price-desc': sortObj = { price: -1 }; break;
      case 'rating':     sortObj = { rating: -1 }; break;
      case 'name':       sortObj = { name: 1 }; break;
      default:           sortObj = { createdAt: -1 }; break;
    }
  } else {
    sortObj = { createdAt: -1 };
  }

  const queryLimit = fetchAll ? 10000 : limit;

  try {
    console.log('productService.getProducts query:', { page, limit: queryLimit, search, category, brand, featured, fetchAll });
    
    const skipAmount = (page - 1) * queryLimit;
    
    const [total, products] = await Promise.all([
      Product.countDocuments(where),
      Product.find(where)
        .sort(sortObj)
        .skip(skipAmount)
        .limit(queryLimit)
        .lean()
    ]);

    // Convert _id to id for backwards compatibility with frontend Prisma models
    const mappedProducts = products.map(p => {
      const { _id, ...rest } = p;
      return { ...rest, id: _id.toString() };
    });

    console.log('productService.getProducts result:', { total, returned: mappedProducts.length });

    return {
      products: mappedProducts,
      total,
      page,
      limit: queryLimit,
      totalPages: Math.ceil(total / queryLimit),
    };
  } catch (err) {
    console.error('productService.getProducts FAILED:', err);
    throw err;
  }
}

export async function getProductById(id, includeVariants = false) {
  await connectToDatabase();
  const product = await Product.findById(id).lean();
  if (!product) return null;
  const { _id, ...rest } = product;
  return { ...rest, id: _id.toString() };
}

export async function createProduct(data) {
  await connectToDatabase();
  const res = await Product.create(data);
  const { _id, ...rest } = res.toObject();
  return { ...rest, id: _id.toString() };
}

export async function updateProduct(id, data) {
  await connectToDatabase();
  const res = await Product.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!res) return null;
  const { _id, ...rest } = res;
  return { ...rest, id: _id.toString() };
}

export async function deleteProduct(id) {
  await connectToDatabase();
  const res = await Product.findByIdAndDelete(id).lean();
  if (!res) return null;
  const { _id, ...rest } = res;
  return { ...rest, id: _id.toString() };
}
