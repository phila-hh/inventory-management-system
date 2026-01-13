import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import { categoriesService } from '../services/categories.service';
import { useAuth } from '../contexts/AuthContext';
import { ItemUnits } from '../types/inventory.types';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 9;

function InventoryCard({ item, onEdit, onDelete, isAdmin }) {
  const isLowStock = item.quantity <= item.reorderThreshold;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
          <p className="text-sm text-slate-600 mt-1">{item.description || 'No description'}</p>
        </div>
        {isLowStock && (
          <span className="bg-rose-500 text-white px-2 py-1 rounded text-xs font-medium">
            Low Stock
          </span>
        )}
      </div>

      <div className="flex items-center justify-between py-3 border-t border-b border-slate-200">
        <div>
          <span className="text-3xl font-bold text-slate-900">{item.quantity}</span>
          <span className="text-slate-500 ml-2">{item.unit}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Category</p>
          <p className="text-sm font-medium text-slate-700">{item.category}</p>
        </div>
      </div>

      {item.forecast && item.forecast.predictedUsage > 0 && (
        <div className="mt-3 p-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-100">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-teal-600" />
            <p className="text-xs text-teal-800 font-medium">
              AI Forecast: {item.forecast.predictedUsage} {item.unit}
            </p>
          </div>
          {item.forecast.forecastDate && (
            <p className="text-xs text-slate-600 mt-1">
              {new Date(item.forecast.forecastDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className="flex-1 bg-rose-50 text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}


function CategorySelect({ value, onChange }) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', true],
    queryFn: () => categoriesService.getAll(true), 
  });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
      required
    >
      <option value="">Select Category</option>
      {categories.map((cat) => (
        <option key={cat._id} value={cat.name}>
          {cat.icon} {cat.name}
        </option>
      ))}
    </select>
  );
}

// Category Select for Filter (with "All" option)
function CategoryFilterSelect({ value, onChange }) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', true],
    queryFn: () => categoriesService.getAll(true),
  });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat._id} value={cat.name}>
          {cat.icon} {cat.name}
        </option>
      ))}
    </select>
  );
}

function InventoryModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState(item || {
    name: '',
    description: '',
    category: '',
    quantity: 0,
    unit: 'pcs',
    reorderThreshold: 10,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {item ? 'Edit Item' : 'Add New Item'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <CategorySelect 
                value={formData.category} 
                onChange={(value) => setFormData({ ...formData, category: value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {Object.values(ItemUnits).map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Threshold</label>
              <input
                type="number"
                value={formData.reorderThreshold}
                onChange={(e) => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
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
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  
  // Check if user is admin
  const { user, isAdmin } = useAuth();
  const userIsAdmin = isAdmin();

  // Fetch inventory
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['inventory', category, search],
    queryFn: () => inventoryService.getAll(category, search),
  });

  
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allItems, currentPage]);

  
  const handleCategoryChange = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  
  const createMutation = useMutation({
    mutationFn: (data) => inventoryService.create(data),
    onSuccess: () => {
      toast.success('Item created successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowModal(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create item', { duration: 4000 }),
  });

  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryService.update(id, data),
    onSuccess: () => {
      toast.success('Item updated successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowModal(false);
      setEditingItem(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update item', { duration: 4000 }),
  });

  
  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryService.delete(id),
    onSuccess: () => {
      toast.success('Item deleted successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete item', { duration: 4000 }),
  });

  const handleSave = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-600 mt-1">Manage your inventory items</p>
        </div>
        {userIsAdmin && (
          <button
            onClick={handleAdd}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </button>
        )}
      </div>

      {}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <CategoryFilterSelect value={category} onChange={handleCategoryChange} />
        </div>
      </div>

      {}
      {isLoading ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-500">Loading items...</p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No items found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map((item) => (
              <InventoryCard
                key={item._id}
                item={item}
                isAdmin={userIsAdmin}
                onEdit={handleEdit}
                onDelete={(id) => {
                  if (confirm('Are you sure you want to delete this item?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>

          {}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, allItems.length)} of {allItems.length} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {}
      {showModal && (
        <InventoryModal
          item={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
