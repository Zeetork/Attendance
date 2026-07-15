import { Metadata } from 'next';
import PermissionClient from './PermissionClient';

export const metadata: Metadata = {
  title: 'My Permissions | HRMS',
  description: 'Manage your short-duration permissions and compensations.',
};

export default function EmployeePermissionsPage() {
  return <PermissionClient />;
}
