import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import OrganizerSidebar from "../../components/OrganizerSidebar";

const CITY_OPTIONS = ["Kathmandu", "Pokhara", "Dharan", "Butwal", "Biratnagar", "Other"];
const GENRE_OPTIONS = [
  { value: "rock", label: "Rock" },
  { value: "hip-hop-rap", label: "Hip-Hop / Rap" },
  { value: "pop", label: "Pop" },
  { value: "folk-dohori", label: "Folk / Dohori" },
];
const FIXED_TICKET_TYPES = ["VIP", "Regular"];
const DESCRIPTION_WORD_LIMIT = 85;
const NEPAL_PHONE_REGEX = /^(97|98)\d{8}$/;
const toDateTimeLocalString = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const EditConcert = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tokens } = useAuth();
  const [tickets, setTickets] = useState(
    FIXED_TICKET_TYPES.map((name) => ({ id: "", name, price: "", quantity: "" }))
  );
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    genre: "",
    date_time: "",
    venue_name: "",
    city: "",
    other_city: "",
    organizer_name: "",
    contact_email: "",
    contact_phone: "",
    main_artist: "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [existingCover, setExistingCover] = useState("");
  const [removeCover, setRemoveCover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [descriptionWords, setDescriptionWords] = useState(0);
  const [minDateTime, setMinDateTime] = useState(() => toDateTimeLocalString());

  const toInputDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const splitVenueAndCity = (value) => {
    const source = (value || "").trim();
    if (!source) return { venueName: "", city: "" };

    const parts = source.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const possibleCity = parts[parts.length - 1];
      const matchedCity = CITY_OPTIONS.find(
        (option) => option.toLowerCase() === possibleCity.toLowerCase()
      );
      if (matchedCity) {
        return {
          venueName: parts.slice(0, -1).join(", "),
          city: matchedCity,
          otherCity: "",
        };
      }
      return {
        venueName: parts.slice(0, -1).join(", "),
        city: "Other",
        otherCity: possibleCity,
      };
    }

    const matchedByContains = CITY_OPTIONS.find((option) =>
      source.toLowerCase().includes(option.toLowerCase())
    );
    if (matchedByContains) {
      return {
        venueName: source.replace(new RegExp(matchedByContains, "ig"), "").replace(/,\s*$/, "").trim() || source,
        city: matchedByContains,
        otherCity: "",
      };
    }

    return { venueName: source, city: "", otherCity: "" };
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
      setRemoveCover(false);
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
    setRemoveCover(false);
  };

  const handleRemoveCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverImage(null);
    setCoverPreview("");
    setRemoveCover(true);
  };

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (field === "description") {
      const words = value.trim() ? value.trim().split(/\s+/).length : 0;
      setDescriptionWords(words);
    }
  };

  useEffect(() => {
    let isActive = true;

    const intervalId = window.setInterval(
      () => setMinDateTime(toDateTimeLocalString()),
      60000
    );

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
            genre: payload.genre || "",
            date_time: toInputDateTime(payload.date_time),
            ...(() => {
              const parsedVenue = splitVenueAndCity(payload.venue || "");
              return {
                venue_name: parsedVenue.venueName,
                city: parsedVenue.city,
                other_city: parsedVenue.otherCity || "",
              };
            })(),
            organizer_name: payload.organizer_name || "",
            contact_email: payload.contact_email || "",
            contact_phone: payload.contact_phone || "",
            main_artist: payload.main_artist || "",
          });
          setExistingCover(payload.cover_image || "");
          setCoverImage(null);
          setCoverPreview("");
          setRemoveCover(false);
          setDescriptionWords(
            payload.description
              ? payload.description.trim().split(/\s+/).filter(Boolean).length
              : 0
          );
          const ticketList = Array.isArray(payload.ticket_categories) ? payload.ticket_categories : [];
          const ticketByName = new Map(
            ticketList.map((ticket) => [String(ticket?.name || "").trim().toLowerCase(), ticket])
          );
          setTickets(
            FIXED_TICKET_TYPES.map((name) => {
              const existing = ticketByName.get(name.toLowerCase())
              return {
                id: existing?.id || "",
                name,
                price: existing?.price ?? "",
                quantity: existing?.quantity ?? "",
              }
            })
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
      window.clearInterval(intervalId);
    };
  }, [id, tokens?.access]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!tokens?.access) {
      setFormError("You must be logged in as an organizer.");
      return;
    }

    const normalizedTicketCategories = tickets.map((ticket) => {
      const normalized = {
        name: ticket.name,
        price: parseFloat(ticket.price || 0),
        quantity: parseInt(ticket.quantity || 0, 10),
      };
      if (ticket.id) {
        normalized.id = ticket.id;
      }
      return normalized;
    });

    const titleValue = formState.title?.trim();
    if (!titleValue) {
      setFormError("Concert title is required.");
      return;
    }
    if (/^\\d+$/.test(titleValue)) {
      setFormError("Concert title cannot be only numbers. Add words or letters.");
      return;
    }

    const descriptionValue = formState.description?.trim() || "";
    const descriptionWordCount = descriptionValue ? descriptionValue.split(/\\s+/).filter(Boolean).length : 0;
    if (descriptionWordCount > DESCRIPTION_WORD_LIMIT) {
      setFormError(`Description must be ${DESCRIPTION_WORD_LIMIT} words or fewer.`);
      return;
    }
    if (descriptionValue && /^\\d+$/.test(descriptionValue.replace(/\\s+/g, ""))) {
      setFormError("Description cannot be only numbers. Add words or letters.");
      return;
    }

    const mainArtistValue = formState.main_artist?.trim();
    if (mainArtistValue && /^\\d+$/.test(mainArtistValue)) {
      setFormError("Main artist cannot be only numbers. Add words or letters.");
      return;
    }

    let normalizedContactPhone = "";
    if (formState.contact_phone) {
      const strippedPhone = formState.contact_phone.replace(/\s+/g, "");
      const digitsOnly = strippedPhone.replace(/\D/g, "");
      if (digitsOnly.length !== strippedPhone.length) {
        setFormError("Contact phone must contain digits only (no letters or symbols).");
        return;
      }
      if (!NEPAL_PHONE_REGEX.test(digitsOnly)) {
        setFormError(
          "Enter a 10-digit Nepal mobile (starts with 97 or 98)."
        );
        return;
      }
      normalizedContactPhone = digitsOnly;
    }

    const basePayload = {
      title: formState.title,
      description: formState.description,
      genre: formState.genre,
      date_time: formState.date_time,
      venue: `${(formState.venue_name || "").trim()}, ${(
        formState.city === "Other" ? formState.other_city : formState.city
      ).trim()}`,
      organizer_name: formState.organizer_name,
      contact_email: formState.contact_email,
      contact_phone: normalizedContactPhone,
      main_artist: formState.main_artist,
      ticket_categories: normalizedTicketCategories,
    };

    if (
      !formState.venue_name.trim() ||
      !formState.city.trim() ||
      (formState.city === "Other" && !formState.other_city.trim())
    ) {
      setFormError("Venue name and city are required.");
      return;
    }

    const selectedDateTime = new Date(formState.date_time);
    if (!formState.date_time || Number.isNaN(selectedDateTime.getTime())) {
      setFormError("Please select a valid Date & Time.");
      return;
    }
    if (selectedDateTime < new Date()) {
      setFormError("Date & Time must be in the future.");
      return;
    }

    try {
      setSubmitting(true);
      const hasCoverChange = Boolean(coverImage) || removeCover;
      if (hasCoverChange) {
        const payload = new FormData();
        payload.append("title", basePayload.title);
        payload.append("description", basePayload.description);
        payload.append("genre", basePayload.genre);
        payload.append("date_time", basePayload.date_time);
        payload.append("venue", basePayload.venue);
        payload.append("organizer_name", basePayload.organizer_name);
        payload.append("contact_email", basePayload.contact_email);
        payload.append("contact_phone", basePayload.contact_phone);
        payload.append("main_artist", basePayload.main_artist);
        payload.append("ticket_categories", JSON.stringify(basePayload.ticket_categories));
        if (coverImage) {
          payload.append("cover_image", coverImage);
        } else if (removeCover) {
          payload.append("cover_image", "");
        }
        await api.updateConcert(tokens.access, id, payload);
      } else {
        await api.updateConcert(tokens.access, id, basePayload);
      }
      navigate(`/organizer/concerts/${id}`);
    } catch (error) {
      setFormError(error?.message || "Failed to update concert.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['DM_Sans'] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 max-w-4xl px-12 py-8 md:px-6 max-[768px]:ml-0 max-[768px]:px-4 xl:mx-auto">
        <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="mb-2 text-3xl font-black text-[#312E81]">Edit Concert</h1>
          <p className="font-semibold text-[#6B7280]">
            Update the details of your concert event
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center text-sm font-semibold text-[#6B7280]">
            Loading concert...
          </div>
        ) : (
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
                  Description (max {DESCRIPTION_WORD_LIMIT} words){" "}
                  <span className="text-[#EF4444]">*</span>
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
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                  {descriptionWords}/{DESCRIPTION_WORD_LIMIT} words
                </p>
              </div>

                <div>
                  <label htmlFor="genre" className="text-sm font-bold text-[#312E81]">
                    Genre <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    id="genre"
                    name="genre"
                    required
                    value={formState.genre}
                    onChange={handleFieldChange("genre")}
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
                  value={formState.date_time}
                  onChange={handleFieldChange("date_time")}
                  min={minDateTime}
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
                    value={formState.venue_name}
                    onChange={handleFieldChange("venue_name")}
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
                    required
                    value={formState.city}
                    onChange={handleFieldChange("city")}
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

                {formState.city === "Other" ? (
                  <div>
                    <label htmlFor="other-city" className="text-sm font-bold text-[#312E81]">
                      Other City <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      id="other-city"
                      name="other-city"
                      type="text"
                      required
                      placeholder="Enter city name"
                      value={formState.other_city}
                      onChange={handleFieldChange("other_city")}
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
                {(coverImage || (existingCover && !removeCover)) ? (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
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
                    value={formState.organizer_name}
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
                    value={formState.contact_email}
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
                    Contact Phone <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    name="contact-phone"
                    type="tel"
                    placeholder="e.g., +977 9812345678"
                    value={formState.contact_phone}
                    onChange={handleFieldChange("contact_phone")}
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
                    value={formState.main_artist}
                    onChange={handleFieldChange("main_artist")}
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
