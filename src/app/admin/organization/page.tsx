import HierarchyBuilderClient from './HierarchyBuilderClient';

export default function OrganizationPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Organization Hierarchy
        </h1>
        <p className="text-sm md:text-base text-neutral-400 mt-1">
          Manage reporting structures and view the organization tree. Drag and drop employees to update their manager.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        <HierarchyBuilderClient />
      </div>
    </div>
  );
}
