'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const sessionSchema = z.object({
  label: z.string().min(3, 'O rótulo deve ter pelo menos 3 caracteres'),
  type: z.enum(['USER', 'BOT']),
  phoneNumber: z.string().optional(),
  token: z.string().optional(),
}).refine(data => data.type === 'USER' ? !!data.phoneNumber : !!data.token, {
  message: 'Número de telefone ou token do bot é obrigatório',
  path: ['phoneNumber'], // or ['token']
});

const codeSchema = z.object({
  code: z.string().min(4, 'O código deve ter pelo menos 4 caracteres'),
});

type SessionFormData = z.infer<typeof sessionSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

export function CreateSessionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void; }) {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { type: 'USER' },
  });

  const { register: registerCode, handleSubmit: handleSubmitCode, formState: { errors: codeErrors } } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const sessionType = watch('type');

  const handleCreateSession = async (data: SessionFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.post('/telegram/sessions', data);
      setSessionId(response.data.id);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocorreu um erro ao criar a sessão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (data: CodeFormData) => {
    if (!sessionId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/telegram/sessions/${sessionId}/verify`, { code: data.code });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código de verificação inválido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        {step === 1 ? (
          <form onSubmit={handleSubmit(handleCreateSession)} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Criar Nova Sessão</h2>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
            
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700">Rótulo</label>
              <input {...register('label')} id="label" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              {errors.label && <p className="mt-2 text-sm text-red-600">{errors.label.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Sessão</label>
              <select {...register('type')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="USER">Usuário (Número de Telefone)</option>
                <option value="BOT">Bot (Token)</option>
              </select>
            </div>

            {sessionType === 'USER' ? (
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Número de Telefone</label>
                <input {...register('phoneNumber')} id="phoneNumber" placeholder="+5511999999999" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                {errors.phoneNumber && <p className="mt-2 text-sm text-red-600">{errors.phoneNumber.message}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">Token do Bot</label>
                <input {...register('token')} id="token" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                {errors.token && <p className="mt-2 text-sm text-red-600">{errors.token.message}</p>}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Avançar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitCode(handleVerifyCode)} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Verificar Sessão</h2>
            <p className="text-sm text-gray-600">Insira o código de verificação que você recebeu no Telegram.</p>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
            
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código de Verificação</label>
              <input {...registerCode('code')} id="code" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              {codeErrors.code && <p className="mt-2 text-sm text-red-600">{codeErrors.code.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Verificar e Salvar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
