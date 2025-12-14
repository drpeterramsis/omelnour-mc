import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      if (allowedRoles) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        // If no profile found, assume minimal access or handle specifically. 
        // Here we default to 'patient' if not found for demo continuity
        const userRole = profile?.role || 'patient';

        if (allowedRoles.includes(userRole as UserRole)) {
            setAuthorized(true);
        } else {
            setAuthorized(false);
        }
      } else {
          // If no specific roles required, just being logged in is enough
          setAuthorized(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, [allowedRoles]);

  if (loading) return <div className="p-10 text-center">جاري التحقق من الصلاحيات...</div>;

  return authorized ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;