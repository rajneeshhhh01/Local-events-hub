# Local Events Hub

A web app for a local events organiser. People can find events and ask for tickets. Staff (admins) manage events, approve requests and see an activity log. It has two responsible AI features: a help bot and an AI writing helper.

**ICT203 Web Application Development – Assessment 3 (Group)**
Team: Varandeep Singh (CIHE260846) · Rajneesh (CIHE260779) · Asad Ullah (CIHE240899)

**Stack:** Node.js + Express · EJS · MySQL / MariaDB · HTML, CSS, JavaScript

---

## Features

- Register / log in / log out (bcrypt passwords, sessions)
- Roles: **Admin** and **Standard User**
- **Events CRUD** (admin) and **Ticket Requests CRUD** (user + admin), plus **Categories**
- Search, filter (category, upcoming/past, status) and pagination
- Client-side (JS) and server-side validation
- Responsive, mobile-first, accessible design
- Audit: created by / updated by + timestamps, full activity log
- Security: parameterised SQL, escaped output, CSRF tokens, helmet headers, role checks
- **AI Help Bot** (FAQ-based) and **AI Writing Helper** (3 drafts, human must review, everything logged)

## Setup

### 1. Needs

- Node.js 18 or newer
- MySQL 8 or MariaDB (XAMPP is fine)

### 2. Install

```bash
cd local-events-hub
npm install
```

### 3. Settings

Copy `.env.example` to `.env` and add your database login:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=local_events_hub
SESSION_SECRET=any-long-random-text
```

### 4. Make the database

In MySQL Workbench or phpMyAdmin, import `database/schema.sql` and then `database/seed.sql`.
Or import the full dump `database/local_events_hub_dump.sql`.

Command line option:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 5. Run

```bash
npm start
```

Open **http://localhost:3000**

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@localevents.example | Admin123 |
| Admin | priya@localevents.example | Admin123 |
| User | sam@example.com | User1234 |
| User | lee@example.com | User1234 |
| User | mia@example.com | User1234 |

All demo people and emails are fake.

## Deployment

Local: http://localhost:3000
Live link: _(add link here if deployed, e.g. Render / Railway + a cloud MySQL)_

## Project structure

```
local-events-hub/
├── app.js                  main server + login/register/logout
├── package.json
├── .env.example
├── config/
│   └── db.js               MySQL connection
├── middleware/
│   ├── auth.js             login + admin checks
│   └── csrf.js             CSRF token
├── routes/
│   ├── events.js           events + ask for tickets
│   ├── tickets.js          ticket requests
│   ├── admin.js            admin pages
│   └── help.js             help page + API
├── helpers/
│   ├── validate.js         form checks
│   ├── log.js              activity log
│   ├── helpBot.js          help bot
│   └── aiWriter.js         AI writing helper
├── data/
│   └── faq.json            help bot answers
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── local_events_hub_dump.sql
├── public/
│   ├── css/style.css
│   └── js/
│       ├── main.js
│       ├── help.js
│       └── ai.js
├── views/
│   ├── partials/           header, footer, errors, pager
│   ├── events/             list, show, form
│   ├── tickets/            list, edit
│   ├── admin/              dashboard, users, categories, log, ai-log, menu
│   └── home.ejs, login.ejs, register.ejs, help.ejs, error.ejs
```

## AI Use Statement

**In the app:** the Help Bot and the AI Writing Helper are rule-based and run on our own server. No data is sent to outside AI services. The AI drafts must be edited and checked by an admin (required tick box) before they are saved, and the page shows "AI-generated content requires human review". Every suggestion and the final choice are saved in the AI log.

**In making the project:** the team used Claude (Anthropic) as an assistant for planning, code drafts, test scripts and documentation drafts. All AI output was reviewed, tested and changed by the team. No personal data was shared with AI tools.

## References

- Express.js. (2024). *Express 4.x API reference*. https://expressjs.com/en/4x/api.html
- OWASP Foundation. (2021). *OWASP Top 10: 2021*. https://owasp.org/Top10/
- W3C. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/
- Anthropic. (2026). *Claude* [Large language model]. https://claude.ai
