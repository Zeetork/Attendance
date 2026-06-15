'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'react-hot-toast';
import { FileText, Plus, Trash2, Edit } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TemplatesPage() {
  const { data, isLoading } = useSWR('/api/letters/templates', fetcher);
  const templates = data?.templates || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    templateName: '',
    category: 'Bonus Letter',
    subject: '',
    content: '',
    customVariables: [] as { name: string; type: string }[]
  });

  const categories = [
    'Bonus Letter',
    'Performance Appraisal',
    'Promotion Letter',
    'Permanent Confirmation',
    'Salary Revision',
    'Warning Letter',
    'Custom Letter'
  ];

  const handleOpenModal = (template?: any) => {
    if (template) {
      setEditingTemplateId(template._id);
      setFormData({
        templateName: template.templateName,
        category: template.category,
        subject: template.subject,
        content: template.content,
        customVariables: template.customVariables || []
      });
    } else {
      setEditingTemplateId(null);
      setFormData({
        templateName: '',
        category: 'Bonus Letter',
        subject: '',
        content: '<p>Dear {{employeeName}},</p><br/><p>...</p>',
        customVariables: []
      });
    }
    setIsModalOpen(true);
  };

  const addCustomVariable = () => {
    setFormData({
      ...formData,
      customVariables: [...formData.customVariables, { name: '', type: 'Text' }]
    });
  };

  const removeCustomVariable = (index: number) => {
    const newVars = [...formData.customVariables];
    newVars.splice(index, 1);
    setFormData({ ...formData, customVariables: newVars });
  };

  const updateCustomVariable = (index: number, field: string, value: string) => {
    const newVars = [...formData.customVariables];
    newVars[index] = { ...newVars[index], [field]: value };
    setFormData({ ...formData, customVariables: newVars });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving template...');

    try {
      const url = editingTemplateId 
        ? `/api/letters/templates/${editingTemplateId}`
        : '/api/letters/templates';
      const method = editingTemplateId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingTemplateId ? 'Template updated' : 'Template created', { id: toastId });
        setIsModalOpen(false);
        mutate('/api/letters/templates');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save', { id: toastId });
      }
    } catch (error) {
      toast.error('An error occurred', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/letters/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Template deleted');
        mutate('/api/letters/templates');
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  if (isLoading) return <div className="text-white p-6">Loading templates...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-white">Letter Templates</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template: any) => (
          <div key={template._id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-indigo-400 mr-2" />
                <h3 className="text-white font-medium truncate">{template.templateName}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(template)} className="text-neutral-400 hover:text-blue-400">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(template._id)} className="text-neutral-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-neutral-500 mb-2">
              <span className="bg-neutral-800 px-2 py-1 rounded text-xs text-neutral-300">{template.category}</span>
            </div>
            <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{template.subject}</p>
            <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between text-xs text-neutral-500">
              <span>{template.customVariables?.length || 0} Custom Variables</span>
              <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {editingTemplateId ? 'Edit Template' : 'Create New Template'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Template Name</label>
                  <input
                    required
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                    value={formData.templateName}
                    onChange={e => setFormData({ ...formData, templateName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Category</label>
                  <select
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email Subject Line</label>
                <input
                  required
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-neutral-300">Custom Variables</label>
                  <button type="button" onClick={addCustomVariable} className="text-xs text-blue-400 flex items-center hover:text-blue-300">
                    <Plus className="w-3 h-3 mr-1" /> Add Variable
                  </button>
                </div>
                <div className="space-y-3 bg-neutral-800/30 p-4 rounded-lg border border-neutral-800">
                  {formData.customVariables.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center">No custom variables added.</p>
                  )}
                  {formData.customVariables.map((v, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-1">
                        <input
                          placeholder="Variable Name (e.g., bonusAmount)"
                          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                          value={v.name}
                          onChange={e => updateCustomVariable(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-48">
                        <select
                          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                          value={v.type}
                          onChange={e => updateCustomVariable(index, 'type', e.target.value)}
                        >
                          <option value="Text">Text</option>
                          <option value="Number">Number</option>
                          <option value="Date">Date</option>
                        </select>
                      </div>
                      <button type="button" onClick={() => removeCustomVariable(index)} className="p-2 text-red-400 hover:text-red-300 mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.customVariables.length > 0 && (
                    <p className="text-xs text-neutral-500">Usage: Use {'{{variableName}}'} in content below.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">HTML Content</label>
                <div className="text-xs text-neutral-500 mb-2">Standard Variables: {'{{employeeName}}'}, {'{{employeeCode}}'}, {'{{designation}}'}, {'{{department}}'}, {'{{currentDate}}'}</div>
                <textarea
                  required
                  rows={10}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500 font-mono text-sm custom-scrollbar"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingTemplateId ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
