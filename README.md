# SoundStage

**SoundStage** is a web-based music concert management application developed to digitalize the processes of concert creation, ticket booking, online payment, QR-based ticket generation, and attendee entry verification. The system is designed for two main types of users: **Music Concert Organizers** and **Attendees**.

## Description

SoundStage provides a centralized platform for managing music concerts in a more secure, efficient, and user-friendly way. Music concert organizers can create and manage concert events, add event details, upload concert posters, define ticket categories and prices, and monitor bookings, tickets, and revenue. Attendees can browse available concerts, search and filter events, view concert details, book tickets online, and make payments through digital wallets such as **eSewa** and **Khalti**.

After successful payment, the system automatically generates a **QR-based e-ticket** for the attendee. The attendee can then view or download the QR ticket from the system. At the concert venue, organizers can verify tickets by scanning the QR code or checking the ticket PIN, which helps confirm ticket validity, display attendee details, and support a secure and smooth entry process.

## Features

### For Music Concert Organizers
- **Organizer Registration and Login**: Create an account, verify email through OTP, and log in securely.
- **Concert Creation and Management**: Create, update, view, and delete concert events.
- **Concert Details Setup**: Add basic concert details, organizer information, artist information, cover image, and ticket categories.
- **Ticket Category and Pricing Management**: Define ticket types such as VIP and Regular with prices and quantities.
- **Booking Record Management**: View attendee booking records, ticket quantities, revenue, and booking dates.
- **Ticket Inventory Management**: Monitor sold tickets, remaining tickets, ticket status, and revenue by ticket category.
- **Analytics Dashboard**: View overall performance such as total concerts, tickets sold, revenue, top concerts, top genres, and top cities.
- **QR Ticket Verification**: Verify attendee tickets using QR code or ticket PIN and confirm entry at the venue.

### For Attendees
- **Attendee Registration and Login**: Create an account, verify email with OTP, and log in securely.
- **Browse Concerts**: View available concerts through the browse page.
- **Search and Filter Concerts**: Search concerts by name and filter by city, genre, and date.
- **View Concert Details**: See detailed concert information including venue, date, description, and ticket categories.
- **Online Ticket Booking**: Select ticket category and quantity and proceed with booking.
- **Digital Payment Integration**: Pay for tickets using **eSewa** and **Khalti**.
- **QR-Based e-Ticket Generation**: Receive a unique QR ticket automatically after successful payment.
- **My Tickets**: View booked tickets and access QR-based e-tickets.
- **Download QR Ticket**: Download the generated QR ticket for later use.

## Main Technologies / Services
- **Frontend**: Web-based user interface
- **Backend**: Application server for business logic and APIs
- **Database**: Stores user, concert, booking, payment, and ticket data
- **Payment Integration**: eSewa and Khalti
- **Authentication**: OTP-based email verification
- **Ticket Validation**: QR code and PIN-based verification

## Docker Usage Guide

### Clone and run (Docker only)
1. Clone the project:
```bash
git clone <your-repo-url>
cd SoundStage
```

2. Build and start:
```bash
docker compose up -d --build
```

3. Open:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

4. See logs if needed:
```bash
docker compose logs -f backend
```

5. Stop:
```bash
docker compose down
```
