import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ redirectTo = '/' }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="route-loader">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
