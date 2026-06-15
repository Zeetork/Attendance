import { Metadata } from 'next';
import AdminApprovalClient from './AdminApprovalClient';

export const metadata: Metadata = {
  title: 'Approval Center | HRMS',
  description: 'Manage employee requests and approvals',
};

export default function AdminApprovalsPage() {
  return <AdminApprovalClient />;
}
