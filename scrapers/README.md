# Legal Events Scrapers

This directory contains scrapers for various legal events sources in New York City. The scrapers are designed to collect event information and output it in a standardized format.

## Directory Structure

```
scrapers/
├── __init__.py           # Package initialization
├── base_scraper.py       # Base scraper class
├── models.py            # Standardized event model
├── cron_handler.py      # Cron job handler
├── requirements.txt     # Python dependencies
└── scrapers/           # Individual scrapers
    ├── __init__.py
    ├── nycbar/         # NYC Bar Association scraper
    ├── fordham/        # Fordham Law scraper
    ├── lawyers_alliance_scraper.py
    ├── google_calendar_scraper.py
    └── ics_calendar_scraper.py
```

## Event Model

All scrapers output events in a standardized format defined in `models.py`:

```python
class Event:
    id: str                    # Unique identifier
    name: str                  # Event name
    description: str | None    # HTML description
    startDate: str            # ISO date string
    endDate: str | None       # ISO date string
    locationId: str | None    # Reference to locations.json
    communityId: str | None   # Reference to communities.json
    image: str | None         # URL to event image
    price: dict | None        # Price information
    metadata: dict | None     # Additional metadata
    category: list[str] | None # Event categories
    tags: list[str] | None    # Additional tags
```

## Usage

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run a specific scraper:
```bash
python -m scrapers.scrapers.nycbar.scraper
python -m scrapers.scrapers.fordham.scraper
```

3. Run all scrapers:
```bash
python -m scrapers.cron_handler
```

## Output

Scrapers save their output in the `data/` directory:
- Individual scraper outputs: `data/{scraper_name}_events.json`
- Combined output: `data/all_events_combined.json`

The combined output has the following structure:
```json
{
  "last_updated_utc": "2024-01-01T00:00:00Z",
  "total_events_combined": 100,
  "events": [
    {
      "id": "unique_id",
      "name": "Event Name",
      "description": "Event description...",
      "startDate": "2024-01-01T10:00:00",
      "endDate": "2024-01-01T11:00:00",
      "communityId": "com_nycbar",
      "metadata": {
        "cle_credits": "1.0 CLE credits",
        "source_url": "https://example.com/event",
        "venue": {
          "name": "Location Name",
          "type": "in-person"
        }
      },
      "price": {
        "type": "free",
        "amount": 0,
        "currency": "USD"
      },
      "category": ["CLE", "Webinar"],
      "tags": ["Criminal Law", "Ethics"]
    }
  ]
}
```

## Adding New Scrapers

To add a new scraper:

1. Create a new file in the `scrapers/` directory
2. Inherit from `BaseScraper`
3. Implement the `get_events()` method
4. Add the scraper to `scrapers/__init__.py`
5. Add the scraper to `cron_handler.py`

Example:
```python
from ..base_scraper import BaseScraper
from ..models import Event

class NewScraper(BaseScraper):
    def __init__(self, community_id: str):
        super().__init__(community_id)
        
    def get_events(self) -> List[Event]:
        # Implement scraping logic here
        pass
``` 