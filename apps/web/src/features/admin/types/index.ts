export interface AdminUser {
  id: string;
  role: 'admin' | 'moderator' | 'user';
  permissions: AdminPermission[];
  lastLoginAt?: string;
  createdAt: string;
}

export type AdminPermission =
  | 'users.read'
  | 'users.write'
  | 'users.delete'
  | 'content.moderate'
  | 'content.delete'
  | 'analytics.read'
  | 'system.config';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  pendingModeration: number;
}

export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'content' | 'system';
  targetId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UserManagementFilters {
  role?: 'admin' | 'moderator' | 'user';
  status?: 'active' | 'suspended' | 'banned';
  dateRange?: {
    start: string;
    end: string;
  };
}
