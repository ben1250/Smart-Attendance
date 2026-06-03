import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AttendanceForm from '@/pages/AttendanceForm'
import Analytics from '@/pages/Analytics'

function App() {
  return (
    <Routes>
      <Route
        path="/login/*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <SignedOut>
              <SignIn routing="path" path="/login" signUpUrl="/register" />
            </SignedOut>
            <SignedIn>
              <Navigate to="/" replace />
            </SignedIn>
          </div>
        }
      />
      <Route
        path="/register/*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <SignedOut>
              <SignUp routing="path" path="/register" signInUrl="/login" />
            </SignedOut>
            <SignedIn>
              <Navigate to="/" replace />
            </SignedIn>
          </div>
        }
      />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <>
            <SignedIn>
              <Layout />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<AttendanceForm />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings module coming soon...</div>} />
      </Route>
    </Routes>
  )
}

export default App
