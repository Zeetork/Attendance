'use client';

import React, { useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, X, Loader2, Camera, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmployeeClient({ initialEmployees, shifts }: { initialEmployees: any[], shifts: any[] }) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    department: '',
    designation: '',
    shiftId: shifts.length > 0 ? shifts[0]._id : '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: '',
    isActive: true,
    profileImage: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    gender: '',
    role: 'employee',
  });

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (employee: any = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        password: '',
        phoneNumber: employee.phoneNumber || '',
        department: employee.department,
        designation: employee.designation,
        shiftId: employee.shiftId?._id || employee.shiftId || (shifts.length > 0 ? shifts[0]._id : ''),
        joiningDate: new Date(employee.joiningDate).toISOString().split('T')[0],
        monthlySalary: employee.monthlySalary.toString(),
        isActive: employee.isActive,
        profileImage: employee.profileImage || '',
        bankName: employee.bankName || '',
        accountNumber: employee.accountNumber || '',
        ifscCode: employee.ifscCode || '',
        gender: employee.gender || '',
        role: employee.role || 'employee',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
        department: '',
        designation: '',
        shiftId: shifts.length > 0 ? shifts[0]._id : '',
        joiningDate: new Date().toISOString().split('T')[0],
        monthlySalary: '',
        isActive: true,
        profileImage: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        gender: '',
        role: 'employee',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingEmployee 
        ? `/api/admin/employees/${editingEmployee._id}` 
        : '/api/admin/employees';
        
      const method = editingEmployee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      router.refresh(); 
      window.location.reload();
      
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const response = await fetch(`/api/admin/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to delete');
        return;
      }
      
      setEmployees(employees.filter(emp => emp._id !== id));
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Employees</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage your workforce here.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-700 rounded-md leading-5 bg-neutral-800 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Employee ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Shift
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <React.Fragment key={employee._id}>
                  <tr className="hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={() => setExpandedRowId(expandedRowId === employee._id ? null : employee._id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-bold overflow-hidden">
                          {employee.profileImage ? (
                            <img src={employee.profileImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            employee.name.charAt(0)
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{employee.name}</div>
                          <div className="text-sm text-neutral-500">{employee.email}</div>
                          {employee.phoneNumber && <div className="text-xs text-neutral-500">{employee.phoneNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-300">{employee.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-300">{employee.department}</div>
                      <div className="text-xs text-neutral-500">
                        {employee.designation}
                        {employee.role && employee.role !== 'employee' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 capitalize border border-neutral-700">
                            {employee.role.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {employee.shiftId ? employee.shiftId.shiftName : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(employee); }}
                          className="text-neutral-400 hover:text-white transition-colors p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(employee._id); }}
                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-neutral-400 hover:text-white transition-colors p-1"
                        >
                          {expandedRowId === employee._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRowId === employee._id && employee.leaveBalance && (
                    <tr className="bg-neutral-800/30">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg">
                            <div className="text-xs text-neutral-400 mb-1">Casual Leave</div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-lg font-semibold text-white">
                                {employee.leaveBalance.casualLeave.available} <span className="text-xs text-neutral-500 font-normal">avail</span>
                              </span>
                              <span className="text-xs text-neutral-500">{employee.leaveBalance.casualLeave.taken} booked</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg">
                            <div className="text-xs text-neutral-400 mb-1">Sick Leave</div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-lg font-semibold text-white">
                                {employee.leaveBalance.sickLeave.available} <span className="text-xs text-neutral-500 font-normal">avail</span>
                              </span>
                              <span className="text-xs text-neutral-500">{employee.leaveBalance.sickLeave.taken} booked</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg">
                            <div className="text-xs text-neutral-400 mb-1">Restricted Holiday</div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-lg font-semibold text-white">
                                {employee.leaveBalance.restrictedLeave.available} <span className="text-xs text-neutral-500 font-normal">avail</span>
                              </span>
                              <span className="text-xs text-neutral-500">{employee.leaveBalance.restrictedLeave.taken} booked</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg">
                            <div className="text-xs text-neutral-400 mb-1">Compensatory Off</div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-lg font-semibold text-white">
                                {employee.leaveBalance.compensatoryOff.available} <span className="text-xs text-neutral-500 font-normal">avail</span>
                              </span>
                              <span className="text-xs text-neutral-500">{employee.leaveBalance.compensatoryOff.taken} booked</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg">
                            <div className="text-xs text-neutral-400 mb-1">Leave Without Pay</div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-neutral-500">{employee.leaveBalance.leaveWithoutPay.taken} booked</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-neutral-950/75 backdrop-blur-sm z-0" onClick={closeModal} />

            <div className="relative z-10 inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
              <div className="flex justify-between items-center mb-5 border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="h-20 w-20 rounded-full border-2 border-neutral-700 bg-neutral-800 overflow-hidden flex items-center justify-center">
                      {formData.profileImage ? (
                        <img src={formData.profileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-8 w-8 text-neutral-500" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      Password {editingEmployee && <span className="text-neutral-500 text-xs">(Leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      required={!editingEmployee}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Gender</label>
                    <select
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Role</label>
                    <select
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                    >
                      <option value="employee">Employee</option>
                      <option value="team_head">Team Head</option>
                      <option value="manager">Manager</option>
                      <option value="department_head">Department Head</option>
                      <option value="director">Director</option>
                      <option value="admin">Admin</option>
                      <option value="company_admin">Company Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Department</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Shift</label>
                    <select
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.shiftId}
                      onChange={(e) => setFormData({...formData, shiftId: e.target.value})}
                      required
                    >
                      <option value="">Select a shift</option>
                      {shifts.map(s => (
                        <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Joining Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      required
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.monthlySalary}
                      onChange={(e) => setFormData({...formData, monthlySalary: e.target.value})}
                    />
                  </div>
                  <div className="sm:col-span-2 pt-4 border-t border-neutral-800 mt-2">
                    <h4 className="text-sm font-medium text-white mb-4">Bank Details (Optional)</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Bank Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Account Number</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">IFSC Code</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={formData.ifscCode}
                          onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-blue-600 focus:ring-blue-600"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-neutral-300">
                      Active Employee
                    </label>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-neutral-800 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Employee'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-neutral-700 shadow-sm px-4 py-2 bg-neutral-800 text-base font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
