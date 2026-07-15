import { Metadata } from 'next';
import AdminPermissionClient from './AdminPermissionClient';

export const metadata: Metadata = {
  title: 'Manage Permissions | HRMS',
  description: 'Approve or reject employee permissions.',
};

export default function AdminPermissionsPage() {
  return <AdminPermissionClient />;
}
