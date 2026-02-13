import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";

const ViewConcert = () => {
  const { id } = useParams();
  const { tokens, user, role } = useAuth();
  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const displayName = user?.username || user?.email || "User";
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
  const initialsSource = user?.username || user?.email || "";
  const getInitials = (value) => {
    if (!value) return "UU";
    const base = value.split("@")[0];
    const parts = base.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };
  const initials = getInitials(initialsSource);

  const formatDateTime = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";
    const datePart = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
    const timePart = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
    return `${datePart} • ${timePart}`;
  };

  useEffect(() => {
    let isActive = true;

    const loadConcert = async () => {
      if (!tokens?.access || !id) {
        if (isActive) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await api.getConcert(tokens.access, id);
        const payload = data?.data || data;
        if (isActive) setConcert(payload || null);
      } catch (err) {
        if (isActive) setError(err?.message || "Failed to load concert.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadConcert();

    return () => {
      isActive = false;
    };
  }, [id, tokens?.access]);

  const ticketCategories = useMemo(() => {
    if (!concert?.ticket_categories) return [];
    return Array.isArray(concert.ticket_categories) ? concert.ticket_categories : [];
  }, [concert]);

  const handleVerifyTicket = async () => {
    if (!tokens?.access) return;
    if (!qrToken.trim()) {
      setVerifyError("Please enter a QR token.");
      return;
    }

    try {
      setVerifyLoading(true);
      setVerifyError("");
      setVerifyResult(null);
      const response = await api.verifyTicket(tokens.access, { qr_token: qrToken.trim() });
      setVerifyResult(response);
    } catch (err) {
      setVerifyError(err?.message || "Failed to verify ticket.");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['DM_Sans'] text-[#312E81]">
      <aside className="fixed left-0 top-0 z-10 h-screen w-60 border-r border-[#E5E7EB] bg-white py-6">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">
          SoundStage
        </div>

        <nav className="flex flex-col">
          <Link
            to="/organizer"
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
          >
            Dashboard
          </Link>
          <Link
            to="/organizer/concerts"
            className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]"
          >
            My Concerts
          </Link>
          {["Tickets", "Scan QR", "Analytics", "Settings"].map((item) => (
            <a
              key={item}
              className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
              href="#"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.12)] bg-[#F3F4F6] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-extrabold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold leading-tight">{displayName}</div>
            <div className="mt-0.5 text-xs font-bold text-[#6B7280]">
              {displayRole}
            </div>
          </div>
          <a
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]"
            href="/"
            title="Logout"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </a>
        </div>
      </aside>

      <main className="ml-60 max-w-5xl px-12 py-8 md:px-6">
        <Link
          to="/organizer/concerts"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6B7280] transition hover:text-[#7C3AED]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to My Concerts
        </Link>

        {loading ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading concert...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : !concert ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Concert not found.
          </div>
        ) : (
          <>
            <section className="mb-8 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
              <div className="relative h-64 bg-[#F3F4F6] sm:h-72">
                {concert.cover_image ? (
                  <img
                    src={concert.cover_image}
                    alt={`${concert.title || "Concert"} cover`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-semibold text-[#9CA3AF]">
                    No cover image uploaded.
                  </div>
                )}
              </div>
            </section>

            <section className="mb-8 rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h1 className="mb-6 text-3xl font-black text-[#312E81]">
                {concert.title || "Untitled Concert"}
              </h1>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Date &amp; Time</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {formatDateTime(concert.date_time)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Venue</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {concert.venue || "TBD"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Main Artist</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {concert.main_artist || "TBD"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Organizer</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {concert.organizer_name || "TBD"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Contact Email</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {concert.contact_email || "TBD"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Contact Phone</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {concert.contact_phone || "TBD"}
                  </span>
                </div>
              </div>
            </section>

            <section className="mb-8 rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-4 text-xl font-black text-[#312E81]">Description</h2>
              <p className="text-sm font-medium leading-7 text-[#6B7280]">
                {concert.description || "No description provided."}
              </p>
            </section>

            <section className="mb-8 rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-4 text-xl font-black text-[#312E81]">
                Ticket Categories
              </h2>
              {ticketCategories.length === 0 ? (
                <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-6 text-sm font-semibold text-[#6B7280]">
                  No ticket categories available.
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketCategories.map((ticket) => (
                    <div
                      key={ticket.id || ticket.name}
                      className="rounded-lg bg-[#F3F4F6] p-5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-lg font-black text-[#312E81]">
                          {ticket.name || "Ticket"}
                        </span>
                        <span className="text-xl font-black text-[#7C3AED]">
                          Rs {ticket.price ?? 0}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#6B7280]">
                        Quantity: {ticket.quantity ?? 0} tickets
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-4 text-xl font-black text-[#312E81]">Scan / Verify QR</h2>
              <p className="mb-4 text-sm font-semibold text-[#6B7280]">
                Paste the attendee QR token to validate entry for this concert.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={qrToken}
                  onChange={(event) => setQrToken(event.target.value)}
                  placeholder="Enter QR token"
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                />
                <button
                  type="button"
                  onClick={handleVerifyTicket}
                  disabled={verifyLoading}
                  className="rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifyLoading ? "Verifying..." : "Verify"}
                </button>
              </div>

              {verifyError ? (
                <div className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
                  {verifyError}
                </div>
              ) : null}

              {verifyResult ? (
                <div className="mt-4 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#166534]">
                  <p>{verifyResult?.message || "Ticket validated."}</p>
                  <p className="mt-1 text-xs font-medium text-[#166534]">
                    Attendee: {verifyResult?.data?.attendee_name || "-"} ({verifyResult?.data?.attendee_email || "-"})
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#166534]">
                    Ticket: {verifyResult?.data?.ticket_type || "-"} #{verifyResult?.data?.seat_number || "-"}
                  </p>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ViewConcert;
