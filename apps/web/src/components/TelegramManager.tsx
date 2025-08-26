'use client';

import { useState, useMemo } from 'react';

import { SessionManager } from './SessionManager';
import { DialogList } from './DialogList';
import { MembersManager } from './MembersManager';
import { CopyMembersManager } from './CopyMembersManager';
import { ExportMembersManager } from './ExportMembersManager';

type TabId = 'sessions' | 'dialogs' | 'members' | 'copy-members' | 'export-members'; // | 'jobs';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  component: React.ReactNode;
}

export function TelegramManager() {
  const [activeTabId, setActiveTabId] = useState<TabId>('sessions');

  const tabs: Tab[] = useMemo(() => [
    { id: 'sessions', label: 'Sessões', icon: '🔐', component: <SessionManager /> },
    { id: 'dialogs', label: 'Diálogos', icon: '📚', component: <DialogList /> },
    { id: 'members', label: 'Membros', icon: '👥', component: <MembersManager /> },
    { id: 'copy-members', label: 'Copiar Membros', icon: '🔄', component: <CopyMembersManager /> },
    { id: 'export-members', label: 'Exportar Membros', icon: '📄', component: <ExportMembersManager /> },
  ], []);

  const activeTab = useMemo(() => tabs.find(tab => tab.id === activeTabId), [activeTabId, tabs]);

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl mx-auto">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center transition-colors ${
                activeTabId === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab?.component}
      </div>
    </div>
  );
}
