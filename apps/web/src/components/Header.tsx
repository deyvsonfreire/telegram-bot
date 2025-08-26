'use client';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Telegram Manager
        </h1>
        <div>
          <span className="text-sm text-gray-600">dev@test.com</span>
        </div>
      </div>
    </header>
  );
}
