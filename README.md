# Legal Events Calendar

A web application that aggregates legal events from various sources including law schools, bar associations, and legal organizations in New York City.

## Features

- Aggregates events from multiple sources:
  - NYC Bar Association
  - NYIAC (New York International Arbitration Center)
  - Fordham Law School
  - Columbia Law School
  - CUNY Law School
  - Lawyers Alliance
  - Google Calendar feeds
  - ICS Calendar feeds

- Automated scraping and data collection
- Modern web interface
- Event categorization and filtering
- Location-based event discovery

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/legal.git
cd legal
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env.local` file in the root directory with:
```
GOOGLE_API_KEY=your_google_api_key
```

5. Run the scrapers:
```bash
python scrapers/cron_handler.py
```

## Local Development Workflow

For local development and testing, you can run scrapers locally and import events into your local database:

### Running Scrapers Locally

1. Navigate to the scrapers directory:
```bash
cd scrapers
```

2. Run all scrapers locally:
```bash
python run_all_scrapers_local.py
```

This will:
- Run all available scrapers
- Save events to JSON files in `scrapers/data/`
- Generate a summary report

### Importing Events to Local Database

1. Import scraped events into your local database:
```bash
node scripts/import-scraped-events.js
```

This will:
- Read all JSON files from `scrapers/data/`
- Import events into your local Prisma database
- Handle data sanitization and validation
- Update existing events or create new ones

### Complete Local Workflow

```bash
# 1. Run scrapers locally
cd scrapers
python run_all_scrapers_local.py

# 2. Import to database
cd ..
node scripts/import-scraped-events.js

# 3. Start development server
npm run dev
```

**Note:** This local workflow is for development only. When you push to GitHub, the production workflow will use the database directly.

## Development

- Scrapers are located in the `scrapers/` directory
- Each scraper inherits from `BaseScraper` in `base_scraper.py`
- Configuration for calendars is in `calendar_configs.py`
- Event data is stored in `public/data/`

## Deployment

This project is deployed on Vercel. The deployment process is automated through GitHub Actions.

### Environment Variables for Vercel

Set these in your Vercel project settings:
- `GOOGLE_API_KEY`: Your Google Calendar API key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

This will:
- Read all JSON files from `scrapers/data/`
- Import events into your local Prisma database
- Handle data sanitization and validation
- Update existing events or create new ones

### Complete Local Workflow

```bash
# 1. Run scrapers locally
cd scrapers
python run_all_scrapers_local.py

# 2. Import to database
cd ..
node scripts/import-scraped-events.js

# 3. Start development server
npm run dev
```

**Note:** This local workflow is for development only. When you push to GitHub, the production workflow will use the database directly.

## Development

- Scrapers are located in the `scrapers/` directory
- Each scraper inherits from `BaseScraper` in `base_scraper.py`
- Configuration for calendars is in `calendar_configs.py`
- Event data is stored in `public/data/`

## Deployment

This project is deployed on Vercel. The deployment process is automated through GitHub Actions.

### Environment Variables for Vercel

Set these in your Vercel project settings:
- `GOOGLE_API_KEY`: Your Google Calendar API key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
