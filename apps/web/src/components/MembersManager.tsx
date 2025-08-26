'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Loader2, User, Shield, Bot, UserPlus, Trash2 } from 'lucide-react';
import { AddMemberForm } from './AddMemberForm';

// Interfaces based on expected API responses
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

interface Member {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  isBot: boolean;
  isAdmin: boolean;
  isContact: boolean;
}

export function MembersManager() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  // 1. Fetch active sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['telegram-sessions'],
    queryFn: () => api.get('/telegram/sessions').then(res => res.data),
    select: (data) => data.filter(s => s.status === 'ACTIVE'),
  });

  // 2. Fetch dialogs (groups) for the selected session
  const { data: dialogs, isLoading: isLoadingDialogs } = useQuery<Dialog[]>({
    queryKey: ['telegram-dialogs', selectedSessionId],
    queryFn: () => api.get(`/telegram/sessions/${selectedSessionId}/dialogs`).then(res => res.data),
    enabled: !!selectedSessionId,
    select: (data) => data.filter(d => !d.isChannel), // Only show groups
  });

  // 3. Fetch members for the selected group
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useQuery<Member[]>({
    queryKey: ['telegram-members', selectedSessionId, selectedGroupId],
    queryFn: () => api.get(`/telegram/sessions/${selectedSessionId}/groups/${selectedGroupId}/members`).then(res => res.data),
    enabled: !!selectedSessionId && !!selectedGroupId,
  });

  const queryClient = useQueryClient();

  const { mutate: removeMember, isPending: isRemovingMember } = useMutation({
    mutationFn: (memberId: number) => {
      return api.delete(`/telegram/sessions/${selectedSessionId}/groups/${selectedGroupId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-members', selectedSessionId, selectedGroupId] });
    },
  });

  const handleRemoveMember = (member: Member) => {
    const memberName = `${member.firstName} ${member.lastName || ''}`.trim();
    if (window.confirm(`Tem certeza que deseja remover "${memberName}" do grupo?`)) {
      removeMember(member.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Membros</h2>
        <p className="text-gray-600 mt-1">Adicione, remova e visualize membros de seus grupos.</p>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddMemberForm(true)}
          disabled={!selectedGroupId}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Adicionar Membro</span>
        </button>
      </div>

      {/* Session and Group Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="session-select-members" className="block text-sm font-medium text-gray-700">Sessão</label>
          <select
            id="session-select-members"
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
          <label htmlFor="group-select-members" className="block text-sm font-medium text-gray-700">Grupo</label>
          <select
            id="group-select-members"
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

      {/* Members List Display */}
      <div className="bg-white rounded-lg shadow">
        {isLoadingMembers ? (
          <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : membersError ? (
          <div className="text-center py-12 text-red-500">Ocorreu um erro ao carregar os membros.</div>
        ) : selectedGroupId && members ? (
          <ul className="divide-y divide-gray-200">
            {members.map(member => (
              <li key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{`${member.firstName} ${member.lastName || ''}`.trim()}</p>
                    <p className="text-sm text-gray-500">{member.username ? `@${member.username}` : 'Sem username'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {member.isBot && <span title="Bot"><Bot className="w-5 h-5 text-blue-500" /></span>}
                    {member.isAdmin && <span title="Admin"><Shield className="w-5 h-5 text-yellow-500" /></span>}
                  </div>
                  <button 
                    onClick={() => handleRemoveMember(member)}
                    disabled={isRemovingMember}
                    className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="Remover Membro"
                  >
                    {isRemovingMember ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma sessão e um grupo</h3>
            <p className="text-gray-600">Os membros do grupo selecionado aparecerão aqui.</p>
          </div>
        )}
      </div>

      {showAddMemberForm && selectedSessionId && selectedGroupId && 
        <AddMemberForm 
          sessionId={selectedSessionId} 
          groupId={selectedGroupId} 
          onClose={() => setShowAddMemberForm(false)} 
        /> 
      }
    </div>
  );
}
