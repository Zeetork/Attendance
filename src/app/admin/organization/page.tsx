import HierarchyBuilderClient from './HierarchyBuilderClient';

export default function OrganizationPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Organization Hierarchy
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-bold mt-1">
          Manage reporting structures and view the organization tree. Drag and drop employees to update their manager.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        <HierarchyBuilderClient />
      </div>
    </div>
  );
}
