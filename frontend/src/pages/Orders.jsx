import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, TrendingUp, TrendingDown, X, Calendar } from 'lucide-react';
import { ordersService } from '../services/orders.service';
import { inventoryService } from '../services/inventory.service';
import { OrderTypes } from '../types/order.types';
import toast from 'react-hot-toast';

function OrderCard({ order }) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };

  const Icon = order.type === 'incoming' ? TrendingUp : TrendingDown;
  const iconColor = order.type === 'incoming' ? 'text-emerald-600' : 'text-rose-600';
  const typeLabel = order.type === 'incoming' ? 'Incoming' : 'Outgoing';

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-slate-100 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{typeLabel} Order</h3>
            <p className="text-sm text-slate-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-slate-100 text-slate-800'}`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-slate-700">{item.name}</span>
            <span className="text-slate-900 font-medium">
              {item.quantity} {item.unit}
            </span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-sm text-slate-600 p-2 bg-slate-50 rounded">
          {order.notes}
        </p>
      )}
    </div>
  );
}

function CreateOrderModal({ onClose }) {
  const [type, setType] = useState('incoming');
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => ordersService.create(data),
    onSuccess: () => {
      toast.success('Order created successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create order', { duration: 4000 }),
  });

  const handleAddItem = (item) => {
    if (selectedItems.find(i => i.itemId === item._id)) return;
    setSelectedItems([...selectedItems, { itemId: item._id, itemName: item.name, quantity: 1 }]);
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(i => i.itemId !== itemId));
  };

  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems(selectedItems.map(i =>
      i.itemId === itemId ? { ...i, quantity: Number(quantity) } : i
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item', { duration: 4000 });
      return;
    }
    createMutation.mutate({
      type,
      items: selectedItems.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
      notes,
    });
  };

  
  const typeLabels = {
    incoming: 'Incoming (Restock)',
    outgoing: 'Outgoing (Use)',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Order</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Order Type</label>
            <div className="flex gap-4">
              {Object.entries(OrderTypes).map(([key, orderType]) => (
                <label key={orderType} className="flex items-center">
                  <input
                    type="radio"
                    value={orderType}
                    checked={type === orderType}
                    onChange={(e) => setType(e.target.value)}
                    className="mr-2"
                  />
                  {typeLabels[orderType]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Items
            </label>
            <select
              onChange={(e) => {
                const item = inventory.find(i => i._id === e.target.value);
                if (item) handleAddItem(item);
                e.target.value = '';
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Choose an item...</option>
              {inventory.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (Stock: {item.quantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selected Items ({selectedItems.length})
            </label>
            {selectedItems.length === 0 ? (
              <p className="text-slate-500 text-sm">No items selected</p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.itemId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="flex-1 text-sm font-medium">{item.itemName}</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.itemId, e.target.value)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.itemId)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows="3"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-400"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Orders() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', filter, startDate, endDate],
    queryFn: () => ordersService.getAll(filter, undefined, startDate, endDate),
  });

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-600 mt-1">Manage incoming and outgoing orders</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Type Filter */}
          <div className="flex gap-2">
            {[
              { label: 'All', value: '' },
              { label: 'Incoming', value: 'incoming' },
              { label: 'Outgoing', value: 'outgoing' },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {}
          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={clearDateFilters}
                className="px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {}
      {isLoading ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-500">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}

      {showModal && <CreateOrderModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
