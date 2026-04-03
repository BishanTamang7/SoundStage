import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { api, resolveMediaUrl } from '../../services/api'
import OrganizerSidebar from '../../components/OrganizerSidebar'
import { getVenueParts } from '../../utils/concerts'
import { formatDateTime } from '../../utils/formatters'

const MyConcerts = () => {
  const { tokens } = useAuth()
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('upcoming') // all | upcoming | past

  const emojiSet = useMemo(() => ['🎸', '🎤', '🎹', '🎵', '🥁', '🎺', '🎷', '🎻'], [])

  useEffect(() => {
    let isActive = true

    const loadConcerts = async () => {
      if (!tokens?.access) {
        if (isActive) setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await api.organizerConcerts(tokens.access)
        const list = data?.data?.concerts || data?.concerts || []
        if (isActive) setConcerts(Array.isArray(list) ? list : [])
      } catch (err) {
        if (isActive) setError(err?.message || 'Failed to load concerts.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadConcerts()

    return () => {
      isActive = false
    }
  }, [tokens?.access])

  const handleDelete = async (concertId) => {
    if (!tokens?.access) return
    try {
      setDeletingId(concertId)
      await api.deleteConcert(tokens.access, concertId)
      setConcerts((prev) => prev.filter((item) => item.id !== concertId))
    } catch (err) {
      setError(err?.message || 'Failed to delete concert.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredConcerts = useMemo(() => {
    const now = new Date()
    return concerts.filter((concert) => {
      if (!concert?.date_time) return statusFilter === 'all'
      const dt = new Date(concert.date_time)
      if (Number.isNaN(dt.getTime())) return statusFilter === 'all'
      if (statusFilter === 'upcoming') return dt >= now
      if (statusFilter === 'past') return dt < now
      return true
    })
  }, [concerts, statusFilter])

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 px-12 py-8 max-[1024px]:px-6 max-[768px]:ml-0 max-[768px]:px-4">
        <header className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-[#312E81]">My Concerts</h1>
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                Create and manage your concert events.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1">
                {['all', 'upcoming', 'past'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition ${
                      statusFilter === value
                        ? 'bg-[#7C3AED] text-white shadow-sm'
                        : 'text-[#312E81] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#4F46E5]"
                to="/organizer/concerts/new"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create New Concert
              </Link>
            </div>
          </div>

        </header>

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading concerts...
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-6 text-sm text-[#B91C1C]"
            role="alert"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg font-black">!</span>
                <div>
                  <div className="text-base font-black text-[#B91C1C]">Action blocked</div>
                  <p className="mt-1 font-semibold leading-6">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="rounded-md px-2 py-1 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2]"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          </div>
        ) : filteredConcerts.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <div className="text-5xl">🎵</div>
            <h2 className="mt-4 text-2xl font-black text-[#312E81]">No Concerts Yet</h2>
            <p className="mt-2 text-sm font-semibold text-[#6B7280]">
              Create your first concert to get started!
            </p>
            <Link
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#4F46E5]"
              to="/organizer/concerts/new"
            >
              Create New Concert
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 min-[640px]:grid-cols-1 min-[900px]:grid-cols-2 min-[1200px]:grid-cols-3">
            {filteredConcerts.map((concert, index) => {
              const { venueName, city } = getVenueParts(concert.venue || '')
              const isPastConcert = (() => {
                const dt = new Date(concert.date_time)
                return !Number.isNaN(dt.getTime()) && dt < new Date()
              })()
              return (
                <div
                  key={concert.id}
                  className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(49,46,129,0.12)]"
                >
                {concert.cover_image ? (
                  <div className="h-40 w-full bg-[#F3F4F6]">
                    <img
                      src={resolveMediaUrl(concert.cover_image)}
                      alt={`${concert.title || 'Concert'} cover`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-linear-to-br from-[#7C3AED] to-[#4F46E5] text-5xl">
                    {emojiSet[index % emojiSet.length]}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-black text-[#312E81]">{concert.title}</h3>

                  <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDateTime(concert.date_time, { separator: ' • ' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{venueName || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🏙️</span>
                      <span>{city || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎤</span>
                      <span>{concert.main_artist || 'TBD'}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 border-t border-[#E5E7EB] pt-4">
                    <Link
                      to={`/organizer/concerts/${concert.id}`}
                      className="flex-1 rounded-lg bg-[#7C3AED] px-4 py-2 text-center text-xs font-bold text-white transition hover:bg-[#4F46E5]"
                    >
                      View
                    </Link>
                    {!isPastConcert ? (
                      <Link
                        to={`/organizer/concerts/${concert.id}/edit`}
                        className="flex-1 rounded-lg border border-[#7C3AED] px-4 py-2 text-center text-xs font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
                      >
                        Edit
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(concert)}
                      disabled={deletingId === concert.id}
                      className={`flex-1 rounded-lg border px-4 py-2 text-center text-xs font-bold transition ${
                        deletingId === concert.id
                          ? 'cursor-not-allowed border-[#FCA5A5] text-[#FCA5A5]'
                          : 'border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2]'
                      }`}
                    >
                      {deletingId === concert.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </main>

      {confirmTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-[#312E81]">Delete Concert</h3>
            <p className="mt-2 text-sm font-semibold text-[#6B7280]">
              Are you sure you want to delete{' '}
              <span className="font-bold text-[#312E81]">{confirmTarget.title}</span>? This action
              cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-bold text-[#6B7280] transition hover:bg-[#F3F4F6]"
                onClick={() => setConfirmTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-[#EF4444] bg-[#EF4444] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#DC2626]"
                onClick={() => {
                  const targetId = confirmTarget.id
                  setConfirmTarget(null)
                  handleDelete(targetId)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MyConcerts
