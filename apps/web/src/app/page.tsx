import { TelegramManager } from '@/components/TelegramManager';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Telegram Manager
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          Gerencie seus contatos, grupos e canais do Telegram de forma eficiente. 
          Extraia informações de membros e organize seus dados.
        </p>
        
        <TelegramManager />
      </div>
    </main>
  );
}
