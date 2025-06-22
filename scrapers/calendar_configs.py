"""Calendar configurations for various sources"""

# NOTE: This file is only for configuration. Output paths are handled by the scrapers and base_scraper.py.

# Add a comment at the top explaining API key requirements
"""
For Google Calendar API to work properly:
1. Create a Google API key at https://console.cloud.google.com/
2. Enable the Google Calendar API for the project
3. Add the key to GitHub Secrets as GOOGLE_API_KEY or in .env.local file
4. Make sure your API key doesn't have API restrictions that block calendar.v3.Events.List

If you're seeing "Requests to this API calendar method calendar.v3.Events.List are blocked":
- Check that Calendar API is enabled in Google Cloud Console
- Remove any API restrictions or add Calendar API to allowed APIs
- Try deactivating and reactivating the Calendar API
"""

#TODO: Cozy Sundays nbqghatsg76q5hvuncn0eidonebg6pmj@import.calendar.google.com, https://lu.ma/cozy-sundays
# ICS Calendar configurations 
ICS_CALENDARS = {
    "cuny_law": {
        "id": "https://www.law.cuny.edu/events/list/?ical=1",
        "community_id": "com_cuny_law",
        "description": "CUNY School of Law events calendar"
    },
    "nycla": {
        "id": "https://calendar.google.com/calendar/ical/jpui6hg9pql8e0j0566cekscm77cmcju%40import.calendar.google.com/public/basic.ics",
        "community_id": "com_nycla",
        "description": "NYCLA events calendar"
    },
    "columbia_law": {
        "id": "https://calendar.google.com/calendar/ical/vqtgi9vnkl88s2n39moish96f5d9v4kc%40import.calendar.google.com/public/basic.ics",
        "community_id": "com_columbia_law",
        "description": "Columbia Law School's main public events calendar"
    }
    # "civic_techish_nyc": {
    #     "id": "https://api.lu.ma/ics/get?entity=calendar&id=cal-IS0wmeg4we7wiPa",
    #     "community_id": "com_civic_techish_nyc"
    # }
}

# Google Calendar configurations (DEPRECATED - switching to ICS format)
# GOOGLE_CALENDARS = {
#     "cuny_law": {
#         "id": "krqkapdfbru2ub08pdtfmjlv3g11kpd7@import.calendar.google.com",
#         "community_id": "com_cuny_law"
#     },
#     "nycla": {
#         "id": "jpui6hg9pql8e0j0566cekscm77cmcju@import.calendar.google.com",
#         "community_id": "com_nycla"
#     },
#     "columbia_law": {
#         "id": "vqtgi9vnkl88s2n39moish96f5d9v4kc@import.calendar.google.com",
#         "community_id": "com_columbia_law",
#         "description": "Columbia Law School's main public events calendar"
#     }
# }

# List of available scrapers
SCRAPERS = [
    'google_calendar_scraper',
    'ics_calendar_scraper',
    'cuny_law_ics_scraper',
    'chips_network_scraper',
    'lawline_scraper',
    
    #'substack_scraper',
    #'nyc_parks_scraper'
] 