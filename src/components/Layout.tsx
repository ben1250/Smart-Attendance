import { UserButton, useUser } from "@clerk/clerk-react";
import { Link, Outlet } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8" />
            SmartAttend
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton afterSignOutUrl="/login" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{user?.fullName}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.publicMetadata.role as string || 'User'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 py-4 px-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Attendance Management</h2>
            <div className="flex items-center gap-4">
              {/* Notifications or Search could go here */}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
