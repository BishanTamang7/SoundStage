import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";

const CITY_OPTIONS = ["Kathmandu", "Pokhara", "Dharan", "Butwal", "Biatnagar", "Other"];
const GENRE_OPTIONS = [
  { value: "rock", label: "Rock" },
  { value: "hip-hop-rap", label: "Hip-Hop / Rap" },
  { value: "pop", label: "Pop" },
  { value: "folk-dohori", label: "Folk / Dohori" },
];
const FIXED_TICKET_TYPES = ["VIP", "Regular"];

const CreateConcert = () => {
  const navigate = useNavigate();
  const { tokens, user, role, logout } = useAuth();
  const [tickets, setTickets] = useState(
    FIXED_TICKET_TYPES.map((name) => ({ name, price: "", quantity: "" }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

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

  useEffect(() => {
    const fallbackName = user?.username || user?.email || "";
    setOrganizerName((prev) => (prev ? prev : fallbackName));
    setContactEmail((prev) => (prev ? prev : user?.email || ""));
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const updateTicket = (index, field, value) => {
    setTickets((prev) =>
      prev.map((ticket, i) =>
        i === index ? { ...ticket, [field]: value } : ticket
      )
    );
  };

  const resizeCoverImage = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetWidth = 1600;
        const targetHeight = 900;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas not supported."));
          return;
        }
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const offsetX = (targetWidth - drawWidth) / 2;
        const offsetY = (targetHeight - drawHeight) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error("Image processing failed."));
              return;
            }
            resolve(
              new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
              })
            );
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Invalid image file."));
      };
      img.src = objectUrl;
    });

  const handleCoverChange = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverImage(null);
      setCoverPreview("");
      return;
    }
    try {
      const resizedFile = await resizeCoverImage(file);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverImage(resizedFile);
      setCoverPreview(URL.createObjectURL(resizedFile));
    } catch {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const clearCoverImage = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverImage(null);
    setCoverPreview("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!tokens?.access) {
      setFormError("You must be logged in as an organizer.");
      return;
    }

    const organizerNameTrimmed = organizerName?.trim() || "";
    const contactEmailTrimmed = contactEmail?.trim() || "";

    if (!organizerNameTrimmed || !contactEmailTrimmed) {
      setFormError("Your organizer profile is missing a name or email.");
      return;
    }

    const normalizedTickets = tickets.map((ticket) => {
      const name = ticket.name?.trim() || "";
      const price = Number(ticket.price);
      const quantity = Number(ticket.quantity);
      return { name, price, quantity };
    });

    const invalidTicket = normalizedTickets.find(
      (ticket) =>
        !ticket.name ||
        !Number.isFinite(ticket.price) ||
        ticket.price < 0 ||
        !Number.isFinite(ticket.quantity) ||
        ticket.quantity < 1
    );

    if (invalidTicket) {
      setFormError("Please fill in all ticket types with valid price and quantity.");
      return;
    }

    const form = event.target;
    const getFieldValue = (name) => {
      const element = form.elements?.namedItem(name);
      if (!element) return "";
      if (typeof element.value === "string") return element.value.trim();
      return String(element.value || "").trim();
    };

    const formData = new FormData();
    const venueName = getFieldValue("venue");
    const city = selectedCity === "Other" ? otherCity.trim() : selectedCity;
    if (!city) {
      setFormError("Please select a city.");
      return;
    }
    const composedVenue = `${venueName}, ${city}`;
    formData.append("title", getFieldValue("concert-title"));
    formData.append("description", getFieldValue("description"));
    formData.append("genre", selectedGenre);
    formData.append("date_time", getFieldValue("date-time"));
    formData.append("venue", composedVenue);
    formData.append("organizer_name", organizerNameTrimmed);
    formData.append("contact_email", contactEmailTrimmed);
    formData.append("contact_phone", getFieldValue("contact-phone"));
    formData.append("main_artist", getFieldValue("main-artist"));
    formData.append(
      "ticket_categories",
      JSON.stringify(
        normalizedTickets.map((ticket) => ({
          name: ticket.name,
          price: ticket.price,
          quantity: ticket.quantity,
        }))
      )
    );
    if (coverImage instanceof File) {
      formData.append("cover_image", coverImage);
    }

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
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/tickets"
          >
            Tickets
          </Link>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/confirm-ticket"
          >
            Confirm Ticket
          </Link>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/bookings"
          >
            Bookings
          </Link>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/analytics"
          >
            Analytics
          </Link>
          <Link
            className="border-l-4 border-transparent px-6 py-3 text-base font-semibold text-[#6B7280] hover:bg-[#F3F4F6]"
            to="/organizer/settings"
          >
            Settings
          </Link>
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
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444]"
            title="Logout"
            type="button"
            onClick={handleLogout}
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
          </button>
        </div>
      </aside>

      <main className="ml-60 max-w-4xl px-12 py-8 md:px-6 max-[768px]:ml-0 max-[768px]:px-4 xl:mx-auto">
        <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="mb-2 text-3xl font-black text-[#312E81]">
            Create New Concert
          </h1>
          <p className="font-semibold text-[#6B7280]">
            Fill in the details to create your concert event
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError ? (
            <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
              {formError}
            </div>
          ) : null}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
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
                  className="mt-2 min-h-30 w-full resize-y rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                />
              </div>

              <div>
                <label htmlFor="genre" className="text-sm font-bold text-[#312E81]">
                  Genre <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={selectedGenre}
                  required
                  onChange={(event) => setSelectedGenre(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                >
                  <option value="" disabled>
                    Select a genre
                  </option>
                  {GENRE_OPTIONS.map((genreOption) => (
                    <option key={genreOption.value} value={genreOption.value}>
                      {genreOption.label}
                    </option>
                  ))}
                </select>
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
                  Venue Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  required
                  placeholder="e.g., Valley Concert Hall"
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                />
              </div>

              <div>
                <label htmlFor="city" className="text-sm font-bold text-[#312E81]">
                  City <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  id="city"
                  name="city"
                  value={selectedCity}
                  required
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                >
                  <option value="" disabled>
                    Select a city
                  </option>
                  {CITY_OPTIONS.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>
                      {cityOption}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCity === "Other" ? (
                <div>
                  <label htmlFor="other-city" className="text-sm font-bold text-[#312E81]">
                    Other City <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="other-city"
                    name="other-city"
                    type="text"
                    required
                    value={otherCity}
                    onChange={(event) => setOtherCity(event.target.value)}
                    placeholder="Enter city name"
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
              2. Cover Image
            </h2>
            <div className="flex flex-col gap-3">
              <label
                htmlFor="cover-image"
                className="text-sm font-bold text-[#312E81]"
              >
                Cover Image
              </label>
              <input
                id="cover-image"
                name="cover-image"
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
              />
              {coverImage ? (
                <button
                  type="button"
                  onClick={clearCoverImage}
                  className="w-fit rounded-lg border border-[#FCA5A5] bg-white px-4 py-2 text-xs font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2]"
                >
                  Remove Image
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
              3. Organizer Info
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
                  value={organizerName}
                  readOnly
                  aria-readonly="true"
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
                  value={contactEmail}
                  readOnly
                  aria-readonly="true"
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-phone"
                  className="text-sm font-bold text-[#312E81]"
                >
                  Contact Phone
                </label>
                <input
                  id="contact-phone"
                  name="contact-phone"
                  type="tel"
                  placeholder="e.g., +977 9812345678"
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
              4. Artist
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

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
              5. Ticket Categories
            </h2>
            <div className="flex flex-col gap-4">
              {tickets.map((ticket, index) => (
                <div
                  key={`ticket-${index}`}
                  className="grid grid-cols-1 items-end gap-4 rounded-xl border border-[#E5E7EB] bg-[#FCFCFF] p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
                >
                  <div>
                    <label className="text-sm font-bold text-[#312E81]">
                      Ticket Type <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ticket.name}
                      readOnly
                      aria-readonly="true"
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
                  <div />
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-4 md:flex-row md:justify-end">
            <Link
              to="/organizer/concerts"
              className="inline-flex justify-center rounded-xl border border-[#E5E7EB] bg-white px-8 py-3 text-sm font-bold text-[#6B7280] transition hover:bg-[#F3F4F6]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-xl bg-[#7C3AED] px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4F46E5]"
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
