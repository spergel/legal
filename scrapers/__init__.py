import os
from .models import Event
from .base_scraper import BaseScraper
from .nycbar_scraper import NYCBarScraper
from .fordham_scraper import FordhamScraper
from .lawyers_alliance_scraper import LawyersAllianceScraper
from .google_calendar_scraper import GoogleCalendarScraper
from .ics_calendar_scraper import ICSCalendarScraper
from .cuny_law_ics_scraper import CUNYLawICSScraper
from .chips_network_scraper import ChIPsNetworkScraper
from .lawline_scraper import LawlineScraper

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

__all__ = [
    'Event',
    'BaseScraper',
    'NYCBarScraper',
    'FordhamScraper',
    'LawyersAllianceScraper',
    'GoogleCalendarScraper',
    'ICSCalendarScraper',
    'CUNYLawICSScraper',
    'ChIPsNetworkScraper',
    'LawlineScraper',
] 