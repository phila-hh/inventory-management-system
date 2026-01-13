import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import { ordersService } from '../services/orders.service';
import { alertsService } from '../services/alerts.service';
import { authService } from '../services/auth.service';

function StatCard({ title, value, icon: Icon, color, subtext }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function RecentActivityItem({ type, message, time }) {
  const colors = {
    inventory: 'bg-emerald-100 text-emerald-800',
    order: 'bg-amber-100 text-amber-800',
    alert: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
      <div className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>
        {type.toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-800">{message}</p>
        <p className="text-xs text-slate-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getUser();

  
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getAll(),
  });

  
  const { data: lowStock = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryService.getLowStock(),
  });

  
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersService.getAll(),
  });

  
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsService.getAll(),
  });

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const unreadAlerts = alerts.filter(a => a.status === 'new').length;

  return (
    <div className="p-6 space-y-6">
      {}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={inventory.length}
          icon={Package}
          color="bg-emerald-500"
          subtext="In inventory"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStock.length}
          icon={AlertTriangle}
          color="bg-rose-500"
          subtext="Need reorder"
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          icon={ShoppingCart}
          color="bg-amber-500"
          subtext="Active orders"
        />
        <StatCard
          title="Active Alerts"
          value={unreadAlerts}
          icon={TrendingUp}
          color="bg-teal-500"
          subtext="Unread alerts"
        />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Low Stock Items</h2>
          {lowStock.length === 0 ? (
            <p className="text-slate-500 text-center py-8">All items are well stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-600">{item.quantity}</p>
                    <p className="text-xs text-slate-500">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => (
              <RecentActivityItem
                key={order._id}
                type="order"
                message={`${order.type} order created with ${order.items.length} items`}
                time={new Date(order.createdAt).toLocaleString()}
              />
            ))}
            {alerts.slice(0, 2).map((alert) => (
              <RecentActivityItem
                key={alert._id}
                type="alert"
                message={alert.message}
                time={new Date(alert.createdAt).toLocaleString()}
              />
            ))}
            {orders.length === 0 && alerts.length === 0 && (
              <p className="text-slate-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/inventory')}
            className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            Add Item
          </button>
          <button 
            onClick={() => navigate('/orders')}
            className="px-4 py-3 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors font-medium"
          >
            Create Order
          </button>
          <button 
            onClick={() => navigate('/alerts')}
            className="px-4 py-3 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors font-medium"
          >
            View Alerts
          </button>
          <button 
            onClick={() => navigate('/categories')}
            className="px-4 py-3 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors font-medium"
          >
            Categories
          </button>
        </div>
      </div>
    </div>
  );
}
