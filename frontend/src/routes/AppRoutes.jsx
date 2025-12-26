import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '../pages/public/Landing'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import OrganizerHome from '../pages/Organizer/OrganizerHome'
import AttendeeHome from '../pages/Attendee/AttendeeHome'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import { ROLES } from '../utils/roles'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes for User1 */}
        <Route
          path="/Organizer/*"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.ORGANIZER]}>
                <OrganizerHome />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Protected Routes for User2 */}
        <Route
          path="/Attendee/*"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.ATTENDEE]}>
                <AttendeeHome />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<div className="text-center mt-20"><h1 className="text-4xl font-bold">404 - Page Not Found</h1></div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes