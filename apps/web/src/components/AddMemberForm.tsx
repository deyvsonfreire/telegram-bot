'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const addMemberSchema = z.object({
  username: z.string().min(1, 'O nome de usuário ou ID é obrigatório'),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AddMemberFormProps {
  sessionId: string;
  groupId: string;
  onClose: () => void;
}

export function AddMemberForm({ sessionId, groupId, onClose }: AddMemberFormProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: AddMemberFormData) => {
      return api.post(`/telegram/sessions/${sessionId}/groups/${groupId}/members`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-members', sessionId, groupId] });
      onClose();
    },
  });

  const handleAddMember = (data: AddMemberFormData) => {
    mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Adicionar Membro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleAddMember)} className="space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error.message}</div>}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username ou ID do Usuário</label>
            <input {...register('username')} id="username" placeholder="@username ou 123456789" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            {errors.username && <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>}
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50 flex items-center">
              {isPending && <Loader2 className="animate-spin mr-2" />} 
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
