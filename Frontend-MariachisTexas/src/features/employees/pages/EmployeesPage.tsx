
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { User } from '@/types';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';

// Componentes Modulares
import { EmployeesTable } from '../components/EmployeesTable';
import { EmployeeCreateModal } from '../components/EmployeeCreateModal';
import { EmployeeEditModal } from '../components/EmployeeEditModal';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  // Confirmación Borrado
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, empId: string | null}>({
      isOpen: false,
      empId: null
  });

  // Notificaciones Toast
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(error);
      showNotification("Error cargando empleados.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // CRUD Handlers
  const handleCreateEmployee = async (employeeData: any) => {
    try {
        const newEmp = await employeeService.createEmployee(employeeData);
        setEmployees(prev => [newEmp, ...prev]);
        showNotification('Nuevo empleado registrado exitosamente.');
        setIsCreateOpen(false);
    } catch (error: any) {
      console.error('Error al crear empleado:', error);
      throw error; // Re-throw to allow modal to catch it
    }
  };

  const handleUpdateEmployee = async (employeeData: any) => {
    if (!selectedEmployee) return;
    try {
        const updated = await employeeService.updateEmployee(selectedEmployee.id, employeeData);
        setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
        showNotification('Empleado actualizado exitosamente.');
        setIsEditOpen(false);
    } catch (error: any) {
        console.error('Error al actualizar empleado:', error);
        throw error; // Re-throw to allow modal to catch it
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.empId) return;
    try {
        await employeeService.deleteEmployee(deleteModal.empId);
        setEmployees(prev => prev.filter(e => e.id !== deleteModal.empId));
        showNotification('Empleado eliminado del sistema.');
    } catch (error) {
        console.error(error);
        showNotification("No se pudo eliminar el empleado.", "error");
    }
  };

  const handleToggleStatus = async (employee: User) => {
    const newStatus = !employee.isActive;
    try {
        setEmployees(prev => prev.map(e => e.id === employee.id ? { ...e, isActive: newStatus } : e));
        await employeeService.updateEmployee(employee.id, { isActive: newStatus });
        showNotification(`Empleado ${newStatus ? 'activado' : 'desactivado'} correctamente.`);
    } catch (error: any) {
        console.error(error);
        fetchEmployees();
        const msg = error?.response?.data?.message || error?.message || 'Error al cambiar el estado.';
        showNotification(msg, "error");
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.documentNumber.includes(searchTerm) ||
    emp.mainInstrument?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* Toast Notification */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
                notification.type === 'success' 
                ? 'bg-white/95 border-emerald-100 shadow-emerald-900/5' 
                : 'bg-white/95 border-red-100 shadow-red-900/5'
            }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>
                        {notification.type === 'success' ? '¡Excelente!' : '¡Atención!'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Empleados</h1>
          <p className="text-slate-500 mt-2 text-sm">Administra músicos y staff operativo.</p>
        </div>
        <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
        >
          <Plus size={18} strokeWidth={3} />
          Crear Empleado
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-8 pb-0">
            <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, documento o instrumento..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                />
            </div>
        </div>

        {/* Tabla Modular */}
        <EmployeesTable 
            employees={filteredEmployees}
            loading={loading}
            onView={(emp) => { setSelectedEmployee(emp); setIsDetailOpen(true); }}
            onEdit={(emp) => { setSelectedEmployee(emp); setIsEditOpen(true); }}
            onDelete={(id) => setDeleteModal({ isOpen: true, empId: id })}
            onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Modales Modulares */}
      <EmployeeCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateEmployee}
      />

      <EmployeeEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateEmployee}
        employee={selectedEmployee}
      />

      <EmployeeDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        employee={selectedEmployee}
      />

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar Empleado?"
        message="Estás a punto de eliminar este empleado. Perderás su historial y datos musicales. Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
