import React, { useState } from 'react';
import { Vehicle, VehicleDetail, InventoryItem } from '../../types';

interface VehicleManagementProps {
  vehicles: Vehicle[];
  vehicleDetails: VehicleDetail[];
  inventory: InventoryItem[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onSyncFleetAPI?: (token: string) => void;
  onRequestParts: (vehiclePlate: string, items: { sku: string; name: string; qty: number }[]) => void;
  onImportVehicles?: (vehicles: Omit<Vehicle, 'id'>[]) => void;
}

export const VehicleManagement: React.FC<VehicleManagementProps> = ({
  vehicles,
  vehicleDetails,
  inventory,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSyncFleetAPI,
  onRequestParts,
  onImportVehicles
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'details'>('list');
  
  // Form states
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    model: '',
    type: 'caminhao',
    status: 'ativo',
    costCenter: ''
  });

  // Parts request states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestItems, setRequestItems] = useState<{ sku: string; name: string; qty: number }[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [requestQty, setRequestQty] = useState(1);

  // Bulk import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importPreview, setImportPreview] = useState<Vehicle[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setFormData(vehicle);
      setIsEditing(true);
      setSelectedVehicle(vehicle);
    } else {
      setFormData({
        plate: '',
        model: '',
        type: 'caminhao',
        status: 'ativo',
        costCenter: ''
      });
      setIsEditing(false);
      setSelectedVehicle(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedVehicle) {
      onUpdateVehicle({ ...selectedVehicle, ...formData } as Vehicle);
    } else {
      onAddVehicle(formData as Omit<Vehicle, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleOpenRequestModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setRequestItems([]);
    setIsRequestModalOpen(true);
  };

  const handleAddRequestItem = () => {
    if (selectedInventoryItem && requestQty > 0) {
      setRequestItems(prev => [...prev, {
        sku: selectedInventoryItem.sku,
        name: selectedInventoryItem.name,
        qty: requestQty
      }]);
      setSelectedInventoryItem(null);
      setRequestQty(1);
    }
  };

  const handleRemoveRequestItem = (index: number) => {
    setRequestItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = () => {
    if (selectedVehicle && requestItems.length > 0) {
      onRequestParts(selectedVehicle.plate, requestItems);
      setIsRequestModalOpen(false);
      setRequestItems([]);
    }
  };

  const handleSync = () => {
    const savedToken = localStorage.getItem('fleet_api_token') || '';
    const token = window.prompt('Informe o Token da Fleet API:', savedToken);
    if (token && onSyncFleetAPI) {
      localStorage.setItem('fleet_api_token', token);
      onSyncFleetAPI(token);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `PLACA,MODELO,TIPO,STATUS,CENTRO_CUSTO,ULTIMA_MANUTENCAO
BGM-1001,Volvo FH 540,Caminhão,Disponível,OPS-CD,15/01/2026
CHN-1002,Mercedes Actros,Carreta,Disponível,MAN-OFI,20/01/2026
DIO-1003,Volvo FH 460,Utilitário,Em Viagem,OPS-CD,10/01/2026
ELQ-1004,Scania R450,Caminhão,Manutenção,OPS-CD,25/01/2026`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_veiculos.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const parseImportData = (data: string) => {
    const lines = data.trim().split('\n');
    const errors: string[] = [];
    const parsed: Vehicle[] = [];

    // Skip header if first line contains PLACA or MODELO
    const startIndex = lines[0].toUpperCase().includes('PLACA') || lines[0].toUpperCase().includes('MODELO') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 5) {
        errors.push(`Linha ${i + 1}: dados incompletos`);
        continue;
      }

      const [plate, model, type, status, costCenter, lastMaintenance] = parts;

      if (!plate || !model) {
        errors.push(`Linha ${i + 1}: placa e modelo são obrigatórios`);
        continue;
      }

      // Validate plate format (simple validation)
      const plateRegex = /^[A-Z]{3}-\d{4}$/i;
      if (!plateRegex.test(plate) && !/^\d{4}[A-Z]{3}$/i.test(plate)) {
        errors.push(`Linha ${i + 1}: formato de placa inválido "${plate}"`);
        continue;
      }

      parsed.push({
        plate: plate.toUpperCase(),
        model,
        type: type || 'Caminhão',
        status: status || 'Disponível',
        costCenter: costCenter || 'OPS-CD',
        lastMaintenance: lastMaintenance || new Date().toLocaleDateString('pt-BR')
      });
    }

    setImportPreview(parsed);
    setImportErrors(errors);
    return parsed;
  };

  const handleProcessImport = () => {
    if (importPreview.length === 0) return;

    if (onImportVehicles) {
      onImportVehicles(importPreview);
    } else {
      // Fallback: add vehicles one by one
      importPreview.forEach(vehicle => onAddVehicle(vehicle));
    }

    setIsImportModalOpen(false);
    setImportData('');
    setImportPreview([]);
    setImportErrors([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
      parseImportData(content);
    };
    reader.readAsText(file);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'manutencao': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'inativo': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Frota</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Cadastre veículos e solicite peças diretamente do armazém
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importar
          </button>
          {onSyncFleetAPI && (
            <button
              onClick={handleSync}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar API
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Veículo
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por placa, modelo ou tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const detail = vehicleDetails.find(v => v.plate === vehicle.plate);
          return (
            <div
              key={vehicle.plate}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{vehicle.plate}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{vehicle.model}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Tipo:</span>
                  <span className="text-slate-700 dark:text-slate-300 capitalize">{vehicle.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Centro de Custo:</span>
                  <span className="text-slate-700 dark:text-slate-300">{vehicle.costCenter || '-'}</span>
                </div>
                {detail && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Próx. Manutenção:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {detail.nextServiceDate || (detail.nextServiceKm ? `${detail.nextServiceKm.toLocaleString()} km` : 'N/A')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleOpenModal(vehicle)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleOpenRequestModal(vehicle)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Solicitar Peças
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Nenhum veículo encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {searchTerm ? 'Tente ajustar sua busca ou ' : ''}
            cadastre um novo veículo para começar.
          </p>
        </div>
      )}

      {/* Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC-1234"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mercedes-Benz Actros"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Vehicle['type'] })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="caminhao">Caminhão</option>
                    <option value="van">Van</option>
                    <option value="carro">Carro</option>
                    <option value="onibus">Ônibus</option>
                    <option value="trator">Trator</option>
                    <option value="empilhadeira">Empilhadeira</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Vehicle['status'] })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="manutencao">Em Manutenção</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Centro de Custo
                </label>
                <input
                  type="text"
                  value={formData.costCenter}
                  onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: TRANSPORTE-001"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parts Request Modal */}
      {isRequestModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Solicitar Peças - {selectedVehicle.plate}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Selecione os itens do armazém para solicitar para este veículo
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Add Item Section */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Item do Armazém
                    </label>
                    <select
                      value={selectedInventoryItem?.sku || ''}
                      onChange={(e) => {
                        const item = inventory.find(i => i.sku === e.target.value);
                        setSelectedInventoryItem(item || null);
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um item...</option>
                      {inventory.map(item => (
                        <option key={item.sku} value={item.sku}>
                          {item.sku} - {item.name} (Disp: {item.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Quantidade
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={requestQty}
                        onChange={(e) => setRequestQty(parseInt(e.target.value) || 1)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddRequestItem}
                        disabled={!selectedInventoryItem}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Items List */}
              {requestItems.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Itens a solicitar ({requestItems.length}):
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">SKU</th>
                          <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Descrição</th>
                          <th className="px-4 py-2 text-center text-slate-700 dark:text-slate-300">Qtd</th>
                          <th className="px-4 py-2 text-center text-slate-700 dark:text-slate-300">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {requestItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-slate-900 dark:text-white font-mono">{item.sku}</td>
                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.name}</td>
                            <td className="px-4 py-2 text-center text-slate-900 dark:text-white font-semibold">{item.qty}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleRemoveRequestItem(index)}
                                className="text-red-500 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <p className="text-slate-500 dark:text-slate-400">
                    Nenhum item adicionado. Selecione itens do armazém acima.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={requestItems.length === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Enviar Solicitação SA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Importar Veículos em Massa
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Faça upload de um arquivo CSV ou cole os dados diretamente
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Template Download */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Baixe o template de importação
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Formato: PLACA, MODELO, TIPO, STATUS, CENTRO_CUSTO, ULTIMA_MANUTENCAO
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Template CSV
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Arquivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Manual Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ou cole os dados diretamente (CSV)
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => {
                    setImportData(e.target.value);
                    parseImportData(e.target.value);
                  }}
                  placeholder="PLACA,MODELO,TIPO,STATUS,CENTRO_CUSTO,ULTIMA_MANUTENCAO&#10;BGM-1001,Volvo FH 540,Caminhão,Disponível,OPS-CD,15/01/2026"
                  rows={6}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Pré-visualização ({importPreview.length} veículos):
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-700 dark:text-slate-300">Placa</th>
                          <th className="px-3 py-2 text-left text-slate-700 dark:text-slate-300">Modelo</th>
                          <th className="px-3 py-2 text-left text-slate-700 dark:text-slate-300">Tipo</th>
                          <th className="px-3 py-2 text-left text-slate-700 dark:text-slate-300">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {importPreview.slice(0, 10).map((vehicle, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-slate-900 dark:text-white font-mono">{vehicle.plate}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{vehicle.model}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{vehicle.type}</td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{vehicle.status}</td>
                          </tr>
                        ))}
                        {importPreview.length > 10 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-center text-slate-500 dark:text-slate-400 italic">
                              ... e mais {importPreview.length - 10} veículos
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                  <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                    Erros encontrados ({importErrors.length}):
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                    {importErrors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportData('');
                    setImportPreview([]);
                    setImportErrors([]);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={importPreview.length === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Importar {importPreview.length > 0 && `(${importPreview.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
