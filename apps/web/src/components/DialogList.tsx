'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Users, Hash, RefreshCw, Download } from 'lucide-react';
import { api } from '@/lib/api';

interface Dialog {
  id: string;
  telegramId: number;
  type: 'PRIVATE' | 'GROUP' | 'CHANNEL' | 'SUPERGROUP';
  title: string;
  username?: string;
  memberCount?: number;
  lastSyncAt: string;
}

interface DialogListProps {
  sessionId: string | null;
  onDialogSelect: (dialogId: string | null) => void;
  selectedDialog: string | null;
}

export function DialogList({ sessionId, onDialogSelect, selectedDialog }: DialogListProps) {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: dialogs, isLoading } = useQuery({
    queryKey: ['telegram-dialogs', sessionId],
    queryFn: () => api.get(`/telegram/sessions/${sessionId}/dialogs`).then(res => res.data),
    enabled: !!sessionId,
  });

  const syncDialogsMutation = useMutation({
    mutationFn: () => api.post(`/telegram/sessions/${sessionId}/sync-dialogs`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-dialogs', sessionId] });
      setRefreshing(false);
    },
    onError: () => {
      setRefreshing(false);
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PRIVATE':
        return <MessageCircle className="w-4 h-4" />;
      case 'GROUP':
      case 'SUPERGROUP':
        return <Users className="w-4 h-4" />;
      case 'CHANNEL':
        return <Hash className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'PRIVATE':
        return 'Chat Privado';
      case 'GROUP':
        return 'Grupo';
      case 'SUPERGROUP':
        return 'Super Grupo';
      case 'CHANNEL':
        return 'Canal';
      default:
        return 'Desconhecido';
    }
  };

  const handleSyncDialogs = () => {
    setRefreshing(true);
    syncDialogsMutation.mutate();
  };

  if (!sessionId) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Selecione uma Sessão
        </h3>
        <p className="text-gray-600">
          Escolha uma sessão do Telegram para visualizar os diálogos
        </p>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900">Diálogos do Telegram</h2>
          <p className="text-gray-600 mt-1">
            Grupos, canais e chats privados da sessão selecionada
          </p>
        </div>
        <button
          onClick={handleSyncDialogs}
          disabled={refreshing}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
      </div>

      {/* Dialogs List */}
      {dialogs && dialogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dialogs.map((dialog: Dialog) => (
            <div
              key={dialog.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedDialog === dialog.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onDialogSelect(dialog.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(dialog.type)}
                  <span className="text-sm font-medium text-gray-700">
                    {getTypeText(dialog.type)}
                  </span>
                </div>
                {dialog.memberCount && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {dialog.memberCount} membros
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{dialog.title}</h3>
              
              {dialog.username && (
                <p className="text-sm text-gray-600 mb-3">
                  @{dialog.username}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Última sincronização: {new Date(dialog.lastSyncAt).toLocaleDateString('pt-BR')}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Iniciar coleta de membros
                  }}
                  className="text-blue-500 hover:text-blue-700 p-1"
                  title="Coletar membros"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum diálogo encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Clique em "Sincronizar" para buscar diálogos do Telegram
          </p>
          <button
            onClick={handleSyncDialogs}
            disabled={refreshing}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {refreshing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        </div>
      )}
    </div>
  );
}
