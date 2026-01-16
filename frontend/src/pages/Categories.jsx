import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { categoriesService } from '../services/categories.service';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 9;


export default function Categories() {
  const queryClient = useQueryClient();
  
  
  const { user, isAdmin } = useAuth();
  const userIsAdmin = isAdmin();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦',
    isActive: true,
  });

  // Fetch categories
  const { data: allCategories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });

  
  const totalPages = Math.ceil(allCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allCategories, currentPage]);

  
  const createMutation = useMutation({
    mutationFn: (data) => categoriesService.create(data),
    onSuccess: () => {
      toast.success('Category created successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create category', { duration: 4000 });
    },
  });

  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoriesService.update(id, data),
    onSuccess: () => {
      toast.success('Category updated successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category', { duration: 4000 });
    },
  });

  
  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesService.delete(id),
    onSuccess: () => {
      toast.success('Category deleted successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category', { duration: 4000 });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📦',
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📦',
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  // Common emoji icons
  const commonIcons = ['📦', '🔧', '🛠️', '📋', '🏭', '⚙️', '🔩', '📊', '💼', '🚀', '🎯', '📁', '🗂️', '🏷️', '📌'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FolderOpen className="w-12 h-12 text-slate-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-600 mt-1">Manage your inventory categories</p>
        </div>
        {userIsAdmin && (
          <button
            onClick={handleAdd}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        )}
      </div>

      {/* Categories Grid */}
      {allCategories && allCategories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCategories.map((category) => (
              <div
                key={category._id}
                className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow ${
                  !category.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{category.icon || '📦'}</span>
                    <div>
                      <h3 className="font-bold text-lg">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-slate-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      category.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {userIsAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-emerald-600 hover:bg-emerald-50 p-2 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="text-rose-600 hover:bg-rose-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, allCategories.length)} of {allCategories.length} categories
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
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">No categories yet</p>
          <p className="text-slate-400 text-sm">Click "Add Category" to create your first one</p>
        </div>
      )}

      {}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Electronics"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Icon (Emoji)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-2xl"
                    maxLength={2}
                  />
                  <span className="text-sm text-slate-500 flex items-center">Quick pick:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className="text-2xl hover:bg-slate-100 p-2 rounded transition-colors"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
