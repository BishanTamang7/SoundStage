import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from '../pages/public/Landing'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import OrganizerHome from '../pages/Organizer/OrganizerHome'
import AttendeeHome from '../pages/Attendee/AttendeeHome'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import { ROLES } from '../utils/roles'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}> 
        <Route element={<RoleRoute allowedRoles={[ROLES.ORGANIZER]} />}> 
          <Route path="/organizer" element={<OrganizerHome />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={[ROLES.ATTENDEE]} />}>
          <Route path="/attendee" element={<AttendeeHome />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
