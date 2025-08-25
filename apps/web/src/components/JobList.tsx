'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Job {
  id: string;
  type: 'COLLECT_MEMBERS' | 'SYNC_DIALOGS' | 'SYNC_CONTACTS' | 'EXPORT_DATA';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payload: any;
  result?: any;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  dialog?: {
    title: string;
  };
  session?: {
    label: string;
  };
}

export function JobList() {
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['telegram-jobs'],
    queryFn: () => api.get('/telegram/jobs').then(res => res.data),
  });

  const getTypeText = (type: string) => {
    switch (type) {
      case 'COLLECT_MEMBERS':
        return 'Coleta de Membros';
      case 'SYNC_DIALOGS':
        return 'Sincronização de Diálogos';
      case 'SYNC_CONTACTS':
        return 'Sincronização de Contatos';
      case 'EXPORT_DATA':
        return 'Exportação de Dados';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'RUNNING':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'RUNNING':
        return 'Executando';
      case 'COMPLETED':
        return 'Concluído';
      case 'FAILED':
        return 'Falhou';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { jobs } = jobsData || { jobs: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Jobs e Tarefas</h2>
        <p className="text-gray-600 mt-1">
          Acompanhe o progresso das operações em andamento
        </p>
      </div>

      {/* Jobs List */}
      {jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job: Job) => (
            <div
              key={job.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(job.status)}
                    <h3 className="font-medium text-gray-900">
                      {getTypeText(job.type)}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {job.dialog && (
                      <p><strong>Diálogo:</strong> {job.dialog.title}</p>
                    )}
                    {job.session && (
                      <p><strong>Sessão:</strong> {job.session.label}</p>
                    )}
                    {job.result && (
                      <p><strong>Resultado:</strong> {JSON.stringify(job.result)}</p>
                    )}
                    {job.error && (
                      <p className="text-red-600"><strong>Erro:</strong> {job.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                    <span>Criado: {new Date(job.createdAt).toLocaleString('pt-BR')}</span>
                    {job.startedAt && (
                      <span>Iniciado: {new Date(job.startedAt).toLocaleString('pt-BR')}</span>
                    )}
                    {job.finishedAt && (
                      <span>Finalizado: {new Date(job.finishedAt).toLocaleString('pt-BR')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum job encontrado
          </h3>
          <p className="text-gray-600">
            Os jobs aparecerão aqui quando você executar operações
          </p>
        </div>
      )}
    </div>
  );
}
