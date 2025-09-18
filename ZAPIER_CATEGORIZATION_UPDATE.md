# Zapier Integration Update for Categorization

## 🎯 **New Fields Available in Your Events API**

Your events now include rich categorization data! Here's what's available:

### **Core Categorization Fields**
- `category` - Array of category strings (practice areas, organization types, etc.)
- `tags` - Array of tag strings (additional descriptive keywords)  
- `eventType` - Single string (CLE, Networking, Conference, etc.)
- `image` - Event image URL
- `price` - Pricing information object
- `metadata` - Additional event metadata object

## 📊 **Available Categories & Tags**

### **Practice Areas** (Auto-detected from event titles/descriptions)
- Criminal Law
- Civil Rights  
- Immigration
- Family Law
- Corporate Law
- Environmental Law
- Health Law
- Tax Law
- Real Estate
- Intellectual Property
- Labor Law
- Constitutional Law
- International Law
- Bankruptcy
- Estate Planning
- Employment Law
- Commercial Law
- Litigation
- Arbitration
- Mediation
- Securities Law
- Antitrust
- Privacy Law
- Cybersecurity
- White Collar Crime
- Elder Law
- Disability Law
- Education Law
- Energy Law
- Entertainment Law
- Government Law
- Healthcare Law
- Insurance Law
- Maritime Law
- Military Law
- Nonprofit Law
- Patent Law
- Personal Injury
- Public Interest
- Sports Law
- Trademark Law
- Transportation Law
- Veterans Law
- Workers Compensation

### **Event Types** (Auto-detected)
- `CLE` - Continuing Legal Education
- `Networking` - Social/networking events
- `Conference` - Multi-day conferences
- `Workshop` - Training sessions
- `Webinar` - Virtual presentations
- `Annual Dinner` - Formal dinners
- `Reception` - Social receptions
- `Gala` - Formal galas
- `General` - Default type

### **Organization Types**
- Bar Association
- Law School
- CLE Provider
- Legal Services
- Professional Organization
- Government
- Nonprofit

### **Specialty Groups**
- Women in Law
- LGBTQ+
- Asian American
- Hispanic
- African American
- Veterans
- Young Lawyers
- Solo/Small Firm
- In-House Counsel
- Technology
- Federal Bar
- International
- Pro Bono

## 🔄 **Updated Zapier Setup for Squarespace**

### **Step 1: Update Your Webhook URL**
Your existing webhook URL now returns richer data:
```
https://legal.somethingtodo.nyc/api/events/squarespace
```

### **Step 2: Updated Field Mapping**

**Basic Event Fields:**
- `title` → Squarespace Event Title
- `description` → Squarespace Event Description  
- `startDate` → Squarespace Start Date
- `endDate` → Squarespace End Date
- `location` → Squarespace Location
- `url` → Squarespace Event URL

**New Categorization Fields:**
- `categories` (array) → Squarespace Categories/Tags
- `tags` (array) → Squarespace Additional Tags
- `eventType` → Squarespace Event Type
- `hasCLE` → Squarespace CLE Badge/Field
- `cleCredits` → Squarespace CLE Credits
- `image` → Squarespace Featured Image
- `price` → Squarespace Pricing Info

### **Step 3: Enhanced Zapier Workflow**

#### **Option A: Simple Category Mapping**
```
Trigger: Webhook (your events API)
↓
Action 1: Squarespace Create Event
  - Title: {{title}}
  - Description: {{description}}
  - Categories: {{categories}} (join with commas)
  - Tags: {{tags}} (join with commas)
```

#### **Option B: Advanced Processing with Formatter**
```
Trigger: Webhook (your events API)
↓
Action 1: Formatter - Text (join categories)
  - Input: {{categories}}
  - Transform: Join with ", "
↓
Action 2: Formatter - Text (create event type badge)
  - Input: {{eventType}}
  - Transform: Add "Event Type: " prefix
↓
Action 3: Squarespace Create Event
  - Title: {{title}}
  - Description: {{description}}
  - Categories: Output from Step 1
  - Tags: Combined {{tags}} + {{eventType}}
  - Custom Fields: {{cleCredits}}, {{hasCLE}}
```

### **Step 4: Squarespace Custom Fields Setup**

Create these custom fields in your Squarespace Events collection:

1. **Event Type** (Text)
   - Maps to: `eventType`
   - Examples: "CLE", "Networking", "Conference"

2. **Practice Areas** (Text/Tags)
   - Maps to: `categories` (filtered for practice areas)
   - Examples: "Immigration", "Criminal Law", "Corporate Law"

3. **CLE Credits** (Number)
   - Maps to: `cleCredits`
   - Examples: 1.5, 2.0, 3.0

4. **Has CLE** (Toggle/Checkbox)
   - Maps to: `hasCLE`
   - Examples: true, false

5. **Event Tags** (Text/Tags)
   - Maps to: `tags`
   - Examples: "networking", "young-lawyers", "pro-bono"

6. **Organization** (Text)
   - Maps to: `communityText`
   - Examples: "NYSBA", "Brooklyn Bar", "NYC Bar"

## 🎨 **Sample Zapier Configurations**

### **Configuration 1: Legal Blog Posts**
```yaml
Trigger: New Event from API
Filter: Only events with category "CLE"
Action: Create Squarespace Blog Post
  Title: "CLE Opportunity: {{title}}"
  Content: "{{description}} - {{cleCredits}} CLE Credits Available"
  Categories: {{categories}}
  Tags: "CLE" + {{tags}}
```

### **Configuration 2: Event Calendar**
```yaml
Trigger: New Event from API
Action: Create Squarespace Event
  Title: {{title}}
  Description: {{description}}
  Start: {{startDate}}
  End: {{endDate}}
  Location: {{location}}
  Categories: {{categories}}
  Custom Fields:
    Event Type: {{eventType}}
    CLE Credits: {{cleCredits}}
    Practice Areas: {{categories}} (filtered)
    Organization: {{communityText}}
```

### **Configuration 3: Filtered by Practice Area**
```yaml
Trigger: New Event from API
Filter: categories contains "Immigration"
Action: Create Squarespace Event in "Immigration Events" collection
```

## 🔧 **Advanced Zapier Techniques**

### **Filter by Event Type**
```javascript
// In Zapier Filter step
return inputData.eventType === 'CLE';
```

### **Transform Categories**
```javascript
// In Zapier Code step
const categories = inputData.categories || [];
const practiceAreas = categories.filter(cat => 
  ['Immigration', 'Criminal Law', 'Corporate Law', 'Family Law'].includes(cat)
);
return {practiceAreas: practiceAreas.join(', ')};
```

### **Create Rich Descriptions**
```javascript
// In Zapier Code step
let description = inputData.description;

if (inputData.hasCLE && inputData.cleCredits) {
  description += `\n\n🎓 CLE Credits: ${inputData.cleCredits}`;
}

if (inputData.categories && inputData.categories.length > 0) {
  description += `\n\n📂 Practice Areas: ${inputData.categories.join(', ')}`;
}

return {enrichedDescription: description};
```

## 📊 **Sample Event Data Structure**

Here's what your webhook now receives:

```json
{
  "title": "Professional Responsibility CLE Workshop",
  "description": "2.5 CLE credits available for this ethics training",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-15T12:30:00Z",
  "location": "NYC Bar Association",
  "community": "NYSBA",
  "url": "https://nysba.org/event/123",
  
  "categories": ["Bar Association", "Legal Events", "CLE", "Professional Responsibility"],
  "tags": ["ethics", "professional-development", "mandatory"],
  "eventType": "CLE",
  "hasCLE": true,
  "cleCredits": 2.5,
  
  "image": "https://nysba.org/images/event123.jpg",
  "price": {"amount": 75, "currency": "USD", "members": 50},
  "metadata": {"registration_required": true, "capacity": 100}
}
```

## 🚀 **Quick Setup Steps**

1. **Update your Zapier webhook** to use the enhanced endpoint
2. **Add field mappings** for categories, tags, eventType
3. **Create custom fields** in Squarespace for CLE info
4. **Test with sample data** to ensure proper categorization
5. **Set up filters** for different event types if needed

## 🎯 **Pro Tips**

1. **Use Zapier Filters** to create separate workflows for CLE vs. Networking events
2. **Create rich content** by combining description + categories + CLE info
3. **Auto-tag events** based on practice areas for better organization
4. **Set up conditional logic** to handle different event types differently
5. **Use the `featured` parameter** to prioritize important events

Your events now have much richer data for better organization and discovery in Squarespace! 🎉
