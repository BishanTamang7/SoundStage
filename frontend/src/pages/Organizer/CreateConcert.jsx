import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";

const CreateConcert = () => {
  const navigate = useNavigate();
  const { tokens } = useAuth();
  const [tickets, setTickets] = useState([
    { name: "", price: "", quantity: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!tokens?.access) {
      setFormError("You must be logged in as an organizer.");
      return;
    }

    const formData = {
      title: event.target["concert-title"].value,
      description: event.target.description.value,
      date_time: event.target["date-time"].value,
      venue: event.target.venue.value,
      organizer_name: event.target["organizer-name"].value,
      contact_email: event.target["contact-email"].value,
      main_artist: event.target["main-artist"].value,
      ticket_categories: tickets.map((ticket) => ({
        name: ticket.name,
        price: parseFloat(ticket.price || 0),
        quantity: parseInt(ticket.quantity || 0, 10),
      })),
    };

    try {
      setSubmitting(true);
      await api.createConcert(tokens.access, formData);
      navigate("/organizer/concerts");
    } catch (error) {
      setFormError(error?.message || "Failed to create concert.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['DM_Sans'] text-[#312E81]">
      <aside className="fixed left-0 top-0 z-10 h-screen w-60 overflow-y-auto border-r border-[#E5E7EB] bg-white py-6">
        <div className="px-6 pb-6 font-['Playfair_Display'] text-2xl font-black text-[#7C3AED]">
          SoundStage
        </div>
        <nav className="flex flex-col">
          <a
            href="#"
            className="flex items-center gap-3 border-l-4 border-transparent px-6 py-3 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#7C3AED]"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 border-l-4 border-[#7C3AED] bg-[#F3F4F6] px-6 py-3 text-sm font-semibold text-[#7C3AED]"
          >
            My Concerts
          </a>
          <a
            href="#"
            className="flex items-center gap-3 border-l-4 border-transparent px-6 py-3 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#7C3AED]"
          >
            Tickets
          </a>
          <a
            href="#"
            className="flex items-center gap-3 border-l-4 border-transparent px-6 py-3 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#7C3AED]"
          >
            Scan QR
          </a>
          <a
            href="#"
            className="flex items-center gap-3 border-l-4 border-transparent px-6 py-3 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#7C3AED]"
          >
            Analytics
          </a>
          <a
            href="#"
            className="flex items-center gap-3 border-l-4 border-transparent px-6 py-3 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#7C3AED]"
          >
            Settings
          </a>
        </nav>
        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-lg border border-[rgba(124,58,237,0.12)] bg-[#F3F4F6] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-extrabold text-white">
            BT
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-[#312E81]">
              Bishan Tamang
            </div>
            <div className="mt-0.5 text-xs font-bold text-[#6B7280]">
              Organizer
            </div>
          </div>
          <a
            className="flex items-center justify-center rounded-lg p-1 text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]"
            href="#"
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
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6B7280] transition hover:text-[#7C3AED]"
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

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black text-[#312E81]">
            Create New Concert
          </h1>
          <p className="font-semibold text-[#6B7280]">
            Fill in the details to create your concert event
          </p>
        </div>

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
                  className="mt-2 min-h-[120px] w-full resize-y rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
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
              {submitting ? "Creating..." : "Create Concert"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateConcert;
