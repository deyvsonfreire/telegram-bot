'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BookUser, Users, VenetianMask, Loader2, ShieldCheck, ShieldOff, Plus } from 'lucide-react';
import { CreateGroupForm } from './CreateGroupForm';

interface Session {
  id: string;
  label: string;
  status: string;
}

interface Dialog {
  id: number;
  title: string;
  isChannel: boolean;
  isSupergroup: boolean;
  isVerified: boolean;
  isScam: boolean;
  memberCount: number;
}

export function DialogList() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);


  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['telegram-sessions'],
    queryFn: () => api.get('/telegram/sessions').then(res => res.data),
    // Only fetch active sessions for dialog listing
    select: (data) => data.filter(s => s.status === 'ACTIVE'),
  });

  const { data: dialogs, isLoading: isLoadingDialogs, error: dialogsError } = useQuery<Dialog[]>({
    queryKey: ['telegram-dialogs', selectedSessionId],
    queryFn: () => api.get(`/telegram/sessions/${selectedSessionId}/dialogs`).then(res => res.data),
    enabled: !!selectedSessionId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listagem de Diálogos</h2>
          <p className="text-gray-600 mt-1">Selecione uma sessão ativa para ver os grupos e canais ou criar um novo grupo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateGroupForm(true)}
            disabled={!selectedSessionId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Grupo</span>
          </button>
          <div className="w-full sm:w-64">
          <label htmlFor="session-select" className="sr-only">Selecione a Sessão</label>
          <select
            id="session-select"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoadingSessions || !sessions || sessions.length === 0}
          >
            <option value="" disabled>{isLoadingSessions ? 'Carregando...' : 'Selecione uma sessão'}</option>
            {sessions?.map(session => (
              <option key={session.id} value={session.id}>{session.label}</option>
            ))}
          </select>
          </div>
        </div>
      </div>

      {isLoadingDialogs ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : dialogsError ? (
        <div className="text-center py-12 text-red-500">Ocorreu um erro ao carregar os diálogos.</div>
      ) : selectedSessionId && dialogs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dialogs.map((dialog) => (
            <div key={dialog.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 flex-1 truncate pr-2">{dialog.title}</h3>
                <div className="flex items-center space-x-2 text-xs">
                                    {dialog.isVerified && <span title="Verificado"><ShieldCheck className="w-4 h-4 text-blue-500" /></span>}

                                    {dialog.isScam && <span title="Scam"><ShieldOff className="w-4 h-4 text-red-500" /></span>}
                  <span className={`px-2 py-0.5 rounded-full text-white ${dialog.isChannel ? 'bg-purple-500' : 'bg-green-500'}`}>
                    {dialog.isChannel ? 'Canal' : 'Grupo'}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                <span>{dialog.memberCount.toLocaleString('pt-BR')} membros</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <BookUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {sessions && sessions.length > 0 ? 'Selecione uma sessão' : 'Nenhuma sessão ativa encontrada'}
          </h3>
          <p className="text-gray-600">
            {sessions && sessions.length > 0 ? 'Os diálogos aparecerão aqui.' : 'Crie ou ative uma sessão para continuar.'}
          </p>
        </div>
      )}

      {showCreateGroupForm && selectedSessionId && (
        <CreateGroupForm
          sessionId={selectedSessionId}
          onClose={() => setShowCreateGroupForm(false)}
          onSuccess={() => {
            setShowCreateGroupForm(false);
            // In the future, we will refetch the dialogs list here
          }}
        />
      )}
    </div>
  );
}
