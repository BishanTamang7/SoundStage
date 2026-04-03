import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { getVenueParts } from "../../utils/concerts";
import { formatDateTime } from "../../utils/formatters";

const InfoBlock = ({ label, value }) => (
  <div className="rounded-lg border border-[#E5E7EB] bg-[#FCFCFF] px-4 py-3">
    <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
    <p className="mt-1 text-sm font-semibold text-[#312E81]">{value}</p>
  </div>
);

const ViewConcert = () => {
  const { id } = useParams();
  const { tokens } = useAuth();
  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const list = Array.isArray(concert.ticket_categories)
      ? concert.ticket_categories
      : [];

    const priority = ["vip", "regular"];
    const withIndex = list.map((item, originalIndex) => ({ item, originalIndex }));

    withIndex.sort((a, b) => {
      const aName = String(a.item?.name || "").toLowerCase();
      const bName = String(b.item?.name || "").toLowerCase();
      const aPriority = priority.indexOf(aName);
      const bPriority = priority.indexOf(bName);

      const aScore = aPriority === -1 ? priority.length : aPriority;
      const bScore = bPriority === -1 ? priority.length : bPriority;

      if (aScore !== bScore) return aScore - bScore;
      return a.originalIndex - b.originalIndex;
    });

    return withIndex.map(({ item }) => item);
  }, [concert]);
  const { venueName, city } = getVenueParts(concert?.venue || "");

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['DM_Sans'] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 max-w-5xl px-12 py-8 md:px-6 max-[768px]:ml-0 max-[768px]:px-4 xl:mx-auto">
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
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading concert...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-6 py-10 text-center text-sm font-semibold text-[#B91C1C]">
            {error}
          </div>
        ) : !concert ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Concert not found.
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(49,46,129,0.08)]">
            <div className="relative h-64 bg-[#F3F4F6] sm:h-80">
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
              <div className="absolute bottom-4 left-4 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B7280] backdrop-blur">
                {formatDateTime(concert.date_time, {
                  dateOptions: { month: "long", day: "numeric", year: "numeric" },
                  separator: " • ",
                }) || "Schedule TBD"}
              </div>
            </div>

            <div className="grid gap-8 p-8 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-black text-[#312E81]">
                    {concert.title || "Untitled Concert"}
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-[#6B7280]">
                    {concert.main_artist || "Main artist TBD"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoBlock label="Venue" value={venueName || "TBD"} />
                  <InfoBlock label="City" value={city || "TBD"} />
                  <InfoBlock label="Organizer" value={concert.organizer_name || "TBD"} />
                  <InfoBlock label="Contact Email" value={concert.contact_email || "TBD"} />
                  <InfoBlock label="Contact Phone" value={concert.contact_phone || "TBD"} />
                </div>

                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#9CA3AF]">
                    Description
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                    {concert.description || "No description provided."}
                  </p>
                </div>
              </div>

              <aside className="space-y-4 self-start rounded-xl border border-[#E5E7EB] bg-[#FCFCFF] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#312E81]">Ticket Categories</h2>
                  <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#4F46E5]">
                    {ticketCategories.length} Types
                  </span>
                </div>

                {ticketCategories.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-white px-4 py-5 text-xs font-semibold text-[#9CA3AF]">
                    No ticket categories available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ticketCategories.map((ticket) => (
                      <div
                        key={ticket.id || ticket.name}
                        className="flex items-start justify-between rounded-lg border border-[#E5E7EB] bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-black text-[#312E81]">
                            {ticket.name || "Ticket"}
                          </p>
                          <p className="text-xs font-semibold text-[#6B7280]">
                            Quantity: {ticket.quantity ?? 0}
                          </p>
                        </div>
                        <span className="text-base font-black text-[#7C3AED]">
                          Rs {ticket.price ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ViewConcert;
