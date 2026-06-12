import { Metadata } from 'next';
import ApprovalClient from './ApprovalClient';

export const metadata: Metadata = {
  title: 'Approval Center | HRMS',
  description: 'Manage team requests and approvals',
};

export default function ApprovalsPage() {
  return <ApprovalClient />;
}
