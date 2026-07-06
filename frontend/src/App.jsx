import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import FeaturedProducts from "./components/FeaturedProducts";
import SidebarFilters from "./components/SidebarFilters";
import ProductToolbar from "./components/ProductToolbar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailModal from "./components/ProductDetailModal";
import CartDrawer from "./components/CartDrawer";
import AddProductModal from "./components/AddProductModal";
import EditProductModal from "./components/EditProductModal";
import DeleteProductModal from "./components/DeleteProductModal";
import LoadingGrid from "./components/LoadingGrid";
import Footer from "./components/Footer";
import {
  filterProducts,
  getDisplayPrice,
  sortProducts,
} from "./utils/productHelpers";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://sisimaecom.onrender.com";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) {
        throw new Error("Unable to load products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products.map((product) => product.category).filter(Boolean),
    );
    return Array.from(uniqueCategories);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      search,
      category: selectedCategory,
      inStockOnly,
      featuredOnly,
    });

    return sortProducts(filtered, sortBy);
  }, [products, search, selectedCategory, inStockOnly, featuredOnly, sortBy]);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.isFeatured).slice(0, 3),
    [products],
  );

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.displayPrice,
    0,
  );

  const handleAddToCart = (product) => {
    setCartItems((current) => {
      if (current.some((item) => item._id === product._id)) return current;

      return [
        ...current,
        {
          _id: product._id,
          name: product.name,
          image: product.image,
          displayPrice: getDisplayPrice(product),
        },
      ];
    });

    setCartOpen(true);
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((current) => current.filter((item) => item._id !== productId));
  };

  const handleAddProduct = async (productData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Failed to add product");
      }

      const newProduct = await response.json();
      setProducts((prev) => [...prev, newProduct]);
      setShowAddModal(false);
      alert("Product added successfully");
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    }
  };

  const handleEditProduct = async (id, productData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const updatedProduct = await response.json();
      setProducts((prev) =>
        prev.map((product) =>
          product._id === id ? updatedProduct : product,
        ),
      );
      setShowEditModal(false);
      alert("Product updated successfully");
    } catch (err) {
      console.error(err);
      alert("Error updating product");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts((prev) => prev.filter((product) => product._id !== id));
      setCartItems((current) => current.filter((item) => item._id !== id));
      setShowDeleteModal(false);
      alert("Product deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Error deleting product");
    }
  };

  return (
    <div className="app">
      <Header cartCount={cartItems.length} onCartClick={() => setCartOpen(true)} />
      <Hero />

      <main className="storefront">
        <section id="shop" className="storefront">
          <ProductToolbar
            search={search}
            onSearchChange={setSearch}
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultCount={filteredProducts.length}
          />

          {loading ? (
            <LoadingGrid />
          ) : error ? (
            <div className="error-banner">{error}</div>
          ) : (
            <div className="catalog">
              <SidebarFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                inStockOnly={inStockOnly}
                onInStockChange={setInStockOnly}
                featuredOnly={featuredOnly}
                onFeaturedChange={setFeaturedOnly}
                onAddClick={() => setShowAddModal(true)}
                onEditClick={() => {
                  if (products.length === 0) {
                    alert("No products available");
                    return;
                  }
                  setShowEditModal(true);
                }}
                onDeleteClick={() => {
                  if (products.length === 0) {
                    alert("No products available");
                    return;
                  }
                  setShowDeleteModal(true);
                }}
              />

              <ProductGrid
                products={filteredProducts}
                onView={setSelectedProduct}
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
              />
            </div>
          )}
        </section>

        <FeaturedProducts
          products={featuredProducts}
          onView={setSelectedProduct}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
        />
      </main>

      <Footer />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        inCart={cartItems.some((item) => item._id === selectedProduct?._id)}
      />
      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
      />
      <EditProductModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        products={products}
        onSave={handleEditProduct}
      />
      <DeleteProductModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        products={products}
        onDelete={handleDeleteProduct}
      />
      <CartDrawer
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onRemove={handleRemoveFromCart}
        total={cartTotal}
      />
    </div>
  );
}

