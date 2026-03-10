import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from '../pages/public/Landing'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import VerifyEmail from '../pages/public/VerifyEmail'
import ForgotPassword from '../pages/public/ForgotPassword'
import ResetPassword from '../pages/public/ResetPassword'
import About from '../pages/public/About'
import Privacy from '../pages/public/Privacy'
import Terms from '../pages/public/Terms'
import OrganizerHome from '../pages/Organizer/OrganizerHome'
import MyConcerts from '../pages/Organizer/MyConcerts'
import CreateConcert from '../pages/Organizer/CreateConcert'
import ViewConcert from '../pages/Organizer/ViewConcert'
import EditConcert from '../pages/Organizer/EditConcert'
import Tickets from '../pages/Organizer/Tickets'
import ConfirmTicket from '../pages/Organizer/ConfirmTicket'
import Bookings from '../pages/Organizer/Bookings'
import Analytics from '../pages/Organizer/Analytics'
import OrganizerProfile from '../pages/Organizer/Profile'
import Settings from '../pages/Organizer/Settings'
import AttendeeHome from '../pages/Attendee/AttendeeHome'
import BrowseConcerts from '../pages/Attendee/BrowseConcerts'
import Checkout from '../pages/Attendee/Checkout'
import KhaltiCallback from '../pages/Attendee/KhaltiCallback'
import ConcertDetails from '../pages/Attendee/ConcertDetails'
import MyTickets from '../pages/Attendee/MyTickets'
import AttendeeAbout from '../pages/Attendee/AttendeeAbout'
import AttendeeProfile from '../pages/Attendee/AttendeeProfile'
import AttendeeSettings from '../pages/Attendee/AttendeeSettings'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import { ROLES } from '../utils/roles'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}> 
        <Route element={<RoleRoute allowedRoles={[ROLES.ORGANIZER]} />}> 
          <Route path="/organizer" element={<OrganizerHome />} />
          <Route path="/organizer/concerts" element={<MyConcerts />} />
          <Route path="/organizer/concerts/new" element={<CreateConcert />} />
          <Route path="/organizer/concerts/:id/edit" element={<EditConcert />} />
          <Route path="/organizer/concerts/:id" element={<ViewConcert />} />
          <Route path="/organizer/tickets" element={<Tickets />} />
          <Route path="/organizer/confirm-ticket" element={<ConfirmTicket />} />
          <Route path="/organizer/bookings" element={<Bookings />} />
          <Route path="/organizer/analytics" element={<Analytics />} />
          <Route path="/organizer/profile" element={<OrganizerProfile />} />
          <Route path="/organizer/settings" element={<Settings />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={[ROLES.ATTENDEE]} />}>
          <Route path="/attendee" element={<AttendeeHome />} />
          <Route path="/attendee/concerts" element={<BrowseConcerts />} />
          <Route path="/attendee/concerts/:id" element={<ConcertDetails />} />
          <Route path="/attendee/checkout/:id" element={<Checkout />} />
          <Route path="/attendee/payment/khalti/callback" element={<KhaltiCallback />} />
          <Route path="/attendee/tickets" element={<MyTickets />} />
          <Route path="/attendee/about" element={<AttendeeAbout />} />
          <Route path="/attendee/profile" element={<AttendeeProfile />} />
          <Route path="/attendee/settings" element={<AttendeeSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
