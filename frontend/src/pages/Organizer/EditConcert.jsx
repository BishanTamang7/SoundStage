import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";

const EditConcert = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tokens, user, role } = useAuth();
  const [tickets, setTickets] = useState([{ name: "", price: "", quantity: "" }]);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    date_time: "",
    venue: "",
    organizer_name: "",
    contact_email: "",
    main_artist: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  const toInputDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const addTicket = () => {
    setTickets((prev) => [...prev, { name: "", price: "", quantity: "" }]);
  };

  const removeTicket = (index) => {
    setTickets((prev) => {
      if (prev.length <= 1) {
        window.alert("You must have at least one ticket category!");
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateTicket = (index, field, value) => {
    setTickets((prev) =>
      prev.map((ticket, i) =>
        i === index ? { ...ticket, [field]: value } : ticket
      )
    );
  };

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
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
        setFormError("");
        const data = await api.getConcert(tokens.access, id);
        const payload = data?.data || data;
        if (!payload) {
          if (isActive) setFormError("Concert not found.");
          return;
        }
        if (isActive) {
          setFormState({
            title: payload.title || "",
            description: payload.description || "",
            date_time: toInputDateTime(payload.date_time),
            venue: payload.venue || "",
            organizer_name: payload.organizer_name || "",
            contact_email: payload.contact_email || "",
            main_artist: payload.main_artist || "",
          });
          const ticketList = Array.isArray(payload.ticket_categories)
            ? payload.ticket_categories
            : [];
          setTickets(
            ticketList.length > 0
              ? ticketList.map((ticket) => ({
                  name: ticket?.name || "",
                  price: ticket?.price ?? "",
                  quantity: ticket?.quantity ?? "",
                }))
              : [{ name: "", price: "", quantity: "" }]
          );
        }
      } catch (error) {
        if (isActive) {
          setFormError(error?.message || "Failed to load concert.");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadConcert();

    return () => {
      isActive = false;
    };
  }, [id, tokens?.access]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!tokens?.access) {
      setFormError("You must be logged in as an organizer.");
      return;
    }

    const payload = {
      title: formState.title,
      description: formState.description,
      date_time: formState.date_time,
      venue: formState.venue,
      organizer_name: formState.organizer_name,
      contact_email: formState.contact_email,
      main_artist: formState.main_artist,
      ticket_categories: tickets.map((ticket) => ({
        name: ticket.name,
        price: parseFloat(ticket.price || 0),
        quantity: parseInt(ticket.quantity || 0, 10),
      })),
    };

    try {
      setSubmitting(true);
      await api.updateConcert(tokens.access, id, payload);
      navigate(`/organizer/concerts/${id}`);
    } catch (error) {
      setFormError(error?.message || "Failed to update concert.");
    } finally {
      setSubmitting(false);
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
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer"
          >
            Dashboard
          </Link>
          <Link
            className="border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-base font-semibold text-[#7C3AED]"
            to="/organizer/concerts"
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
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black text-[#312E81]">Edit Concert</h1>
          <p className="font-semibold text-[#6B7280]">
            Update the details of your concert event
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading concert...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError ? (
              <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
                {formError}
              </div>
            ) : null}

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                1. Basic Info
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="concert-title"
                    className="text-sm font-bold text-[#312E81]"
                  >
                    Concert Title <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="concert-title"
                    name="concert-title"
                    type="text"
                    required
                    placeholder="e.g., Rock Night 2026"
                    value={formState.title}
                    onChange={handleFieldChange("title")}
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-bold text-[#312E81]"
                  >
                    Description <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    placeholder="Tell attendees about your concert..."
                    value={formState.description}
                    onChange={handleFieldChange("description")}
                    className="mt-2 min-h-30 w-full resize-y rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="date-time"
                    className="text-sm font-bold text-[#312E81]"
                  >
                    Date &amp; Time <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="date-time"
                    name="date-time"
                    type="datetime-local"
                    required
                    value={formState.date_time}
                    onChange={handleFieldChange("date_time")}
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>

                <div>
                  <label htmlFor="venue" className="text-sm font-bold text-[#312E81]">
                    Venue/Location <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="venue"
                    name="venue"
                    type="text"
                    required
                    placeholder="e.g., Kathmandu Valley Concert Hall"
                    value={formState.venue}
                    onChange={handleFieldChange("venue")}
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                2. Organizer Info
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="organizer-name"
                    className="text-sm font-bold text-[#312E81]"
                  >
                    Organizer Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="organizer-name"
                    name="organizer-name"
                    type="text"
                    required
                    placeholder="e.g., SoundStage Events"
                    value={formState.organizer_name}
                    onChange={handleFieldChange("organizer_name")}
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="text-sm font-bold text-[#312E81]"
                  >
                    Contact Email <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="contact-email"
                    type="email"
                    required
                    placeholder="contact@example.com"
                    value={formState.contact_email}
                    onChange={handleFieldChange("contact_email")}
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                3. Artist
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label
                    htmlFor="main-artist"
                    className="text-sm font-bold text-[#312E81]"
                  >
                    Main Artist <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="main-artist"
                    name="main-artist"
                    type="text"
                    required
                    placeholder="e.g., The Rockers Band"
                    value={formState.main_artist}
                    onChange={handleFieldChange("main_artist")}
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                4. Ticket Categories
              </h2>
              <div className="flex flex-col gap-4">
                {tickets.map((ticket, index) => (
                  <div
                    key={`ticket-${index}`}
                    className="grid grid-cols-1 items-end gap-4 rounded-lg bg-[#F3F4F6] p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
                  >
                    <div>
                      <label className="text-sm font-bold text-[#312E81]">
                        Ticket Type <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., VIP, Regular, Student"
                        value={ticket.name}
                        onChange={(event) =>
                          updateTicket(index, "name", event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#312E81]">
                        Price (Rs) <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="500"
                        value={ticket.price}
                        onChange={(event) =>
                          updateTicket(index, "price", event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[#312E81]">
                        Quantity <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="100"
                        value={ticket.quantity}
                        onChange={(event) =>
                          updateTicket(index, "quantity", event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTicket(index)}
                      className="rounded-lg border border-[#EF4444] bg-white px-4 py-3 text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTicket}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#7C3AED] bg-white px-6 py-3 text-sm font-bold text-[#7C3AED] transition hover:bg-[#F3F4F6]"
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
                Add Another Ticket Type
              </button>
            </section>

            <div className="flex flex-col-reverse gap-4 md:flex-row md:justify-end">
              <Link
                to="/organizer/concerts"
                className="inline-flex justify-center rounded-lg border border-[#E5E7EB] bg-white px-8 py-3 text-sm font-bold text-[#6B7280] transition hover:bg-[#F3F4F6]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center rounded-lg bg-[#7C3AED] px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4F46E5]"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default EditConcert;
