import { AuthGuard } from '@/components/AuthGuard';
import { Header } from '@/components/Header';
import { TelegramManager } from '@/components/TelegramManager';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <TelegramManager />
        </main>
      </div>
    </AuthGuard>
  );
}

