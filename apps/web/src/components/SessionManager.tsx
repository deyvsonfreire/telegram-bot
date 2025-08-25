'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Play, Pause, Bot, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { CreateSessionForm } from './CreateSessionForm';

interface Session {
  id: string;
  type: 'BOT' | 'USER';
  label: string;
  phoneNumber?: string;
  status: 'PENDING' | 'ACTIVE' | 'ERROR' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export function SessionManager({ 
  onSessionSelect, 
  selectedSession 
}: { 
  onSessionSelect: (sessionId: string | null) => void;
  selectedSession: string | null;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['telegram-sessions'],
    queryFn: () => api.get('/telegram/sessions').then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/telegram/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-sessions'] });
      if (selectedSession === sessionId) {
        onSessionSelect(null);
      }
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'EXPIRED':
        return <XCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'ERROR':
        return 'Erro';
      case 'EXPIRED':
        return 'Expirado';
      default:
        return 'Pendente';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'BOT' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getTypeText = (type: string) => {
    return type === 'BOT' ? 'Bot' : 'Usuário';
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
          <h2 className="text-2xl font-bold text-gray-900">Sessões do Telegram</h2>
          <p className="text-gray-600 mt-1">
            Gerencie suas sessões para acessar contatos, grupos e canais
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Sessão</span>
        </button>
      </div>

      {/* Sessions List */}
      {sessions && sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session: Session) => (
            <div
              key={session.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedSession === session.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(session.type)}
                  <span className="text-sm font-medium text-gray-700">
                    {getTypeText(session.type)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(session.status)}
                  <span className="text-xs text-gray-500">
                    {getStatusText(session.status)}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{session.label}</h3>
              
              {session.phoneNumber && (
                <p className="text-sm text-gray-600 mb-3">
                  📱 {session.phoneNumber}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Criado em {new Date(session.createdAt).toLocaleDateString('pt-BR')}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
                      deleteMutation.mutate(session.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Excluir sessão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma sessão criada
          </h3>
          <p className="text-gray-600 mb-4">
            Crie sua primeira sessão para começar a gerenciar o Telegram
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Criar Primeira Sessão
          </button>
        </div>
      )}

      {/* Create Session Modal */}
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
