import { UserButton, useUser } from "@clerk/clerk-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, BarChart3, Settings, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout() {
  const { user } = useUser();
  const location = useLocation();
  const userRole = (user?.publicMetadata.role as string) || 'user';

  const navigation = [
    { name: 'Dashboard', href: `/${userRole === 'super_admin' ? 'admin' : userRole === 'department_head' ? 'department' : 'supervisor'}/dashboard`, icon: LayoutDashboard, roles: ['super_admin', 'department_head', 'supervisor'] },
    { name: 'Attendance', href: '/attendance', icon: ClipboardCheck, roles: ['user', 'super_admin', 'department_head', 'supervisor'] },
    { name: 'Create Form', href: '/attendance/form/create', icon: PlusCircle, roles: ['super_admin', 'department_head', 'supervisor'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['super_admin', 'department_head'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-violet-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-green-400" />
            SmartAttend
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location.pathname === item.href 
                  ? "bg-violet-800 text-white" 
                  : "text-violet-200 hover:bg-violet-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-violet-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton afterSignOutUrl="/login" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.fullName}</span>
              <span className="text-xs text-violet-400 capitalize">{userRole.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 py-4 px-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-violet-900">
              {filteredNav.find(n => n.href === location.pathname)?.name || 'Attendance System'}
            </h2>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

