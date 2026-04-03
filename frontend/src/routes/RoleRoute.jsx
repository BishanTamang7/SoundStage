import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const RoleRoute = ({ allowedRoles = [], redirectTo = '/' }) => {
  const { role, loading, isAuthenticated } = useAuth()

  if (loading) {
    return <div className="route-loader">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default RoleRoute
