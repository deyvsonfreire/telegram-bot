'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Phone, User, Bot, Download, Search, Filter } from 'lucide-react';
import { api } from '@/lib/api';

interface Member {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isContact: boolean;
  isBot: boolean;
  isDeleted: boolean;
  lastSeen?: string;
  updatedAt: string;
}

interface MemberListProps {
  dialogId: string | null;
  sessionId: string | null;
}

export function MemberList({ dialogId, sessionId }: MemberListProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    onlyContacts: false,
    onlyWithPhone: false,
    excludeBots: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['telegram-members', dialogId, page, searchTerm, filters],
    queryFn: () => api.get(`/telegram/dialogs/${dialogId}/members`, {
      params: { page, limit: 50, ...filters, search: searchTerm }
    }).then(res => res.data),
    enabled: !!dialogId,
  });

  const collectMembersMutation = useMutation({
    mutationFn: () => api.post(`/telegram/dialogs/${dialogId}/collect-members`, {
      sessionId,
      limit: 1000
    }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-members', dialogId] });
    },
  });

  const exportMembersMutation = useMutation({
    mutationFn: (format: 'csv' | 'json') => api.post(`/telegram/dialogs/${dialogId}/export`, {
      format,
      filters: { ...filters, search: searchTerm }
    }).then(res => res.data),
  });

  if (!dialogId) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Selecione um Diálogo
        </h3>
        <p className="text-gray-600">
          Escolha um grupo ou canal para visualizar os membros
        </p>
      </div>
    );
  }

  const { members, pagination } = membersData || { members: [], pagination: { total: 0, pages: 0 } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Membros do Diálogo</h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} membros encontrados
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => collectMembersMutation.mutate()}
            disabled={collectMembersMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{collectMembersMutation.isPending ? 'Coletando...' : 'Coletar Membros'}</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => exportMembersMutation.mutate('csv')}
              disabled={exportMembersMutation.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nome, username ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.onlyContacts}
                onChange={(e) => setFilters(prev => ({ ...prev, onlyContacts: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Apenas contatos</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.onlyWithPhone}
                onChange={(e) => setFilters(prev => ({ ...prev, onlyWithPhone: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Com telefone</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.excludeBots}
                onChange={(e) => setFilters(prev => ({ ...prev, excludeBots: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Excluir bots</span>
            </label>
          </div>
        </div>
      )}

      {/* Members List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : members.length > 0 ? (
        <div className="space-y-4">
          {members.map((member: Member) => (
            <div
              key={member.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {member.isBot ? (
                      <Bot className="w-5 h-5 text-gray-600" />
                    ) : (
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </h3>
                      {member.isContact && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Contato
                        </span>
                      )}
                      {member.isBot && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          Bot
                        </span>
                      )}
                    </div>
                    
                    {member.username && (
                      <p className="text-sm text-gray-600">@{member.username}</p>
                    )}
                    
                    {member.phoneNumber && (
                      <p className="text-sm text-gray-600 flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{member.phoneNumber}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right text-xs text-gray-500">
                  <div>ID: {member.telegramId}</div>
                  <div>Atualizado: {new Date(member.updatedAt).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-600">
                Página {page} de {pagination.pages}
              </span>
              
              <button
                onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum membro encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(Boolean)
              ? 'Tente ajustar os filtros de busca'
              : 'Clique em "Coletar Membros" para buscar membros do diálogo'
            }
          </p>
          {!searchTerm && !Object.values(filters).some(Boolean) && (
            <button
              onClick={() => collectMembersMutation.mutate()}
              disabled={collectMembersMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {collectMembersMutation.isPending ? 'Coletando...' : 'Coletar Membros'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
