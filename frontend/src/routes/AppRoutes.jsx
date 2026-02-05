import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from '../pages/public/Landing'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import OrganizerHome from '../pages/Organizer/OrganizerHome'
import MyConcerts from '../pages/Organizer/MyConcerts'
import CreateConcert from '../pages/Organizer/CreateConcert'
import ViewConcert from '../pages/Organizer/ViewConcert'
import AttendeeHome from '../pages/Attendee/AttendeeHome'
import Bookings from '../pages/Attendee/Bookings'
import BrowseConcerts from '../pages/Attendee/BrowseConcerts'
import MyTickets from '../pages/Attendee/MyTickets'
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
          <Route path="/organizer/concerts" element={<MyConcerts />} />
          <Route path="/organizer/concerts/new" element={<CreateConcert />} />
          <Route path="/organizer/concerts/:id" element={<ViewConcert />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={[ROLES.ATTENDEE]} />}>
          <Route path="/attendee" element={<AttendeeHome />} />
          <Route path="/attendee/concerts" element={<BrowseConcerts />} />
          <Route path="/attendee/tickets" element={<MyTickets />} />
          <Route path="/attendee/bookings" element={<Bookings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
