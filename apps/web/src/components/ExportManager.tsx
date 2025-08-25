'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Calendar, Filter, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Export {
  id: string;
  name: string;
  description?: string;
  filters: any;
  fileUrl?: string;
  fileSize?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  expiresAt?: string;
  createdAt: string;
}

export function ExportManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: exports, isLoading } = useQuery({
    queryKey: ['telegram-exports'],
    queryFn: () => api.get('/telegram/exports').then(res => res.data),
  });

  const deleteExportMutation = useMutation({
    mutationFn: (exportId: string) => api.delete(`/telegram/exports/${exportId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-exports'] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Calendar className="w-4 h-4 text-yellow-500" />;
      case 'PROCESSING':
        return <Download className="w-4 h-4 text-blue-500" />;
      case 'COMPLETED':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'EXPIRED':
        return <Calendar className="w-4 h-4 text-gray-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'PROCESSING':
        return 'Processando';
      case 'COMPLETED':
        return 'Concluído';
      case 'FAILED':
        return 'Falhou';
      case 'EXPIRED':
        return 'Expirado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exportações</h2>
          <p className="text-gray-600 mt-1">
            Gerencie suas exportações de dados do Telegram
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Nova Exportação</span>
        </button>
      </div>

      {/* Exports List */}
      {exports && exports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exports.map((exportItem: Export) => (
            <div
              key={exportItem.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(exportItem.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exportItem.status)}`}>
                    {getStatusText(exportItem.status)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta exportação?')) {
                      deleteExportMutation.mutate(exportItem.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Excluir exportação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{exportItem.name}</h3>
              
              {exportItem.description && (
                <p className="text-sm text-gray-600 mb-3">{exportItem.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                {exportItem.fileSize && (
                  <p><strong>Tamanho:</strong> {formatFileSize(exportItem.fileSize)}</p>
                )}
                
                {exportItem.expiresAt && (
                  <p><strong>Expira em:</strong> {new Date(exportItem.expiresAt).toLocaleDateString('pt-BR')}</p>
                )}
                
                <p><strong>Criado em:</strong> {new Date(exportItem.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>

              {exportItem.status === 'COMPLETED' && exportItem.fileUrl && (
                <div className="mt-4">
                  <a
                    href={exportItem.fileUrl}
                    download
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Arquivo</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma exportação criada
          </h3>
          <p className="text-gray-600 mb-4">
            Crie sua primeira exportação para baixar dados do Telegram
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Criar Primeira Exportação
          </button>
        </div>
      )}

      {/* Create Export Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nova Exportação</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Exportação
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Membros do Grupo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o conteúdo da exportação"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Criar Exportação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
