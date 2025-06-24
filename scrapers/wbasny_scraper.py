from .ics_calendar_scraper import ICSCalendarScraper

class WBASNYScraper(ICSCalendarScraper):
    def __init__(self, community_id="com_wbasny"):
        super().__init__(
            community_id=community_id,
            url="https://www.wbasny.org/?post_type=tribe_events&ical=1&eventDisplay=list"
        )