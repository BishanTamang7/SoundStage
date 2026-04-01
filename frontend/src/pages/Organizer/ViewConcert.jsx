import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { getVenueParts } from "../../utils/concerts";
import { formatDateTime } from "../../utils/formatters";

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

      <main className="ml-60 max-w-4xl px-12 py-8 md:px-6 max-[768px]:ml-0 max-[768px]:px-4 xl:mx-auto">
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
          <>
            <section className="mb-6 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
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

            <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h1 className="mb-6 text-3xl font-black text-[#312E81]">
                {concert.title || "Untitled Concert"}
              </h1>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Date &amp; Time</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {formatDateTime(concert.date_time, {
                      dateOptions: { month: "long", day: "numeric", year: "numeric" },
                      separator: " • ",
                    })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">Venue</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {venueName || "TBD"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#6B7280]">City</span>
                  <span className="text-base font-bold text-[#312E81]">
                    {city || "TBD"}
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

            <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-4 text-xl font-black text-[#312E81]">Description</h2>
              <p className="text-sm font-medium leading-7 text-[#6B7280]">
                {concert.description || "No description provided."}
              </p>
            </section>

            <section className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-4 text-xl font-black text-[#312E81]">
                Ticket Categories
              </h2>
              {ticketCategories.length === 0 ? (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-6 text-sm font-semibold text-[#6B7280]">
                  No ticket categories available.
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketCategories.map((ticket) => (
                    <div
                      key={ticket.id || ticket.name}
                      className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFF] p-5"
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

          </>
        )}
      </main>
    </div>
  );
};

export default ViewConcert;
