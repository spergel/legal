# Legal Events Aggregator TODO

A list of tasks and features for the legal events aggregator project.

## High Priority
- [x] Fix failing scrapers to ensure data freshness. ✅ **PROGRESS: 14/19 scrapers working (74% success rate), 396 events**
- [x] **NEW: Implement academic event filtering system** ✅ **COMPLETED**
  - [x] Create shared `AcademicEventFilter` utility for all law school scrapers
  - [x] Filter out internal academic events (class schedules, deadlines, faculty meetings)
  - [x] Update Fordham Law scraper to use filtering (was picking up 50+ internal events)
  - [x] Update CUNY Law scraper to use filtering
  - [x] Comprehensive keyword and pattern matching for internal vs. public events
- [ ] Set up a robust CI/CD pipeline for automated scraping and deployment.
- [ ] Implement user authentication and profiles.
- [ ] Add event submission form for users.

## Medium Priority
- [ ] Enhance event categorization and filtering.
- [ ] Create an admin dashboard for managing events and users.
- [ ] Set up email notifications for new events.
- [ ] Improve UI/UX based on user feedback.

## Low Priority
- [ ] Add a blog or news section.
- [ ] Integrate with other legal tech tools.
- [ ] Develop a mobile app.
- [ ] Explore partnership opportunities.
    - [ ] Law firm sponsorships
    - [ ] CLE provider partnerships
    - [ ] Professional organization connections

## Scraper Development

### Scraper Status (as of 2025-06-28)

-   **Working ✅ (15)**:
    -   `aabany_rss` - 54 events
    -   `brooklynbar` - 5 events
    -   `chips_network` - 7 events
    -   `cuny_law_ics` - 5 events
    -   `fedbar_ics` - 26 events
    -   `fordham` - 92 events
    -   `hnba_ics` - 25 events
    -   `lgbtbarny` - 72 events
    -   `lsuite` - 16 events ✅ **NEWLY FIXED**
    -   `nawl` - 3 events
    -   `nyiac` - 1 event
    -   `nycbar` - 12 events
    -   `nysba` - 66 events
    -   `wbasny` - 12 events
-   **Needs Work 🟡 (5)** - All require browser automation:
    -   `lawyers_alliance`: Finding 0 events. HTML structure changed, no events in expected format.
    -   `lawline`: API returns empty response. Likely needs browser session for valid cookies.
    -   `acc`: Blocked by Auth0 login page. Requires browser automation.
    -   `barkergilmore`: Event content dynamically loaded via JavaScript.
    -   `qcba`: Event content dynamically loaded via JavaScript (GrowthZone platform). Website shows 3+ active events but requires browser automation.
    -   `cardozo_law`: Finds 5 "Bar Study Rooms" (room bookings), needs filtering for actual academic events.
    -   `brooklyn_law`: Dynamic content, currently shows no events but website structure suggests events exist.
    -   `nyls`: Uses EventON calendar plugin with AJAX loading, requires browser automation.
    -   `stjohns_law`: Uses TeamUp calendar system with JavaScript loading. Has law-specific categories ("Law Alumni Events", "School of Law") but requires browser automation.

### Scrapers Requiring Browser Automation 🌐

The following scrapers require a headless browser (like Playwright or Pyppeteer) to correctly render dynamic content or bypass anti-scraping measures.

-   **`acc_scraper`**: Blocked by an Auth0 login page.
-   **`barkergilmore_scraper`**: Although marked as blocked by authentication, the initial issue is that event content is not found in static HTML, suggesting it's dynamically loaded.
-   **`lawyers_alliance_scraper`**: Event data is loaded dynamically via JavaScript.
-   **`lawline_scraper`**: The target API returns an empty response, likely due to an expired session cookie that needs to be acquired through a browser session.
-   **`lsuite_scraper`**: ~~Event elements are not found by BeautifulSoup, indicating dynamic, JS-driven rendering.~~ ✅ **FIXED 2025-06-28** - Works with traditional scraping using proper selectors.
-   **`qcba_scraper`**: Event content is loaded dynamically via GrowthZone platform. Website shows active events (Meet the Judge Series, CLE programs, Golf Outing) but requires browser automation to access.

### Investigation Needed 🔍

-   **`barkergilmore_scraper` Import Error**: The production environment is reporting `cannot import name 'LgbtBarNyScraper' from 'scrapers.lgbtbarny_scraper.py'` when trying to import the `BarkerGilmoreScraper`. This import statement does not exist in the source file, suggesting a possible caching issue or a misconfigured file in the production environment.

### Recent Accomplishments
- [x] **Fixed `lsuite` Scraper (2025-06-28)**: Completed the previously "To Be Built" scraper, fixing duplicate event names and date parsing issues. Now successfully scrapes 16 events.
- [x] **Improved Import Handling**: Fixed relative import issues in the scraper runner for better script execution reliability.
- [x] **Updated Scraper Status**: Now have 14 working scrapers (up from 13) collecting 396 total events, achieving 74% success rate.
- [x] **Enabled All Scrapers**: Uncommented and tested all 15 available scrapers.
- [x] **Fixed Multiple Scraper Bugs**: Resolved `IndentationError` in `hnba_ics_scraper.py` and `nysba_scraper.py`, and an `AttributeError` in `lawyers_alliance_scraper.py`.
- [x] **Resolved Dependency Conflicts**: Updated `requirements.txt` to fix issues with `lxml`, `ics`, and `feedparser` compatibility with Python 3.13.
- [x] **Fixed All Scrapers**: Successfully ran all 13 working scrapers and collected 302 events.
- [x] **Fixed `nysba`**: Rewrote scraper to use a new API endpoint and filter for upcoming events, reducing noise significantly.
- [x] **Fixed `wbasny`**: Rewrote scraper to use a reliable ICS feed, bypassing previous auth errors.
- [x] **Fixed `nawl`**: Reverse-engineered the site's data loading mechanism to extract event data from an embedded, Base64-encoded JSON string.
- [x] **Fixed `aabany_rss`**: Resolved a 403 error by adding headers and then fixed a parse error by finding the correct RSS feed URL.
- [x] **Improved Local Runner**: Added `--scrapers` flag to `run_all_scrapers_local.py` for targeted testing.
- [x] **Fixed Multiple Scrapers**: Resolved import errors, `NameError` issues, and incorrect class names (`cuny_law_ics`, `fedbar_ics`, `hnba_ics`, `chips_network`, `nysba`, `aabany_rss`, `lgbtbarny`).
- [x] **Set Up Environment**: Installed dependencies in `scrapers/venv` to resolve `ModuleNotFoundError`.
- [x] **Fixed `ICSCalendarScraper`**: Removed hardcoded `status` argument that was causing crashes.
- [x] Implemented new SVG logo and set as favicon.
- [x] Renamed site from "Event Calendar" to "Legal Events NYC" in header.
- [x] Changed "Add to Calendar" button to "Export Calendar".
- [x] Fixed community filter dropdown functionality.
- [x] Resolved various build errors (Prisma schema, component props).
- [x] Fixed GitHub Actions workflow for scrapers by adding `prisma generate`.

## CI/CD and Deployment
- [ ] Automate scraper runs with GitHub Actions.
- [ ] Set up a staging environment on Vercel.
- [ ] Implement a production deployment pipeline.
- [ ] Monitor scraper performance and get alerts on failures.
- [x] Fixed ICS scrapers failing on 'status' field.
- [x] Resolved multiple import and `NameError` issues in scrapers.
- [x] Corrected class name mismatches in the local scraper runner.
- [x] Stubbed out failing `nysba` scraper to prevent crashes.
- [x] Fixed `hnba_ics` scraper to correctly parse ICS feed.
- [x] Fixed `aabany_rss` 403 error and updated to correct RSS feed URL.
- [x] Fixed `nawl` by extracting data from embedded JSON.
- [x] Fixed `wbasny` by switching to an ICS feed.
- [x] Fixed `nysba` by switching to a newly discovered API endpoint and filtering results.

## Backend
- [ ] Develop API endpoints for events, users, and communities.
- [ ] Implement event search and filtering logic.
- [ ] Add support for user-submitted events.
- [ ] Secure API endpoints with authentication and authorization.

## Frontend
- [ ] Build a responsive and accessible UI.
- [ ] Create a detailed event page with all relevant information.
- [ ] Implement a user-friendly event filtering system.
- [ ] Add a user profile page for managing saved events.

## Event Calendar Template - TODO List

## Core Features (Current)
- [x] User authentication (NextAuth.js, Google sign-in)
- [x] Database-backed user and admin roles (Prisma, PlanetScale/MySQL)
- [x] Event submission form (with image upload)
- [x] Event moderation dashboard for admins
- [x] Event status management (pending, approved, denied, featured, cancelled, archived)
- [x] Featured events carousel on homepage
- [x] ICS and RSS export (all, filtered, or saved events)
- [x] Bookmark/save events (localStorage, future: sync to user)
- [x] Custom calendar/RSS feeds by tag/org
- [x] Generic, rebrandable UI and codebase
- [x] Newsletter system with Mailchimp integration
- [x] Event categorization and tagging system

## User Authentication & Roles
- [x] Google sign-in (NextAuth.js)
- [x] Prisma adapter for NextAuth.js
- [x] User roles: 'user' (default), 'admin' (set in DB)
- [ ] Admin management UI (promote/demote users)
- [ ] Sync bookmarks to user account (after login)

## Event Management
- [x] User event submission (form + API)
- [x] Image upload for events
- [x] Admin dashboard for event approval/denial
- [x] Event editing by admin (with photo management)
- [x] Event status management:
  - [x] Pending (default for submitted events)
  - [x] Approved (approved events)
  - [x] Denied (rejected events)
  - [x] Featured (promoted events) ✅ **IMPLEMENTED**
  - [x] Cancelled (with status tracking) ✅ **IMPLEMENTED**
  - [x] Archived (historical events) ✅ **IMPLEMENTED**
- [x] Featured events carousel on homepage
- [x] Event search and filtering in admin
- [x] Database cleanup tools for old events
- [x] Event statistics and analytics
- [ ] Filter out non-public/invite-only events from main views
- [ ] Email notifications for event status (optional)
- [ ] Event editing/deletion by submitter (currently admin-only)

## Export & Communication
- [x] ICS export (all, filtered, or saved events)
- [x] RSS export (all, filtered, or saved events)
- [ ] Email digest/newsletter (future)
- [ ] Webhook/API for third-party integration

## UI/UX
- [x] Papyrus/parchment theme, generic branding
- [x] Responsive design
- [x] Custom calendar subscribe widget (tags/orgs)
- [x] Bookmarking UI (star/heart)
- [x] Admin dashboard with comprehensive features:
  - [x] Search and filter events
  - [x] Event status management (approve/deny/feature/cancel/archive)
  - [x] Event editing with photo management
  - [x] Event statistics and analytics
  - [x] Database cleanup tools
  - [x] Newsletter management
  - [ ] User dashboard (view/edit submitted events, bookmarks)
  - [ ] User management
  - [ ] System settings
  - [ ] Bulk actions (approve/deny/feature/cancel)

## Scraping & Data
- [x] Modular scraper system (Python, outputs JSON)
- [ ] Scraper admin UI (run, monitor, view logs)
- [ ] More data sources (add your own scrapers)

## Documentation
- [ ] Setup guide for new users (README)
- [ ] How to add new scrapers
- [ ] How to customize branding/theme
- [ ] How to deploy to Vercel
- [ ] How to set up database and roles

## Advanced/Future
- [ ] OAuth providers (GitHub, Microsoft, etc.)
- [ ] User notifications (email, in-app)
- [ ] Paid/featured events
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] API for mobile app

## Phase 1: Core Features (Current Focus)
- [x] Event Management System ✅ **IMPLEMENTED**
  - [x] Event submission and moderation
  - [x] Event status management (pending, approved, denied, featured, cancelled, archived)
  - [x] Featured events carousel
  - [x] Event editing and photo management
  - [x] Event search and filtering
  - [x] Database cleanup tools

- [x] Newsletter System ✅ **IMPLEMENTED**
  - [x] Mailchimp integration
  - [x] Newsletter dashboard
  - [x] Subscriber management
  - [x] Campaign creation and sending

- [ ] CLE Credit System
  - [ ] CLE credit tracking per event
  - [ ] Credit type categorization (Ethics, Skills, etc.)
  - [ ] Credit amount tracking
  - [ ] Credit verification process
  - [ ] CLE provider integration
  - [ ] Credit reporting system
  - [ ] User CLE credit history
  - [ ] CLE certificate generation

- [ ] Event Series Management
  - [ ] Recurring event creation
  - [ ] Series template system
  - [ ] Individual event customization
  - [ ] Series-wide updates
  - [ ] Attendance tracking per session
  - [ ] Series analytics
  - [ ] Waitlist management
  - [ ] Capacity tracking

- [ ] Basic Monetization
  - [x] Featured event listings ✅ **IMPLEMENTED**
  - [ ] Organization profiles
  - [ ] Basic sponsorship options
  - [ ] Payment processing integration
  - [ ] Invoice generation
  - [ ] Basic analytics

## Admin Panel
- [x] Admin Dashboard ✅ **IMPLEMENTED**
  - [x] Event moderation queue (pending, approved, denied, featured, cancelled, archived)
  - [x] Event search and filtering
  - [x] Event editing with photo management
  - [x] Event statistics and analytics
  - [x] Database cleanup tools
  - [x] Newsletter management (separate dashboard)
  - [ ] User management
  - [ ] System settings
  - [ ] Log viewer
  - [ ] Audit trail
  - [ ] Backup management
  - [ ] API key management

- [x] Content Management ✅ **IMPLEMENTED**
  - [x] Event status management (approve, deny, feature, cancel, archive)
  - [x] Featured events management
  - [x] Newsletter management
  - [x] Event categorization system
  - [ ] Bulk event operations
  - [ ] Resource management
  - [ ] Tag management
  - [ ] Location management
  - [ ] Organization profiles

## Scraping Enhancements
- [ ] Additional Sources
  - [x] NYSBA (New York State Bar Association) - https://nysba.org/live-programs/all-programs/
  - [x] Brooklyn Bar Association - https://brooklynbar.org/?pg=events&evAction=viewMonth
  - [ ] Queens County Bar Association - https://members.qcba.org/qcba-events-and-education-calendar (✅ Active events confirmed, requires browser automation)
  - [ ] Metropolitan Black Bar Association - https://mbbanyc.org/events/upcoming-events/#cid=1754&wid=1201
  - [x] Asian American Bar Association of New York - https://www.aabany.org/events/event_list.asp
  - [x] Hispanic National Bar Association - https://hnba.com/events/
  - [x] LGBT Bar Association of Greater New York - https://www.lgbtbarny.org/upcoming-events
  - [x] Women's Bar Association of the State of New York - https://www.wbasny.org/events/
  - [x] National Association of Women Lawyers - https://nawl.app.neoncrm.com/np/clients/nawl/publicaccess/eventCalendarBig.jsp?year=2025&month=5
  - [x] Federal Bar Association - https://www.fedbar.org/events/
  - [ ] Seramount - https://seramount.com/events-conferences/
  - [ ] New York Law School - https://www.nyls.edu/events/
  - [ ] Cardozo Law - https://cardozo.yu.edu/events?field_end_date_value=1&field_event_audience_tag_value=2&tid=All&select_type_option=All
  - [ ] Lawline - https://www.lawline.com/cle/courses/webcast?format=Webcast (✅ Created, ⚠️ API endpoint returning 404 - needs investigation)
  - [ ] Practicing Law Institute - https://www.pli.edu/search?ContentTabs=Programs
  - [ ] NYU Law Institute for Corporate Governance - https://www.law.nyu.edu/centers/icgf/events NO recent
  - [x] ChIPs - https://network.chipsnetwork.org/events
  - [ ] Brooklyn Law School - https://www.brooklaw.edu/news-and-events/events/
  - [x] CUNY School of Law - https://www.law.cuny.edu/events/
  - [ ] Columbia Law School
  - [ ] St. John's University School of Law - https://www.stjohns.edu/events (⚠️ Dynamic content via TeamUp calendar, requires browser automation)
  - [ ] Legal Aid Society
  - [ ] Legal Services NYC
  - [ ] National Lawyers Guild - NYC Chapter
  - [x] Barker Gilmore - https://barkergilmore.com/gc-advantage-webinars/
  - [x] The L Suite - https://www.lsuite.co/events ✅ **FIXED 2025-06-28**
  - [ ] Major, Lindsey & Africa - https://www.mlaglobal.com/en/insights#94c43f95-2882-4674-904e-3546d67aa716facet=Content%20Type:Webinars
  - [ ] Law.com - https://www.law.com/events/
  - [ ] Morgan Lewis - https://www.morganlewis.com/events/global-public-company-academy
  - [ ] Kilpatrick - https://events.zoom.us/eo/Av2cDH_dxJcMRgGd_RUApCT3LYo24WXLsVl4PQ4dKB9OnZ9g9zki~AggLXsr32QYFjq8BlYLZ5I06Dg
  - [ ] American Bar Association - https://www.americanbar.org/events-cle/
  - [x] Association of Corporate Counsel - https://www.acc.com/education-events
  - [ ] Federal Bar Council - https://www.federalbarcouncil.org/calendar/events/
  - [ ] NYIPLA - https://www.nyipla.org/nyipla/Events.asp
  - [ ] **NEW ADDITIONS FROM FRIEND'S LIST:**
  - [ ] New York County Lawyers Association - https://www.nycla.org/events/
  - [ ] Bronx Bar Association - https://www.bronxbar.com/events/
  - [ ] Metropolitan Black Bar Association - https://mbbanyc.org/events/upcoming-events/
  - [x] New York City Bar Association - https://www.nycbar.org/for-members/events
  - [x] Fordham Law School - https://www.fordham.edu/school-of-law/events/
  - [x] Lawyers Alliance for New York - https://www.lawyersalliance.org/events/
  - [x] New York International Arbitration Center - https://nyiac.org/events/

- [ ] Scraper Improvements
  - [ ] Error handling and retry logic
  - [ ] Rate limiting implementation
  - [ ] Proxy support
  - [ ] Scraping status monitoring
  - [ ] Automated testing for scrapers
  - [ ] Data validation and cleaning
  - [ ] Duplicate detection
  - [ ] Geocoding for locations
  - [x] CLE credit extraction (implemented in scrapers)
  - [x] Registration link extraction (implemented in scrapers)
  - [ ] Handle image-based events (some organizations store events as images/PDFs making scraping impossible)
  - [ ] NAWL events may be image-based - need special handling for calendar view and detail pages
  - [ ] Centralize scraping logic for easier maintenance

## Design & UI/UX
- [ ] Visual Design
  - [ ] Modern, professional theme
  - [ ] Responsive design improvements
  - [ ] Dark mode support
  - [ ] Custom illustrations/icons
  - [ ] Loading states and animations
  - [ ] Accessibility compliance (WCAG 2.1)
  - [ ] Print-friendly styles
  - [ ] Brand guidelines

- [ ] User Experience
  - [ ] Advanced search and filtering
  - [ ] Map view for events
  - [ ] Event recommendations
  - [ ] Social sharing
  - [ ] Mobile app consideration
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Multi-language support
  - [ ] Event comparison tool

## Technical Improvements
- [ ] Performance
  - [ ] Caching implementation
  - [ ] Image optimization
  - [ ] Code splitting
  - [ ] API response optimization
  - [ ] Database indexing
  - [ ] CDN integration
  - [ ] Service worker for offline support
  - [ ] Lazy loading
  - [ ] Performance monitoring

- [ ] Security
  - [ ] Rate limiting
  - [ ] Input validation
  - [ ] XSS protection
  - [ ] CSRF protection
  - [ ] Security headers
  - [ ] GDPR compliance
  - [ ] Data encryption
  - [ ] Regular security audits
  - [ ] Privacy policy
  - [ ] Terms of service

## Documentation
- [ ] User Documentation
  - [ ] User guides
  - [ ] FAQ section
  - [ ] Video tutorials
  - [ ] Help center
  - [ ] Knowledge base
  - [ ] Community guidelines
  - [ ] Best practices
  - [ ] Troubleshooting guides

- [ ] Technical Documentation
  - [ ] API documentation
  - [ ] Deployment guide
  - [ ] Development setup guide
  - [ ] Contributing guidelines
  - [ ] Architecture overview
  - [ ] Database schema
  - [ ] Security protocols
  - [ ] Monitoring setup

## Phase 2: Advanced Features
- [ ] Advanced Monetization
  - [ ] Premium event features
  - [ ] Advanced sponsorship packages
  - [ ] Advertising platform
  - [ ] Partnership programs
  - [ ] Revenue analytics
  - [ ] Custom pricing tiers
  - [ ] Promotional tools

- [ ] Enhanced CLE Features
  - [ ] Multi-state CLE tracking
  - [ ] Automated credit reporting
  - [ ] CLE provider dashboard
  - [ ] Credit transfer system
  - [ ] Compliance monitoring
  - [ ] Credit expiration tracking
  - [ ] Bulk credit management

- [ ] Advanced Event Series
  - [ ] Hybrid event support
  - [ ] Session recording
  - [ ] Materials distribution
  - [ ] Interactive features
  - [ ] Series analytics
  - [ ] Custom branding
  - [ ] Advanced registration options

## Phase 3: Business Features
- [ ] Analytics & Reporting
  - [ ] Event attendance tracking
  - [ ] User engagement metrics
  - [ ] Traffic analysis
  - [ ] Conversion tracking
  - [ ] Custom reports
  - [ ] Data visualization
  - [ ] Export capabilities

- [ ] Integration & Partnerships
  - [ ] Third-party Services
    - [ ] Payment processing
    - [ ] Video conferencing
    - [ ] Document management
    - [ ] Survey tools
    - [ ] CRM integration
    - [ ] Marketing automation
    - [ ] Analytics platforms

  - [ ] Legal Community
    - [ ] Bar association partnerships
    - [ ] Law school collaborations
    - [ ] Legal tech integration
    - [ ] CLE provider partnerships
    - [ ] Professional organization connectionsg

## Business Development & Launch Tasks

### Planning & Strategy
- [x] Define purpose of the site (Priority 1) ✅ Start with NY
- [ ] Identify key features (Priority 1)
  - [ ] Search/filter events
  - [ ] Email newsletter signup
  - [ ] Social media integration
  - [ ] Advertising spots
  - [ ] Event submission form
  - [ ] Calendar view and/or map integration
- [x] Research competitors (Priority 1) ✅ None!
- [x] Project roadmap and timeline (Priority 1) ✅
- [ ] Identify event sources (Priority 1) - Initial list completed; need to research additional

### Development
- [x] Onboard developer (Priority 1) ✅ **COMPLETED** - Josh is onboarded
- [x] Decide webhost (Priority 1) ✅ **COMPLETED** - Using Vercel/Next.js
- [x] Design wireframes and layout (Priority 1) ✅ **COMPLETED** - Professional design implemented
- [x] Build website: front-end (Priority 1) ✅ **COMPLETED** - Responsive UI with Tailwind CSS
- [x] Build website: back-end (Priority 1) ✅ **COMPLETED** - Next.js API routes, Prisma database
- [x] Integrate newsletter/email marketing tools (Priority 2) ✅ **COMPLETED** - Mailchimp integration
- [ ] Set up analytics and tracking (Priority 1)
  - [ ] Google Analytics 4
  - [ ] Meta Pixel
  - [ ] Event click tracking
  - [ ] UTM parameters
- [ ] Test performance (Priority 2)
- [ ] Launch beta for feedback (Priority 3)
- [ ] Monitor bounce rate

### Content Creation
- [x] Content strategy (Priority 1) ✅ **COMPLETED** - Newsletter system implemented
- [x] Voice and tone (Priority 1) ✅ **COMPLETED** - Professional legal events focus
- [x] SEO keywords (Priority 2) ✅ **COMPLETED** - Basic SEO implemented
- [x] Draft About page (Priority 2) ✅ **COMPLETED** - Professional about page
- [ ] Draft T&Cs (Priority 2)
- [ ] Content calendar (Priority 3) - Newsletter, social media
- [ ] Monitor open rate and click rate (Priority 3)

### Marketing and Social Media
- [ ] Logo (Priority 1)
- [ ] Aesthetics (Priority 1)
- [ ] LinkedIn account (Priority 2)
- [ ] Instagram account (Priority 3)
- [ ] X account (Priority 2)
- [ ] Design profile images and banners (Priority 2)
- [ ] Plan initial campaign (Priority 2) - "Coming soon", first featured events
- [ ] Create a subscriber magnet (Priority 3)
- [ ] Collect emails pre-launch (Priority 2)
- [ ] Plan email marketing (Priority 3)
- [ ] Launch digital ads (Priority 3) - Track ROI with UTM codes and landing pages

### Monetization
- [ ] Create ad inventory map (Priority 1)
  - [ ] Homepage banner
  - [ ] Sidebar ads
  - [ ] Sponsored event slots
  - [ ] Newsletter ad placements
- [ ] Set up ad tracking infrastructure (Priority 2)
  - [ ] Google Ad Manager or custom tracking
  - [ ] Impression and clickthrough reporting
  - [ ] UTM parameters for sponsored links
- [ ] Create a media kit (Priority 2)
  - [ ] Audience demographics
  - [ ] Monthly traffic/subscriber numbers
  - [ ] Ad formats and sizes
  - [ ] Pricing tiers
- [ ] Establish ad policies (Priority 2)
- [ ] Establish process for replacing ads (Priority 3)
- [ ] Set initial ad rates (Priority 2) - Flat monthly rate, flat per-email rate
- [ ] Identify potential advertisers (Priority 2)
- [ ] Create CRM (Priority 2)
- [ ] Draft outreach templates (Priority 2)
  - [ ] Intro pitch
  - [ ] "Why advertise with us" one-pager
- [ ] Track performance of paid ads (Priority 3)

### Admin and Legal
- [x] Domain name (Priority 1) ✅ lawyerevents.net - GoDaddy
- [x] Set up business email (Priority 2) ✅ lawyerevents@gmail.com
- [ ] Agreement with Josh (Priority 1)
- [ ] T&Cs (Priority 3) - Liability disclaimers
- [ ] Privacy policy (Priority 3)
- [ ] Cookie compliance (Priority 3)
- [ ] Create and track budget (Priority 2)
- [ ] Bank account (Priority 3) - Confirm can use Chase, Zelle and PayPal