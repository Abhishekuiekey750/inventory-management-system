import React, { useState, useEffect } from 'react';
import { productsApi } from '../api/products';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals status variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity_in_stock: '0' });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const data = await productsApi.getAll({
        query: search || undefined,
        lowStock: lowStock || undefined,
        skip,
        limit
      });
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(`Error loading products: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, lowStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: '', quantity_in_stock: '0' });
    setIsModalOpen(true);
  };

  const openEditModal = (e, prod) => {
    e.stopPropagation();
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      price: prod.price.toString(),
      quantity_in_stock: prod.quantity_in_stock.toString()
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price);
    const stockNum = parseInt(formData.quantity_in_stock, 10);

    // Schema level boundaries validation
    if (isNaN(priceNum) || priceNum <= 0) {
      return toast.error("Validation Error: Price must be a positive number.");
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return toast.error("Validation Error: Stock quantity cannot be negative.");
    }

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: priceNum,
        quantity_in_stock: stockNum
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        toast.success("Product updated successfully.");
      } else {
        await productsApi.create(payload);
        toast.success("Product created successfully.");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err);
    }
  };

  const openDeleteModal = (e, prod) => {
    e.stopPropagation();
    setProductToDelete(prod);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!productToDelete) return;
    try {
      await productsApi.delete(productToDelete.id);
      toast.success("Product deleted successfully.");
      setIsDeleteOpen(false);
      setPage(1);
      fetchProducts();
    } catch (err) {
      toast.error(err); // Prints the constraint conflict if linked to order items
    }
  };

  const headers = ['Name', 'SKU', 'Price', 'Stock Quantity', 'Actions'];
  const columns = [
    'name',
    'sku',
    (row) => `$${parseFloat(row.price).toFixed(2)}`,
    'quantity_in_stock',
    (row) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={(e) => openEditModal(e, row)} 
          title="Edit Product"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Edit2 size={15} />
        </button>
        <button 
          onClick={(e) => openDeleteModal(e, row)} 
          title="Delete Product"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-danger)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    )
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => {
                setPage(1);
                setLowStock(e.target.checked);
              }}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <span>Show Low Stock Only</span>
          </label>

          <button 
            onClick={openAddModal} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* DataTable */}
      <div className="card" style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <DataTable
          headers={headers}
          data={products}
          columns={columns}
          loading={loading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Add / Edit Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Product Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Wireless Mouse"
              style={{
                padding: '0.5rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>SKU (Unique)</label>
            <input
              type="text"
              name="sku"
              required
              value={formData.sku}
              onChange={handleFormChange}
              placeholder="e.g. TECH-MSE-001"
              style={{
                padding: '0.5rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Price ($)</label>
              <input
                type="number"
                name="price"
                required
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={handleFormChange}
                placeholder="0.00"
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Stock Quantity</label>
              <input
                type="number"
                name="quantity_in_stock"
                required
                min="0"
                value={formData.quantity_in_stock}
                onChange={handleFormChange}
                placeholder="0"
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation dialog Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to permanently delete product <strong>{productToDelete?.name}</strong>? 
            This action cannot be undone and will fail with conflict if the product has ordering history.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => setIsDeleteOpen(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubmit}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: 'var(--accent-danger)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              Delete Product
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default Products;
