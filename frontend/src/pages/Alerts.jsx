import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Calendar, RefreshCw, Zap } from 'lucide-react';
import { alertsService } from '../services/alerts.service';
import toast from 'react-hot-toast';

function AlertCard({ alert, onDismiss }) {
  const typeColors = {
    'Low Stock': 'border-l-rose-500 bg-rose-50',
    'Reorder': 'border-l-amber-500 bg-amber-50',
    'Forecast': 'border-l-teal-500 bg-teal-50',
  };

  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${typeColors[alert.type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded">
              {alert.type}
            </span>
            {alert.status === 'new' && (
              <span className="text-xs font-medium text-white bg-emerald-600 px-2 py-1 rounded">
                NEW
              </span>
            )}
          </div>
          <p className="text-slate-900 font-medium mb-1">{alert.message}</p>
          <p className="text-sm text-slate-600">Item: {alert.itemName}</p>
          <p className="text-xs text-slate-500 mt-2">
            {new Date(alert.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col gap-2 ml-3">
          {alert.status === 'new' && (
            <button
              onClick={() => onDismiss(alert._id)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Dismiss"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  const [filter, setFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', filter, startDate, endDate],
    queryFn: () => alertsService.getAll(filter, startDate, endDate),
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => alertsService.dismiss(id),
    onSuccess: () => {
      toast.success('Alert dismissed', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
    },
    onError: () => toast.error('Failed to dismiss alert', { duration: 4000 }),
  });

  const forecastingMutation = useMutation({
    mutationFn: () => alertsService.triggerForecasting(),
    onSuccess: () => {
      toast.success('AI Forecasting job completed successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: () => toast.error('Failed to run forecasting job', { duration: 4000 }),
  });

  const reorderAlertsMutation = useMutation({
    mutationFn: () => alertsService.triggerReorderAlerts(),
    onSuccess: () => {
      toast.success('Reorder alerts job completed successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
    },
    onError: () => toast.error('Failed to run reorder alerts job', { duration: 4000 }),
  });

  const newCount = alerts.filter(a => a.status === 'new').length;

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-600 mt-1">
            {newCount} active alert{newCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => forecastingMutation.mutate()}
            disabled={forecastingMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forecastingMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Forecasting...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Run AI Forecasting</span>
              </>
            )}
          </button>
          <button
            onClick={() => reorderAlertsMutation.mutate()}
            disabled={reorderAlertsMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reorderAlertsMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Alerts...</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Run Alert Check</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { label: 'All', value: '' },
              { label: 'Active', value: 'new' },
              { label: 'Dismissed', value: 'dismissed' },
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
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-500">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert._id}
              alert={alert}
              onDismiss={(id) => {
                if (confirm('Are you sure you want to dismiss this alert?')) {
                  dismissMutation.mutate(id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
