import os
from .models import Event
from .base_scraper import BaseScraper
from .scrapers import (
    NYCBarScraper,
    FordhamScraper,
    LawyersAllianceScraper,
    GoogleCalendarScraper,
    ICSCalendarScraper,
)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

__all__ = [
    'Event',
    'BaseScraper',
    'NYCBarScraper',
    'FordhamScraper',
    'LawyersAllianceScraper',
    'GoogleCalendarScraper',
    'ICSCalendarScraper',
] 