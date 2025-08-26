'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Bot, User, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CreateSessionForm } from './CreateSessionForm';

interface Session {
  id: string;
  type: 'BOT' | 'USER';
  label: string;
  phoneNumber?: string;
  status: 'PENDING' | 'ACTIVE' | 'ERROR' | 'EXPIRED';
  createdAt: string;
}

export function SessionManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions, isLoading, error } = useQuery<Session[]>({
    queryKey: ['telegram-sessions'],
    queryFn: () => api.get('/telegram/sessions').then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/telegram/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-sessions'] });
    },
  });

  const getStatusIcon = (status: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      ACTIVE: <CheckCircle className="w-4 h-4 text-green-500" />,
      ERROR: <XCircle className="w-4 h-4 text-red-500" />,
      EXPIRED: <XCircle className="w-4 h-4 text-orange-500" />,
      PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
    };
    return iconMap[status] || iconMap['PENDING'];
  };

  const getStatusText = (status: string) => {
    const textMap: { [key: string]: string } = {
      ACTIVE: 'Ativo',
      ERROR: 'Erro',
      EXPIRED: 'Expirado',
      PENDING: 'Pendente',
    };
    return textMap[status] || 'Pendente';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sessões do Telegram</h2>
          <p className="text-gray-600 mt-1">Gerencie suas sessões para interagir com a API.</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nova Sessão</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">Ocorreu um erro ao carregar as sessões.</div>
      ) : sessions && sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4 transition-all hover:shadow-md bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {session.type === 'BOT' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span className="text-sm font-medium text-gray-700">{session.type === 'BOT' ? 'Bot' : 'Usuário'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(session.status)}
                  <span className="text-xs text-gray-500">{getStatusText(session.status)}</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 truncate">{session.label}</h3>
              {session.phoneNumber && <p className="text-sm text-gray-600 mb-3">📱 {session.phoneNumber}</p>}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <span>Criado em {new Date(session.createdAt).toLocaleDateString('pt-BR')}</span>
                <button onClick={() => confirm('Tem certeza?') && deleteMutation.mutate(session.id)} className="text-red-500 hover:text-red-700 p-1" title="Excluir sessão">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sessão criada</h3>
          <p className="text-gray-600 mb-4">Crie sua primeira sessão para começar.</p>
          <button onClick={() => setShowCreateForm(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Criar Primeira Sessão</button>
        </div>
      )}

      {showCreateForm && (
        <CreateSessionForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ['telegram-sessions'] });
          }}
        />
      )}
    </div>
  );
}
