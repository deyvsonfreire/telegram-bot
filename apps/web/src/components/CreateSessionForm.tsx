'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Bot, User, Phone, Key, Hash } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateSessionInput {
  type: 'bot' | 'user';
  label: string;
  phoneNumber?: string;
  apiId?: string;
  apiHash?: string;
  botToken?: string;
}

interface CreateSessionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSessionForm({ onClose, onSuccess }: CreateSessionFormProps) {
  const [sessionType, setSessionType] = useState<'BOT' | 'USER'>('USER');
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateSessionInput>({
    defaultValues: {
      type: 'user',
      label: '',
      phoneNumber: '',
      apiId: '',
      apiHash: '',
      botToken: '',
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: CreateSessionInput) => 
      api.post('/telegram/sessions', data).then(res => res.data),
    onSuccess: (data) => {
      if (data.type === 'USER' && data.phoneNumber) {
        setPhoneNumber(data.phoneNumber);
        setStep('verification');
      } else {
        onSuccess();
      }
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: (code: string) => 
      api.post(`/telegram/sessions/${phoneNumber}/verify`, { code }).then(res => res.data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: CreateSessionInput) => {
    createSessionMutation.mutate(data);
  };

  const handleVerifyCode = () => {
    if (verificationCode.trim()) {
      verifyCodeMutation.mutate(verificationCode);
    }
  };

  if (step === 'verification') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Verificação do Telegram</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center mb-6">
            <Phone className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              Digite o código de verificação enviado para:
            </p>
            <p className="font-semibold text-gray-900">{phoneNumber}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificação
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345"
                maxLength={5}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={!verificationCode.trim() || verifyCodeMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {verifyCodeMutation.isPending ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Nova Sessão do Telegram</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de Sessão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Sessão
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSessionType('USER');
                  setValue('type', 'user');
                }}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-2 ${
                  sessionType === 'USER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Usuário</span>
                <span className="text-xs text-center">
                  Acesso completo via MTProto
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSessionType('BOT');
                  setValue('type', 'bot');
                }}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-2 ${
                  sessionType === 'BOT'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Bot className="w-5 h-5" />
                <span className="text-sm font-medium">Bot</span>
                <span className="text-xs text-center">
                  Acesso limitado via Bot API
                </span>
              </button>
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Sessão
            </label>
            <input
              type="text"
              {...register('label', { required: 'Nome da sessão é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Conta Principal"
            />
            {errors.label && (
              <p className="text-red-500 text-sm mt-1">{errors.label.message}</p>
            )}
          </div>

          {/* Número de Telefone (apenas para usuário) */}
          {sessionType === 'USER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Telefone
              </label>
              <input
                type="tel"
                {...register('phoneNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+55 11 99999-9999"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>
          )}

          {/* API ID e Hash (apenas para usuário) */}
          {sessionType === 'USER' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API ID
                </label>
                <input
                  type="text"
                  {...register('apiId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345"
                />
                {errors.apiId && (
                  <p className="text-red-500 text-sm mt-1">{errors.apiId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Hash
                </label>
                <input
                  type="text"
                  {...register('apiHash')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="abcdef1234567890abcdef1234567890"
                />
                {errors.apiHash && (
                  <p className="text-red-500 text-sm mt-1">{errors.apiHash.message}</p>
                )}
              </div>
            </>
          )}

          {/* Bot Token (apenas para bot) */}
          {sessionType === 'BOT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token do Bot
              </label>
              <input
                type="text"
                {...register('botToken')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              {errors.botToken && (
                <p className="text-red-500 text-sm mt-1">{errors.botToken.message}</p>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createSessionMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createSessionMutation.isPending ? 'Criando...' : 'Criar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
