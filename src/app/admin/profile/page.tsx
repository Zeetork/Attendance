import ProfileClient from '@/components/ProfileClient';

export default function AdminProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Profile</h1>
      </div>
      <ProfileClient />
    </div>
  );
}
