# Event Calendar Template - TODO List

## Core Features (Current)
- [x] User authentication (NextAuth.js, Google sign-in)
- [x] Database-backed user and admin roles (Prisma, PlanetScale/MySQL)
- [x] Event submission form (with image upload)
- [x] Event moderation dashboard for admins
- [x] ICS and RSS export (all, filtered, or saved events)
- [x] Bookmark/save events (localStorage, future: sync to user)
- [x] Custom calendar/RSS feeds by tag/org
- [x] Generic, rebrandable UI and codebase

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
- [ ] Email notifications for event status (optional)
- [ ] Event editing/deletion by submitter or admin
- [ ] Event status management:
  - [ ] Scraped (default for web-scraped events)
  - [ ] Featured (promoted events)
  - [ ] Cancelled (with optional reason)
  - [ ] Archived (historical events)

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
- [ ] User dashboard (view/edit submitted events, bookmarks)
- [ ] Admin dashboard improvements:
  - [ ] Search and filter events
  - [ ] Bulk actions (approve/deny/feature/cancel)
  - [ ] Event status management
  - [ ] Analytics overview
  - [ ] User management
  - [ ] System settings

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
  - [ ] Featured event listings
  - [ ] Organization profiles
  - [ ] Basic sponsorship options
  - [ ] Payment processing integration
  - [ ] Invoice generation
  - [ ] Basic analytics

## Admin Panel
- [ ] Admin Dashboard
  - [ ] User management
  - [ ] Event moderation queue
  - [ ] Analytics and statistics
  - [ ] System settings
  - [ ] Log viewer
  - [ ] Audit trail
  - [ ] Backup management
  - [ ] API key management

- [ ] Content Management
  - [ ] Bulk event operations
  - [ ] Event categorization
  - [ ] Featured events management
  - [ ] Resource management
  - [ ] Newsletter management
  - [ ] Tag management
  - [ ] Location management
  - [ ] Organization profiles

## Scraping Enhancements
- [ ] Additional Sources
  - [ ] NYSBA (New York State Bar Association)
  - [ ] Brooklyn Bar Association
  - [ ] Queens County Bar Association
  - [ ] Bronx County Bar Association
  - [ ] Staten Island Bar Association
  - [ ] CUNY School of Law
  - [ ] NYU School of Law
  - [ ] Columbia Law School
  - [ ] Cardozo School of Law
  - [ ] St. John's School of Law
  - [ ] Legal Aid Society
  - [ ] Legal Services NYC
  - [ ] National Lawyers Guild - NYC Chapter
  - [ ] Asian American Bar Association of New York
  - [ ] Metropolitan Black Bar Association

- [ ] Scraper Improvements
  - [ ] Error handling and retry logic
  - [ ] Rate limiting implementation
  - [ ] Proxy support
  - [ ] Scraping status monitoring
  - [ ] Automated testing for scrapers
  - [ ] Data validation and cleaning
  - [ ] Duplicate detection
  - [ ] Geocoding for locations
  - [ ] CLE credit extraction
  - [ ] Registration link extraction

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
    - [ ] Professional organization connections 