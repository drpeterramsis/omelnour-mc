import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, Permissions } from '../types';
import { useLanguage } from '../App';

export const Admin: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
      const data = await db.users.getAll();
      setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const togglePermission = async (user: User, key: keyof Permissions) => {
    const updatedUser = {
      ...user,
      permissions: {
        ...user.permissions,
        [key]: !user.permissions[key]
      }
    };
    await db.users.update(updatedUser);
    await loadUsers();
  };

  const getPermissionLabel = (key: keyof Permissions) => {
      switch(key) {
          case 'can_manage_doctors': return t.permissions.manageDoctors;
          case 'can_manage_schedules': return t.permissions.manageSchedules;
          case 'can_manage_appointments': return t.permissions.manageAppointments;
          case 'can_manage_exceptions': return t.permissions.manageExceptions;
          case 'can_manage_clinics': return t.permissions.manageClinics;
          case 'can_view_admin_panel': return t.permissions.viewAdmin;
          default: return key;
      }
  };

  const permissionKeys: Array<keyof Permissions> = [
      'can_manage_doctors', 'can_manage_schedules', 'can_manage_appointments', 
      'can_manage_exceptions', 'can_manage_clinics', 'can_view_admin_panel'
  ];

  return (
    <div className="space-y-6 font-sans">
       <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">{t.adminControl}</h2>
       <p className="text-gray-500">{t.adminDesc}</p>

       <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase">{t.user}</th>
               <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase">{t.role}</th>
               {permissionKeys.map(key => (
                 <th key={key} className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase writing-mode-vertical rotate-180">
                    <span className="block w-24 truncate" title={getPermissionLabel(key)}>{getPermissionLabel(key)}</span>
                 </th>
               ))}
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {users.map(user => (
               <tr key={user.id} className="hover:bg-gray-50">
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-gray-900">{user.name}</div>
                   <div className="text-xs text-gray-500">{user.email}</div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">{user.role}</span>
                 </td>
                 {permissionKeys.map(key => (
                   <td key={key} className="px-2 py-4 text-center">
                     <input 
                        type="checkbox" 
                        checked={user.permissions[key]} 
                        onChange={() => togglePermission(user, key)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                        disabled={user.role === 'ADMIN' && key === 'can_view_admin_panel'} // Prevent admin lockout
                     />
                   </td>
                 ))}
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );
};