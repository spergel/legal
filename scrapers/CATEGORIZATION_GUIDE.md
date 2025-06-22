# Event Categorization Guide

This guide explains how to use the `categorization_helper.py` module for consistent event tagging across all scrapers.

## Quick Start

```python
from categorization_helper import EventCategorizer

# Basic usage - automatically categorize an event
base_categories = ['Bar Association', 'Legal Events']
categories = EventCategorizer.categorize_event(
    title="Immigration Law CLE Workshop", 
    description="Learn about family law issues. 2.5 CLE credits available.",
    base_categories=base_categories
)
# Result: ['Bar Association', 'Legal Events', 'Immigration', 'Family Law', 'CLE']
```

## Available Tags

### Organization Types
- `Bar Association` - Professional bar organizations
- `Law School` - Academic institutions  
- `CLE Provider` - Professional education providers
- `Legal Services` - Pro bono and legal aid organizations
- `Professional Organization` - Industry associations
- `Government` - Government agencies
- `Nonprofit` - Nonprofit organizations

### Event Types
- `CLE` - Continuing Legal Education events
- `Networking` - Meetups, receptions, social events
- `Conference` - Large multi-day events
- `Virtual` - Online/webinar events
- `Workshop` - Hands-on training sessions

### Practice Areas (Auto-detected)
The helper automatically detects 35+ practice areas including:
- Criminal Law, Civil Rights, Immigration, Family Law
- Corporate Law, Environmental Law, Health Law, Tax Law
- Real Estate, Intellectual Property, Labor Law
- Constitutional Law, International Law, Bankruptcy
- And many more...

### Specialty Tags
- `Women in Law`, `LGBTQ+`, `Asian American`, `Hispanic`
- `African American`, `Veterans`, `Young Lawyers`
- `Solo/Small Firm`, `In-House Counsel`, `Technology`
- `Federal Bar`, `International`, `Pro Bono`

## Usage Examples

### Basic Categorization
```python
from categorization_helper import EventCategorizer

# For a bar association event
categories = EventCategorizer.categorize_event(
    title="Ethics in Corporate Law",
    description="CLE workshop on professional responsibility",
    base_categories=['Bar Association', 'Legal Events']
)
# Result: ['Bar Association', 'Legal Events', 'Corporate Law', 'CLE']
```

### Individual Checks
```python
# Check if it's a CLE event
is_cle = EventCategorizer.is_cle_event("Professional Responsibility Course")  # True

# Check if it's networking
is_networking = EventCategorizer.is_networking_event("Annual Reception")  # True

# Extract practice areas
areas = EventCategorizer.extract_practice_areas("Immigration and Family Law Seminar")
# Result: ['Immigration', 'Family Law']
```

### Organization-Specific Categories
```python
# For specialty bar associations
lgbt_categories = ['Bar Association', 'Legal Events', 'LGBTQ+']
women_categories = ['Bar Association', 'Legal Events', 'Women in Law']
hispanic_categories = ['Bar Association', 'Legal Events', 'Hispanic']

# For law schools
law_school_categories = ['Law School', 'Legal Events', 'Academic']

# For CLE providers
cle_provider_categories = ['CLE Provider', 'Legal Events']
```

## Migration from Custom Methods

### Before (Custom Methods)
```python
def _is_cle_event(self, title, description):
    # Custom logic...
    
def _extract_practice_areas(self, title, description):
    # Custom logic...
    
# Usage
categories = ['Bar Association', 'Legal Events']
if self._is_cle_event(title, description):
    categories.append('CLE')
practice_areas = self._extract_practice_areas(title, description)
categories.extend(practice_areas)
```

### After (Using Helper)
```python
from categorization_helper import EventCategorizer

# Usage
base_categories = ['Bar Association', 'Legal Events']
categories = EventCategorizer.categorize_event(title, description, base_categories)
```

## Benefits

1. **DRY (Don't Repeat Yourself)** - One centralized categorization logic
2. **Consistency** - All scrapers use the same tagging criteria
3. **Maintainability** - Update categorization logic in one place
4. **Comprehensive** - 35+ practice areas and extensive keyword matching
5. **Extensible** - Easy to add new tags and categories

## Scraper Integration Checklist

When updating a scraper to use the helper:

1. ✅ Add import: `from categorization_helper import EventCategorizer`
2. ✅ Replace custom categorization logic with `EventCategorizer.categorize_event()`
3. ✅ Remove old helper methods (`_is_cle_event`, `_extract_practice_areas`, etc.)
4. ✅ Test the scraper to ensure categories are properly assigned
5. ✅ Update any scraper-specific base categories as needed 