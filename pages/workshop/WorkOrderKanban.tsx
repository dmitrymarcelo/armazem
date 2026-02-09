import React, { useState, useMemo } from 'react';
import { WorkOrder, WorkOrderStatus, Mechanic, WORK_ORDER_STATUS_LABELS, WORK_ORDER_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from '../../types';
import { formatCurrency } from '../../utils/format';

interface WorkOrderKanbanProps {
  workOrders: WorkOrder[];
  mechanics: Mechanic[];
  onUpdateStatus: (orderId: string, newStatus: WorkOrderStatus) => void;
  onAssignMechanic: (orderId: string, mechanicId: string) => void;
  onCreateOrder: () => void;
  onViewOrder: (order: WorkOrder) => void;
}

type FilterType = 'all' | 'preventiva' | 'corretiva' | 'urgente';
type FilterPriority = 'all' | 'normal' | 'alta' | 'urgente';

const COLUMNS: WorkOrderStatus[] = ['aguardando', 'em_execucao', 'aguardando_pecas', 'finalizada'];

const STATUS_CONFIG: Record<WorkOrderStatus, { color: string; bgColor: string; borderColor: string }> = {
  aguardando: { color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-300' },
  em_execucao: { color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  aguardando_pecas: { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-300' },
  finalizada: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300' },
  cancelada: { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300' }
};

const TYPE_COLORS: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700',
  corretiva: 'bg-amber-100 text-amber-700',
  urgente: 'bg-red-100 text-red-700',
  revisao: 'bg-purple-100 text-purple-700',
  garantia: 'bg-emerald-100 text-emerald-700'
};

const PRIORITY_COLORS: Record<string, string> = {
  baixa: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-600',
  alta: 'bg-amber-100 text-amber-600',
  urgente: 'bg-red-100 text-red-600'
};

export const WorkOrderKanban: React.FC<WorkOrderKanbanProps> = ({
  workOrders,
  mechanics,
  onUpdateStatus,
  onAssignMechanic,
  onCreateOrder,
  onViewOrder
}) => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    return workOrders.filter(order => {
      if (filterType !== 'all' && order.type !== filterType) return false;
      if (filterPriority !== 'all' && order.priority !== filterPriority) return false;
      if (selectedMechanic !== 'all' && order.mechanicId !== selectedMechanic) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesPlate = order.vehiclePlate.toLowerCase().includes(term);
        const matchesModel = order.vehicleModel?.toLowerCase().includes(term) ?? false;
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesDescription = order.description.toLowerCase().includes(term);
        if (!matchesPlate && !matchesModel && !matchesId && !matchesDescription) return false;
      }
      return true;
    });
  }, [workOrders, filterType, filterPriority, selectedMechanic, searchTerm]);

  const ordersByColumn = useMemo(() => {
    return COLUMNS.reduce((acc, status) => {
      acc[status] = filteredOrders.filter(o => o.status === status);
      return acc;
    }, {} as Record<WorkOrderStatus, WorkOrder[]>);
  }, [filteredOrders]);

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: WorkOrderStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      onUpdateStatus(orderId, newStatus);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ordens de Serviço
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie manutenções preventivas e corretivas da frota
          </p>
        </div>
        <button
          onClick={onCreateOrder}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova OS
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por placa, modelo, OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">Todos os tipos</option>
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
              <option value="urgente">Urgente</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">Todas prioridades</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
            <select
              value={selectedMechanic}
              onChange={(e) => setSelectedMechanic(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="all">Todos mecânicos</option>
              {mechanics.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((status) => {
          const config = STATUS_CONFIG[status];
          const orders = ordersByColumn[status] || [];
          
          return (
            <div
              key={status}
              className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[calc(100vh-300px)]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className={`p-4 border-b ${config.borderColor} ${config.bgColor} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                    <h3 className={`font-semibold ${config.color}`}>
                      {WORK_ORDER_STATUS_LABELS[status]}
                    </h3>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-white dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                    {orders.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    onClick={() => onViewOrder(order)}
                    className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-900 dark:bg-slate-700 text-white">
                            {order.id}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${TYPE_COLORS[order.type]}`}>
                            {WORK_ORDER_TYPE_LABELS[order.type]}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {order.vehiclePlate}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {order.vehicleModel || 'Modelo não informado'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${PRIORITY_COLORS[order.priority]}`}>
                        {order.priority === 'urgente' ? 'Urgente' : order.priority === 'alta' ? 'Alta' : 'Normal'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                      {order.description}
                    </p>

                    {/* Services */}
                    {order.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {order.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                          >
                            {SERVICE_CATEGORY_LABELS[service.category]}
                          </span>
                        ))}
                        {order.services.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
                            +{order.services.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        {order.mechanicId ? (
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                              {order.mechanicName?.charAt(0) || 'M'}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                              {order.mechanicName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-500">Não atribuído</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {order.parts.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>{order.parts.filter(p => p.status === 'pendente').length} peças</span>
                          </div>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(order.openedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {status === 'em_execucao' && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ 
                              width: `${(order.services.filter(s => s.completed).length / order.services.length) * 100}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {order.services.filter(s => s.completed).length}/{order.services.length} serviços
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">Nenhuma OS nesta coluna</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
