import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '../pages/public/Landing'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import User1Home from '../pages/user1/User1Home'
import User2Home from '../pages/user2/User2Home'
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
          path="/user1/*"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.USER1]}>
                <User1Home />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Protected Routes for User2 */}
        <Route
          path="/user2/*"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.USER2]}>
                <User2Home />
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