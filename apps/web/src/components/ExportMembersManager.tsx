'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Download, Loader2 } from 'lucide-react';

interface Session {
  id: string;
  label: string;
  status: string;
}

interface Dialog {
  id: number;
  title: string;
  isChannel: boolean;
}

export function ExportMembersManager() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['telegram-sessions'],
    queryFn: () => api.get('/telegram/sessions').then(res => res.data),
    select: (data) => data.filter(s => s.status === 'ACTIVE'),
  });

  const { data: dialogs, isLoading: isLoadingDialogs } = useQuery<Dialog[]>({
    queryKey: ['telegram-dialogs', selectedSessionId],
    queryFn: () => api.get(`/telegram/sessions/${selectedSessionId}/dialogs`).then(res => res.data),
    enabled: !!selectedSessionId,
    select: (data) => data.filter(d => !d.isChannel),
  });

  const { mutate: exportMembers, isPending } = useMutation({
    mutationFn: () => {
      return api.get(`/telegram/sessions/${selectedSessionId}/groups/${selectedGroupId}/members/export`, {
        responseType: 'blob',
      });
    },
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const groupName = dialogs?.find(d => d.id.toString() === selectedGroupId)?.title || 'members';
      link.href = url;
      link.setAttribute('download', `${groupName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: () => {
      alert('Falha ao exportar membros. Verifique o console para mais detalhes.');
    }
  });

  const handleExport = () => {
    if (selectedGroupId) {
      exportMembers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Exportar Membros de Grupo</h2>
        <p className="text-gray-600 mt-1">Selecione uma sessão e um grupo para exportar a lista de membros em formato CSV.</p>
      </div>

      <div className="space-y-4 p-6 bg-gray-50 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="session-select-export" className="block text-sm font-medium text-gray-700">Sessão</label>
            <select
              id="session-select-export"
              value={selectedSessionId || ''}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setSelectedGroupId(null);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoadingSessions}
            >
              <option value="" disabled>{isLoadingSessions ? 'Carregando...' : 'Selecione uma sessão'}</option>
              {sessions?.map(session => <option key={session.id} value={session.id}>{session.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="group-select-export" className="block text-sm font-medium text-gray-700">Grupo</label>
            <select
              id="group-select-export"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={!selectedSessionId || isLoadingDialogs}
            >
              <option value="" disabled>{isLoadingDialogs ? 'Carregando...' : 'Selecione um grupo'}</option>
              {dialogs?.map(dialog => <option key={dialog.id} value={dialog.id}>{dialog.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={!selectedGroupId || isPending}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          <span>{isPending ? 'Exportando...' : 'Exportar para CSV'}</span>
        </button>
      </div>
    </div>
  );
}
