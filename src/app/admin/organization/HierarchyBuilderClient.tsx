'use client';

import React, { useEffect, useState } from 'react';
import { Network, User as UserIcon, ChevronDown, ChevronRight, GripVertical, Search, Loader2, Menu, X } from 'lucide-react';
import clsx from 'clsx';

interface EmployeeNode {
  _id: string;
  name: string;
  role: string;
  designation: string;
  department: string;
  children: EmployeeNode[];
}

export default function HierarchyBuilderClient() {
  const [tree, setTree] = useState<EmployeeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hierarchy/tree');
      const json = await res.json();
      if (json.success) {
        setTree(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleDrop = async (employeeId: string, newManagerId: string | null) => {
    if (employeeId === newManagerId) return; // Can't drop on self
    
    // Optimistically update UI or just refetch. We'll refetch for simplicity and correctness.
    try {
      const res = await fetch('/api/hierarchy/update-manager', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, reportsTo: newManagerId }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Failed to update hierarchy');
      }
      fetchTree(); // Refresh
    } catch (e) {
      console.error(e);
      alert('Network error updating hierarchy.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-full relative overflow-hidden">
      {/* Sidebar for Unassigned / Search */}
      <div className={clsx(
        "bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col shrink-0 transition-all duration-300 z-20 absolute md:relative h-full overflow-hidden",
        isSidebarOpen ? "w-80 translate-x-0" : "-translate-x-full md:w-0 md:border-none"
      )}>
        <div className="w-80 h-full flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="relative flex-1 mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Admin / Top Level</h3>
            <div 
              className="min-h-[100px] border-2 border-dashed border-neutral-700 rounded-lg p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id) handleDrop(id, null);
              }}
            >
              {tree.map(node => (
                 <TreeNode 
                   key={node._id} 
                   node={node} 
                   search={search} 
                   onDragStart={() => setDraggingId(node._id)}
                   onDragEnd={() => setDraggingId(null)}
                   onDropNode={handleDrop}
                 />
              ))}
              {tree.length === 0 && (
                <div className="text-neutral-500 text-sm text-center mt-4">
                  No employees found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main visual canvas */}
      <div 
        className="flex-1 bg-neutral-950 overflow-auto p-4 md:p-8 relative"
        onClick={() => setIsSidebarOpen(false)}
      >
        {!isSidebarOpen && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
            className="absolute top-4 left-4 z-10 p-2 bg-neutral-800 border border-neutral-700 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 shadow-md"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-fit mx-auto min-h-full pt-10 md:pt-0">
           <OrgChart 
             nodes={tree} 
             onNodeClick={(e) => {
               e.stopPropagation();
               setIsSidebarOpen(true);
             }} 
           />
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, search, onDragStart, onDragEnd, onDropNode }: any) {
  const [expanded, setExpanded] = useState(true);
  
  const matchesSearch = search && node.name.toLowerCase().includes(search.toLowerCase());
  
  return (
    <div className="ml-4 first:ml-0 mt-2">
      <div 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', node._id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const draggedId = e.dataTransfer.getData('text/plain');
          if (draggedId !== node._id) {
            onDropNode(draggedId, node._id);
          }
        }}
        className={clsx(
          "flex items-center p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing group",
          matchesSearch ? "bg-blue-500/10 border-blue-500/50" : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"
        )}
      >
        <button 
          onClick={() => setExpanded(!expanded)}
          className={clsx("p-1 rounded-md hover:bg-neutral-700 text-neutral-400 mr-1", node.children.length === 0 && 'invisible')}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center mr-3 flex-shrink-0">
          <UserIcon className="w-3 h-3 text-neutral-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{node.name}</div>
          <div className="text-xs text-neutral-400 truncate">{node.designation}</div>
        </div>
        <GripVertical className="w-4 h-4 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {expanded && node.children.length > 0 && (
        <div className="border-l border-neutral-700 ml-4 mt-1 pl-2">
          {node.children.map((child: any) => (
            <TreeNode 
              key={child._id} 
              node={child} 
              search={search}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropNode={onDropNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgChart({ nodes, onNodeClick }: { nodes: EmployeeNode[], onNodeClick?: (e: React.MouseEvent) => void }) {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="flex gap-12">
      {nodes.map(node => (
        <OrgChartNode key={node._id} node={node} onNodeClick={onNodeClick} />
      ))}
    </div>
  );
}

function OrgChartNode({ node, onNodeClick }: { node: EmployeeNode, onNodeClick?: (e: React.MouseEvent) => void }) {
  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div 
        className="bg-neutral-900 border border-neutral-700 shadow-xl rounded-xl p-4 w-48 relative group z-10 hover:border-blue-500 transition-colors cursor-pointer"
        onClick={onNodeClick}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
           <span className={clsx(
             "px-2 py-0.5 rounded-full  text-[10px] font-bold uppercase tracking-wider",
             node.role === 'admin' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
             node.role === 'director' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
             node.role === 'department_head' ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
             node.role === 'manager' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
             node.role === 'team_head' ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" :
             "bg-neutral-700 text-neutral-300 border border-neutral-600"
           )}>
             {node.role.replace('_', ' ')}
           </span>
        </div>
        <div className="flex flex-col items-center mt-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-2 border border-neutral-600">
             <UserIcon className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="text-sm font-semibold text-white text-center truncate w-full">{node.name}</div>
          <div className="text-xs text-neutral-400 text-center truncate w-full mt-0.5">{node.designation}</div>
          <div className="text-[10px] text-neutral-500 mt-2">{node.department}</div>
        </div>
      </div>

      {/* Children connector lines */}
      {node.children && node.children.length > 0 && (
        <>
          {/* Vertical line down from current node */}
          <div className="w-px h-8 bg-neutral-700"></div>
          
          <div className="flex relative mt-0">
             {/* Horizontal connecting line for siblings */}
             {node.children.length > 1 && (
                <div 
                  className="absolute top-0 h-px bg-neutral-700"
                  style={{
                    left: `calc(100% / ${node.children.length * 2})`,
                    right: `calc(100% / ${node.children.length * 2})`
                  }}
                ></div>
             )}
             
             {/* Child Nodes */}
             {node.children.map((child, index) => (
               <div key={child._id} className="relative flex flex-col items-center px-4">
                 {/* Vertical line connecting to child */}
                 <div className="w-px h-8 bg-neutral-700"></div>
                 <OrgChartNode node={child} onNodeClick={onNodeClick} />
               </div>
             ))}
          </div>
        </>
      )}
    </div>
  );
}
