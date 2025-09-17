import os
from .models import Event
from .base_scraper import BaseScraper
from .nycbar_scraper import NYCBarScraper
# from .fordham_scraper import FordhamScraper
# from .lawyers_alliance_scraper import LawyersAllianceScraper
# from .google_calendar_scraper import GoogleCalendarScraper
# from .ics_calendar_scraper import ICSCalendarScraper
# from .cuny_law_ics_scraper import CUNYLawICSScraper
from .chips_network_scraper import ChIPsNetworkScraper
from .lawline_scraper import LawlineScraper
from .lgbtbarny_scraper import LgbtBarNyScraper
from .nawl_scraper import NAWLScraper
from .nycbar_scraper import NYCBarScraper
from .nyiac_scraper import NYIACScraper
from .nysba_scraper import NYSBAScraper
from .wbasny_scraper import WBASNYScraper
# from .aabany_rss_scraper import AabanyRssScraper
# from .fedbar_ics_scraper import FBAICSScraper
# from .hnba_ics_scraper import HNBAICSScraper
from .barkergilmore_scraper import BarkerGilmoreScraper
from .brooklynbar_scraper import BrooklynBarScraper
from .lsuite_scraper import LSuiteScraper
from .acc_scraper import AccScraper

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

__all__ = [
    # 'AabanyRssScraper',
    'BarkerGilmoreScraper',
    'BrooklynBarScraper',
    'ChIPsNetworkScraper',
    # 'CUNYLawICSScraper',
    # 'FBAICSScraper',
    # 'FordhamScraper',
    # 'HNBAICSScraper',
    # 'ICSCalendarScraper',
    # 'LawyersAllianceScraper',
    'LgbtBarNyScraper',
    'LSuiteScraper',
    'NAWLScraper',
    'NYCBarScraper',
    'NYIACScraper',
    'NYSBAScraper',
    'WBASNYScraper',
    'AccScraper',
    # 'GoogleCalendarScraper',
] 