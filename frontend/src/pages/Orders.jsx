import React, { useState, useEffect } from 'react';
import { ordersApi } from '../api/orders';
import { customersApi } from '../api/customers';
import { productsApi } from '../api/products';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import OrderDetailsModal from '../components/OrderDetailsModal';
import Modal from '../components/Modal';
import { Plus, Eye, XOctagon, ShoppingBag, Trash } from 'lucide-react';

function Orders() {
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'create'
  
  // Orders List State variables
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Detail Modal status
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Cancellation confirm status
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Creator form details
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]); // [{ product_id, name, price, quantity, max_stock }]
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const skip = (page - 1) * limit;
      const data = await ordersApi.getAll({
        status: statusFilter || undefined,
        skip,
        limit
      });
      setOrders(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(`Error loading orders: ${err}`);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const custData = await customersApi.getAll({ limit: 100 });
      setCustomers(custData.items);
      
      const prodData = await productsApi.getAll({ limit: 100 });
      setProducts(prodData.items);
    } catch (err) {
      toast.error(`Error loading selection options: ${err}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchOrders();
    } else {
      fetchFormOptions();
      setSelectedCustomerId('');
      setCart([]);
      setSelectedProductId('');
      setSelectedQuantity(1);
    }
  }, [activeTab, page, statusFilter]);

  const viewOrderDetails = async (orderId) => {
    try {
      const data = await ordersApi.getOne(orderId);
      setSelectedOrder(data);
      setIsDetailsOpen(true);
    } catch (err) {
      toast.error(`Error fetching order details: ${err}`);
    }
  };

  const openCancelModal = (e, order) => {
    e.stopPropagation();
    setOrderToCancel(order);
    setIsCancelOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!orderToCancel) return;
    try {
      await ordersApi.cancel(orderToCancel.id);
      toast.success("Order cancelled successfully. Stock restored to inventory.");
      setIsCancelOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err);
    }
  };

  const addToCart = () => {
    if (!selectedProductId) return toast.error("Validation Error: Please select a product.");
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (prod.quantity_in_stock <= 0) {
      return toast.error("Stock Conflict: This product is out of stock.");
    }
    if (selectedQuantity > prod.quantity_in_stock) {
      return toast.error(`Stock Conflict: Only ${prod.quantity_in_stock} units available.`);
    }

    const exists = cart.find(item => item.product_id === selectedProductId);
    if (exists) {
      return toast.error("Product already added. Remove or re-create line to update quantity.");
    }

    setCart(prev => [
      ...prev,
      {
        product_id: prod.id,
        name: prod.name,
        price: parseFloat(prod.price),
        quantity: parseInt(selectedQuantity, 10),
        max_stock: prod.quantity_in_stock
      }
    ]);

    setSelectedProductId('');
    setSelectedQuantity(1);
  };

  const removeFromCart = (pId) => {
    setCart(prev => prev.filter(item => item.product_id !== pId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      return toast.error("Validation Error: Please select a customer.");
    }
    if (cart.length === 0) {
      return toast.error("Validation Error: Cart must contain at least one product line.");
    }

    try {
      setPlacingOrder(true);
      const payload = {
        customer_id: selectedCustomerId,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      await ordersApi.create(payload);
      toast.success("Order confirmed successfully! Stock decremented.");
      setActiveTab('history');
      setPage(1);
    } catch (err) {
      toast.error(err);
    } finally {
      setPlacingOrder(false);
    }
  };

  const headers = ['Order ID', 'Customer Name', 'Total Amount', 'Status', 'Date', 'Actions'];
  const columns = [
    (row) => <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.id}</span>,
    (row) => row.customer ? row.customer.full_name : 'Unknown Customer',
    (row) => `$${parseFloat(row.total_amount).toFixed(2)}`,
    (row) => <StatusBadge status={row.status} />,
    (row) => new Date(row.created_at).toLocaleString(),
    (row) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => viewOrderDetails(row.id)} 
          title="View Details"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Eye size={15} />
        </button>
        {row.status !== 'CANCELLED' && (
          <button 
            onClick={(e) => openCancelModal(e, row)} 
            title="Cancel Order"
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
            <XOctagon size={15} />
          </button>
        )}
      </div>
    )
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Tab Selectors */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '1rem' }}>
        <button
          onClick={() => { setPage(1); setActiveTab('history'); }}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          Order History
        </button>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'create' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'create' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          Place New Order
        </button>
      </div>

      {activeTab === 'history' ? (
        /* History View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Filter by Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
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
              data={orders}
              columns={columns}
              loading={loadingOrders}
              total={total}
              page={page}
              limit={limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      ) : (
        /* Create Order Tab */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Cart Form Builder */}
          <div className="card" style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', margin: 0, fontWeight: 600 }}>Create New Order</h3>
            
            {/* Customer Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Customer profile selection</label>
              {customers.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--accent-danger)' }}>No active customers found. Please add a customer profile first.</p>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Choose Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Product Selector */}
            <div style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h4 style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                Select Product Line
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Product Name</label>
                {products.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No products in stock.</p>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Choose Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                        {p.name} - ${parseFloat(p.price).toFixed(2)} ({p.quantity_in_stock} left)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addToCart}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    height: '38px',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                >
                  Add Item
                </button>
              </div>
            </div>

          </div>

          {/* Cart View & Submit */}
          <div className="card" style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <ShoppingBag size={18} />
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', margin: 0, fontWeight: 600 }}>Draft Cart Items</h3>
            </div>

            {cart.length === 0 ? (
              <div style={{
                padding: '3.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '2px' }}>Your Cart is Empty</p>
                <p style={{ fontSize: '0.8125rem' }}>Add product lines from the selector panel.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {cart.map(item => (
                    <div key={item.product_id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255,255,255,0.01)'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {item.quantity} x ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
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
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Submit */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>ESTIMATED TOTAL</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                      ${cartTotal.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleCreateOrder}
                    disabled={placingOrder}
                    style={{
                      padding: '0.625rem 1.5rem',
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: placingOrder ? 'not-allowed' : 'pointer',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseOver={(e) => { if (!placingOrder) e.target.style.backgroundColor = 'var(--accent-primary-hover)' }}
                    onMouseOut={(e) => { if (!placingOrder) e.target.style.backgroundColor = 'var(--accent-primary)' }}
                  >
                    {placingOrder ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Reusable Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
      />

      {/* Cancellation Confirmation Modal */}
      <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Confirm Order Cancellation">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to cancel order <strong>{orderToCancel?.id}</strong>? 
            This action will mark the status as CANCELLED and return items back to product inventories.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => setIsCancelOpen(false)}
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
              onClick={handleCancelSubmit}
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
              Cancel Order
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default Orders;
