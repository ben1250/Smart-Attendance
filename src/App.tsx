import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AttendanceForm from '@/pages/AttendanceForm'
import Analytics from '@/pages/Analytics'
import RoleRoute from '@/components/RoleRoute'
import FormBuilder from '@/pages/FormBuilder'

function App() {
  return (
    <Routes>
      <Route path="/login/*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <SignedOut><SignIn routing="path" path="/login" signUpUrl="/register" /></SignedOut>
          <SignedIn><Navigate to="/" replace /></SignedIn>
        </div>
      } />
      
      <Route path="/register/*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <SignedOut><SignUp routing="path" path="/register" signInUrl="/login" /></SignedOut>
          <SignedIn><Navigate to="/" replace /></SignedIn>
        </div>
      } />
      
      {/* Protected Routes with RBAC */}
      <Route path="/" element={<SignedIn><Layout /></SignedIn>}>
        <Route index element={<Navigate to="/attendance" replace />} />
        
        {/* Admin Dashboard */}
        <Route path="admin/dashboard" element={
          <RoleRoute allowedRoles={['super_admin']}><Dashboard role="admin" /></RoleRoute>
        } />

        {/* Dept Head Dashboard */}
        <Route path="department/dashboard" element={
          <RoleRoute allowedRoles={['department_head', 'super_admin']}><Dashboard role="department" /></RoleRoute>
        } />

        {/* Supervisor Dashboard */}
        <Route path="supervisor/dashboard" element={
          <RoleRoute allowedRoles={['supervisor', 'department_head', 'super_admin']}><Dashboard role="supervisor" /></RoleRoute>
        } />

        <Route path="attendance" element={<AttendanceForm />} />
        <Route path="attendance/form/create" element={
          <RoleRoute allowedRoles={['supervisor', 'department_head', 'super_admin']}><FormBuilder /></RoleRoute>
        } />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default App
