import { useUser } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

export type AppRole = 'super_admin' | 'department_head' | 'supervisor' | 'user';

export default function RoleRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode, 
  allowedRoles: AppRole[] 
}) {
  const { user, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) return <div>Loading...</div>;

  const userRole = (user?.publicMetadata.role as AppRole) || 'user';

  if (!user || !allowedRoles.includes(userRole)) {
    // Redirect based on actual role if they tried to access a forbidden path
    const targetPath = userRole === 'super_admin' ? '/admin/dashboard' :
                       userRole === 'department_head' ? '/department/dashboard' :
                       userRole === 'supervisor' ? '/supervisor/dashboard' : '/attendance';
    
    return <Navigate to={targetPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
