export interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isContact: boolean;
  isBot: boolean;
}

export interface TelegramDialog {
  id: number;
  type: 'private' | 'group' | 'channel' | 'supergroup';
  title: string;
  username?: string;
  memberCount?: number;
}

export interface TelegramMember {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isContact: boolean;
  isBot: boolean;
}

export interface CollectionJob {
  id: string;
  type: 'collect_members' | 'sync_dialogs' | 'sync_contacts';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
}

export interface ExportRequest {
  name: string;
  description?: string;
  filters: {
    dialogIds?: number[];
    includePhones?: boolean;
    onlyContacts?: boolean;
    dateRange?: {
      from: string;
      to: string;
    };
  };
}
