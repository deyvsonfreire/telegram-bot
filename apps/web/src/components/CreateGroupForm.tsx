'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const createGroupSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupFormProps {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGroupForm({ sessionId, onClose, onSuccess }: CreateGroupFormProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: CreateGroupFormData) => {
      return api.post(`/telegram/sessions/${sessionId}/groups`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-dialogs', sessionId] });
      onSuccess();
    },
  });

  const handleCreateGroup = (data: CreateGroupFormData) => {
    mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Criar Novo Grupo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleCreateGroup)} className="space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error.message}</div>}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título do Grupo</label>
            <input {...register('title')} id="title" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center">
              {isPending && <Loader2 className="animate-spin mr-2" />} 
              Criar Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
