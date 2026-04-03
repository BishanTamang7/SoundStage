import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const STEPS = [
  { key: "basic", label: "Basics", helper: "Title, genre, schedule" },
  { key: "cover", label: "Cover", helper: "Upload hero image" },
  { key: "organizer", label: "Organizer", helper: "Contact details" },
  { key: "artist", label: "Artists", helper: "Headliner" },
  { key: "tickets", label: "Tickets", helper: "Pricing & qty" },
  { key: "review", label: "Review", helper: "Confirm & submit" },
];

// Format a Date (or date-like value) into the `datetime-local` input shape.
const toDateTimeLocalString = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDatePreview = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date & time not set";
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const CreateConcert = () => {
  const navigate = useNavigate();
  const { tokens, user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [venue, setVenue] = useState("");
  const [mainArtist, setMainArtist] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [otherCity, setOtherCity] = useState("");

  const [tickets, setTickets] = useState(
    FIXED_TICKET_TYPES.map((name) => ({ name, price: "", quantity: "" }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [minDateTime, setMinDateTime] = useState(() => toDateTimeLocalString());
  const [descriptionWords, setDescriptionWords] = useState(0);
  const [acknowledgedReview, setAcknowledgedReview] = useState(false);

  // Keep the earliest selectable date in sync with "now" (rounded to the current minute).
  useEffect(() => {
    const intervalId = window.setInterval(
      () => setMinDateTime(toDateTimeLocalString()),
      60000
    );
    return () => window.clearInterval(intervalId);
  }, []);

  // Pre-fill organizer info from the logged-in user.
  useEffect(() => {
    const fallbackName = user?.username || user?.email || "";
    setOrganizerName((prev) => (prev ? prev : fallbackName));
    setContactEmail((prev) => (prev ? prev : user?.email || ""));
  }, [user]);

  // Clean up object URLs when component unmounts or preview changes.
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    if (currentStep !== STEPS.length - 1 && acknowledgedReview) {
      setAcknowledgedReview(false);
    }
  }, [currentStep, acknowledgedReview]);

  const getCityValue = () => (selectedCity === "Other" ? otherCity.trim() : selectedCity);

  const handleDescriptionChange = (event) => {
    const value = event.target.value;
    setDescription(value);
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    setDescriptionWords(words);
  };

  const handlePhoneChange = (event) => {
    // Keep raw input so we can show a clear validation message instead of blocking typing.
    setContactPhone(event.target.value);
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

  const validateStep = (stepIndex, { setMessage = true } = {}) => {
    let error = "";
    const cityValue = getCityValue();
    const descriptionWordCount = description ? description.trim().split(/\s+/).filter(Boolean).length : 0;
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedVenue = venue.trim();
    const trimmedArtist = mainArtist.trim();

    const phoneRaw = contactPhone.replace(/\s+/g, "");
    const digitsOnlyPhone = phoneRaw.replace(/\D/g, "");
    const hasPhoneNonDigits = digitsOnlyPhone.length !== phoneRaw.length;

    const normalizedTickets = tickets.map((ticket) => ({
      name: ticket.name?.trim() || "",
      price: Number(ticket.price),
      quantity: Number(ticket.quantity),
    }));

    switch (stepIndex) {
      case 0: {
        if (!trimmedTitle) {
          error = "Concert title is required.";
          break;
        }
        if (/^\\d+$/.test(trimmedTitle)) {
          error = "Concert title cannot be only numbers. Add words or letters.";
          break;
        }
        if (!selectedGenre) {
          error = "Please select a genre.";
          break;
        }
        if (!dateTime) {
          error = "Please select a valid Date & Time.";
          break;
        }
        const selectedDateTime = new Date(dateTime);
        if (Number.isNaN(selectedDateTime.getTime())) {
          error = "Please select a valid Date & Time.";
          break;
        }
        if (selectedDateTime < new Date()) {
          error = "Date & Time must be in the future.";
          break;
        }
        if (!trimmedDescription) {
          error = "Description is required.";
          break;
        }
        if (descriptionWordCount > DESCRIPTION_WORD_LIMIT) {
          error = `Description must be ${DESCRIPTION_WORD_LIMIT} words or fewer.`;
          break;
        }
        if (trimmedDescription && /^\\d+$/.test(trimmedDescription.replace(/\\s+/g, ""))) {
          error = "Description cannot be only numbers. Add words or letters.";
          break;
        }
        if (!trimmedVenue) {
          error = "Venue name is required.";
          break;
        }
        if (/\\d/.test(trimmedVenue)) {
          error = "Venue name cannot contain numbers. Use letters and words.";
          break;
        }
        if (!cityValue) {
          error = "Please select a city.";
          break;
        }
        if (selectedCity === "Other" && !otherCity.trim()) {
          error = "Please enter the city name.";
          break;
        }
        break;
      }
      case 1: {
        if (!coverImage) {
          error = "Cover image is required.";
        }
        break;
      }
      case 2: {
        if (!organizerName?.trim() || !contactEmail?.trim()) {
          error = "Your organizer profile is missing a name or email.";
          break;
        }
        if (!contactPhone.trim()) {
          error = "Contact phone is required.";
          break;
        }
        if (hasPhoneNonDigits) {
          error = "Contact phone must contain digits only (no letters or symbols).";
          break;
        }
        if (!NEPAL_PHONE_REGEX.test(digitsOnlyPhone)) {
          error = "Enter a 10-digit Nepal mobile (starts with 97 or 98).";
          break;
        }
        break;
      }
      case 3: {
        if (!trimmedArtist) {
          error = "Main artist is required.";
          break;
        }
        if (/^\\d+$/.test(trimmedArtist)) {
          error = "Main artist cannot be only numbers. Add words or letters.";
          break;
        }
        break;
      }
      case 4: {
        const invalidPrice = normalizedTickets.some((ticket) => !Number.isFinite(ticket.price));
        const invalidQuantity = normalizedTickets.some((ticket) => !Number.isFinite(ticket.quantity));
        if (invalidPrice || invalidQuantity) {
          error = "Ticket price and quantity must be valid numbers.";
          break;
        }
        const negativePrice = normalizedTickets.some((ticket) => ticket.price < 0);
        if (negativePrice) {
          error = "Ticket price cannot be negative.";
          break;
        }
        const tooSmallQty = normalizedTickets.some((ticket) => ticket.quantity < 1);
        if (tooSmallQty) {
          error = "Ticket quantity must be at least 1.";
          break;
        }
        break;
      }
      default:
        break;
    }

    if (setMessage) setFormError(error);
    return !error;
  };

  const validateAll = () => {
    for (let i = 0; i < STEPS.length - 1; i += 1) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setFormError("");
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setFormError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepSelect = (index) => {
    if (index <= currentStep) {
      setFormError("");
      setCurrentStep(index);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!validateAll()) return;

    if (!acknowledgedReview) {
      setCurrentStep(STEPS.length - 1);
      setFormError("Please confirm you've reviewed your details before submitting.");
      return;
    }

    if (!tokens?.access) {
      setFormError("You must be logged in as an organizer.");
      return;
    }

    const phoneRaw = contactPhone.replace(/\s+/g, "");
    const digitsOnlyPhone = phoneRaw.replace(/\D/g, "");

    const normalizedTickets = tickets.map((ticket) => ({
      name: ticket.name?.trim() || "",
      price: Number(ticket.price),
      quantity: Number(ticket.quantity),
    }));

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("genre", selectedGenre);
    formData.append("date_time", dateTime);
    formData.append("venue", `${venue.trim()}, ${getCityValue()}`);
    formData.append("organizer_name", organizerName.trim());
    formData.append("contact_email", contactEmail.trim());
    formData.append("contact_phone", digitsOnlyPhone);
    formData.append("main_artist", mainArtist.trim());
    formData.append("ticket_categories", JSON.stringify(normalizedTickets));
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

  const progress = Math.min((currentStep / (STEPS.length - 1)) * 100, 100);
  const genreLabel =
    GENRE_OPTIONS.find((genre) => genre.value === selectedGenre)?.label || "Not set";

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['DM_Sans'] text-[#312E81]">
      <OrganizerSidebar />

      <main className="ml-60 max-w-5xl px-12 py-8 md:px-6 max-[768px]:ml-0 max-[768px]:px-4 xl:mx-auto">
        <div className="mb-6 flex flex-col gap-3 text-center">
          <h1 className="text-3xl font-black text-[#1F2937]">Create New Concert</h1>
          <p className="text-sm font-semibold text-[#6B7280]">
            Fill the details to create your concert event
          </p>

          <div className="h-3 w-full rounded-full bg-[#E5E7EB]">
            <div
              className="h-3 rounded-full bg-linear-to-r from-[#4F46E5] to-[#7C3AED] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-base font-bold">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => handleStepSelect(index)}
                  className={`transition ${
                    isActive ? "text-[#4F46E5]" : "text-[#6B7280]"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {formError ? (
            <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
              {formError}
            </div>
          ) : null}

          {currentStep === 0 ? (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                1. Basic Info
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="concert-title" className="text-sm font-bold text-[#312E81]">
                    Concert Title <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="concert-title"
                    name="concert-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g., Rock Night 2026"
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="text-sm font-bold text-[#312E81]">
                    Description (max {DESCRIPTION_WORD_LIMIT} words){" "}
                    <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={description}
                    placeholder="Tell attendees about your concert..."
                    onChange={handleDescriptionChange}
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
                    value={selectedGenre}
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
                  <label htmlFor="date-time" className="text-sm font-bold text-[#312E81]">
                    Date &amp; Time <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="date-time"
                    name="date-time"
                    type="datetime-local"
                    value={dateTime}
                    min={minDateTime}
                    onChange={(event) => setDateTime(event.target.value)}
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
                    value={venue}
                    onChange={(event) => setVenue(event.target.value)}
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
                      value={otherCity}
                      onChange={(event) => setOtherCity(event.target.value)}
                      placeholder="Enter city name"
                      className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                    />
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                2. Cover Image
              </h2>
              <div className="flex flex-col gap-3">
                <label htmlFor="cover-image" className="text-sm font-bold text-[#312E81]">
                  Cover Image <span className="text-[#EF4444]">*</span>
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
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-[#6B7280]">Preview</p>
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="h-48 w-full rounded-xl object-cover"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={clearCoverImage}
                      className="w-fit rounded-lg border border-[#FCA5A5] bg-white px-4 py-2 text-xs font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2]"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-[#6B7280]">
                    Use a 16:9 image (e.g., 1600x900) for best results.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                3. Organizer Info
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="organizer-name" className="text-sm font-bold text-[#312E81]">
                    Organizer Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="organizer-name"
                    name="organizer-name"
                    type="text"
                    value={organizerName}
                    readOnly
                    aria-readonly="true"
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-sm font-bold text-[#312E81]">
                    Contact Email <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="contact-email"
                    type="email"
                    value={contactEmail}
                    readOnly
                    aria-readonly="true"
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="text-sm font-bold text-[#312E81]">
                    Contact Phone <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    name="contact-phone"
                    type="tel"
                    inputMode="numeric"
                    value={contactPhone}
                    onChange={handlePhoneChange}
                    placeholder="e.g., 9812345678"
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                  <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                    10-digit Nepal mobile (starts with 97 or 98).
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                4. Artist
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="main-artist" className="text-sm font-bold text-[#312E81]">
                    Main Artist <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="main-artist"
                    name="main-artist"
                    type="text"
                    value={mainArtist}
                    onChange={(event) => setMainArtist(event.target.value)}
                    placeholder="e.g., The Rockers Band"
                    className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#312E81] transition focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-[rgba(124,58,237,0.1)]"
                  />
                </div>
              </div>
            </section>
          ) : null}

          {currentStep === 4 ? (
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
          ) : null}

          {currentStep === 5 ? (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <h2 className="mb-6 border-b-2 border-[#E5E7EB] pb-3 text-xl font-black text-[#312E81]">
                6. Review &amp; Submit
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFF] p-4">
                    <h3 className="mb-2 text-lg font-black text-[#312E81]">Event</h3>
                    <dl className="grid grid-cols-1 gap-y-2 text-sm text-[#1F2937] sm:grid-cols-2">
                      <div>
                        <dt className="font-bold text-[#6B7280]">Title</dt>
                        <dd className="font-semibold">{title || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-[#6B7280]">Genre</dt>
                        <dd className="font-semibold">{genreLabel}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-[#6B7280]">Date &amp; Time</dt>
                        <dd className="font-semibold">{formatDatePreview(dateTime)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-[#6B7280]">Venue</dt>
                        <dd className="font-semibold">
                          {venue ? `${venue}${getCityValue() ? ", " : ""}${getCityValue()}` : "Not set"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-3">
                      <dt className="font-bold text-[#6B7280]">Description</dt>
                      <dd className="mt-1 text-sm font-semibold text-[#1F2937]">
                        {description || "No description provided yet."}
                      </dd>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFF] p-4">
                    <h3 className="mb-2 text-lg font-black text-[#312E81]">Organizer &amp; Artist</h3>
                    <dl className="grid grid-cols-1 gap-y-2 text-sm text-[#1F2937] sm:grid-cols-2">
                      <div>
                        <dt className="font-bold text-[#6B7280]">Organizer</dt>
                        <dd className="font-semibold">{organizerName || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-[#6B7280]">Email</dt>
                        <dd className="font-semibold">{contactEmail || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-[#6B7280]">Phone</dt>
                        <dd className="font-semibold">{contactPhone || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-[#6B7280]">Main Artist</dt>
                        <dd className="font-semibold">{mainArtist || "Not set"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFF] p-4">
                    <h3 className="mb-2 text-lg font-black text-[#312E81]">Tickets</h3>
                    <div className="divide-y divide-[#E5E7EB] text-sm font-semibold text-[#1F2937]">
                      {tickets.map((ticket) => (
                        <div key={ticket.name} className="grid grid-cols-[2fr_1fr_1fr] items-center gap-2 py-2">
                          <span className="font-bold text-[#312E81]">{ticket.name}</span>
                          <span>Rs {ticket.price || "0"}</span>
                          <span>{ticket.quantity || "0"} qty</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#FCFCFF]">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-[#E5E7EB] text-sm font-bold text-[#6B7280]">
                        Cover image preview
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#6B7280]">
                    Double-check your details before submitting. You can still edit tickets later.
                  </p>
                  <label className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm font-semibold text-[#1F2937]">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[#7C3AED]"
                      checked={acknowledgedReview}
                      onChange={(event) => {
                        setAcknowledgedReview(event.target.checked);
                        if (formError) setFormError("");
                      }}
                    />
                    <span>I have reviewed all details and confirm they are correct.</span>
                  </label>
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
            <Link
              to="/organizer/concerts"
              className="inline-flex justify-center rounded-xl border border-[#E5E7EB] bg-white px-8 py-3 text-sm font-bold text-[#6B7280] transition hover:bg-[#F3F4F6]"
            >
              Cancel
            </Link>
            <div className="flex gap-3">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-bold text-[#312E81] transition hover:bg-[#F3F4F6]"
                >
                  Back
                </button>
              ) : null}
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex justify-center rounded-xl bg-[#7C3AED] px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4F46E5]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !acknowledgedReview}
                  className="inline-flex justify-center rounded-xl bg-[#7C3AED] px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Create Concert"}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateConcert;
