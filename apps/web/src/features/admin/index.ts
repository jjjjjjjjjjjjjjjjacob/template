// Admin hooks
export {
  useAdminAuth,
  useAdminStats,
  useUserManagement,
} from './hooks/use-admin';

// Admin services
export { useAdminService, adminUtils } from './services/admin-service';

// Admin components
export { AdminGuard } from './components/admin-guard';

// Admin types
export type {
  AdminUser,
  AdminPermission,
  AdminStats,
  AdminAction,
  UserManagementFilters,
} from './types';
