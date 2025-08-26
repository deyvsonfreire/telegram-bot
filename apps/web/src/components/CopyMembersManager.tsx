'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Copy, ArrowRight, Loader2 } from 'lucide-react';

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

export function CopyMembersManager() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sourceGroupId, setSourceGroupId] = useState<string | null>(null);
  const [destinationGroupId, setDestinationGroupId] = useState<string | null>(null);

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

  const { mutate: copyMembers, isPending, error, isSuccess } = useMutation({
    mutationFn: () => {
      return api.post(`/telegram/sessions/${selectedSessionId}/groups/copy-members`, {
        sourceGroupId: Number(sourceGroupId),
        destinationGroupId: Number(destinationGroupId),
      });
    },
  });

  const destinationDialogs = useMemo(() => {
    if (!dialogs) return [];
    return dialogs.filter(d => d.id.toString() !== sourceGroupId);
  }, [dialogs, sourceGroupId]);

  const handleCopy = () => {
    if (sourceGroupId && destinationGroupId) {
      copyMembers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Copiar Membros entre Grupos</h2>
        <p className="text-gray-600 mt-1">Selecione uma sessão, um grupo de origem e um grupo de destino para copiar os membros.</p>
      </div>

      <div className="space-y-4 p-6 bg-gray-50 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="session-select-copy" className="block text-sm font-medium text-gray-700">Sessão</label>
            <select
              id="session-select-copy"
              value={selectedSessionId || ''}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setSourceGroupId(null);
                setDestinationGroupId(null);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoadingSessions}
            >
              <option value="" disabled>{isLoadingSessions ? 'Carregando...' : 'Selecione uma sessão'}</option>
              {sessions?.map(session => <option key={session.id} value={session.id}>{session.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:items-end gap-6">
          <div>
            <label htmlFor="source-group-select" className="block text-sm font-medium text-gray-700">Grupo de Origem</label>
            <select
              id="source-group-select"
              value={sourceGroupId || ''}
              onChange={(e) => setSourceGroupId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={!selectedSessionId || isLoadingDialogs}
            >
              <option value="" disabled>{isLoadingDialogs ? 'Carregando...' : 'Selecione o grupo de origem'}</option>
              {dialogs?.map(dialog => <option key={dialog.id} value={dialog.id}>{dialog.title}</option>)}
            </select>
          </div>

          <div className="hidden md:flex justify-center items-center pb-2">
            <ArrowRight className="w-8 h-8 text-gray-400 mx-auto" />
          </div>

          <div>
            <label htmlFor="destination-group-select" className="block text-sm font-medium text-gray-700">Grupo de Destino</label>
            <select
              id="destination-group-select"
              value={destinationGroupId || ''}
              onChange={(e) => setDestinationGroupId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={!selectedSessionId || isLoadingDialogs || !sourceGroupId}
            >
              <option value="" disabled>{isLoadingDialogs ? 'Carregando...' : 'Selecione o grupo de destino'}</option>
              {destinationDialogs.map(dialog => <option key={dialog.id} value={dialog.id}>{dialog.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">Ocorreu um erro ao copiar os membros.</div>}
      {isSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">A cópia de membros foi iniciada com sucesso.</div>}

      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          disabled={!sourceGroupId || !destinationGroupId || isPending}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base font-medium"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />}
          <span>{isPending ? 'Copiando...' : 'Copiar Membros'}</span>
        </button>
      </div>
    </div>
  );
}
