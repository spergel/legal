# WordPress Integration Guide

This guide explains how to integrate your Next.js legal events platform with WordPress for content management and publishing.

## 🎯 Overview

The integration allows you to:
- **Pull events** from your Next.js backend into WordPress
- **Submit events** from WordPress back to your backend
- **Manage events** through WordPress admin interface
- **Publish events** as WordPress posts with custom fields

## 🔗 API Endpoints

### 1. RSS Feed
**URL:** `https://lawyerevents.net/api/events/rss`

**Parameters:**
- `limit` (optional): Number of events to fetch (default: 50, max: 100)
- `status` (optional): Event status filter (default: "approved,featured")
- `community` (optional): Filter by community name

**Examples:**
```
https://lawyerevents.net/api/events/rss
https://lawyerevents.net/api/events/rss?limit=20&status=featured
https://lawyerevents.net/api/events/rss?community=NYC%20Bar
```

### 2. REST API
**URL:** `https://lawyerevents.net/api/events/wordpress`

**GET Request** - Fetch events as JSON:
```javascript
fetch('https://lawyerevents.net/api/events/wordpress?limit=20&status=approved,featured')
  .then(response => response.json())
  .then(data => console.log(data));
```

**POST Request** - Submit new event:
```javascript
fetch('https://lawyerevents.net/api/events/wordpress', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Legal Networking Event',
    description: 'Join us for networking...',
    start_date: '2024-02-15T18:00:00Z',
    end_date: '2024-02-15T20:00:00Z',
    location_name: 'NYC Bar Association',
    location_address: '42 W 44th St, New York, NY',
    community_name: 'NYC Bar',
    contact_email: 'events@nycbar.org',
    photo_url: 'https://example.com/event-photo.jpg',
    wordpress_id: '123' // WordPress post ID for reference
  })
});
```

## 🛠 WordPress Setup

### Step 1: Install Required Plugins

1. **Custom Post Type UI** - For creating event post types
2. **Advanced Custom Fields (ACF)** - For custom event fields
3. **WP REST API** - For API integration (usually built-in)

### Step 2: Create Event Post Type

1. Go to **CPT UI** → **Add/Edit Post Types**
2. Create new post type called "Legal Events"
3. Set slug to `legal-events`
4. Enable public, show in REST API, and show in admin

### Step 3: Create Custom Fields (ACF)

Create these custom fields for your event post type:

| Field Name | Field Type | Field Key |
|------------|------------|-----------|
| Event Start Date | Date Picker | `event_start_date` |
| Event End Date | Date Picker | `event_end_date` |
| Event Time | Time Picker | `event_time` |
| Location Name | Text | `location_name` |
| Location Address | Textarea | `location_address` |
| Community | Text | `community_name` |
| Contact Email | Email | `contact_email` |
| Event Photo | Image | `event_photo` |
| External Event ID | Text | `external_event_id` |
| Event Status | Select | `event_status` |

### Step 4: Create WordPress Functions

Add this to your theme's `functions.php`:

```php
<?php
// Fetch events from Next.js backend
function fetch_events_from_backend() {
    $response = wp_remote_get('https://lawyerevents.net/api/events/wordpress?limit=50&status=approved,featured');
    
    if (is_wp_error($response)) {
        return false;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (!$data['success']) {
        return false;
    }
    
    return $data['data'];
}

// Sync events to WordPress posts
function sync_events_to_wordpress() {
    $events = fetch_events_from_backend();
    
    if (!$events) {
        return;
    }
    
    foreach ($events as $event) {
        // Check if post already exists
        $existing_post = get_posts([
            'post_type' => 'legal-events',
            'meta_query' => [
                [
                    'key' => 'external_event_id',
                    'value' => $event['id'],
                    'compare' => '='
                ]
            ]
        ]);
        
        if (!empty($existing_post)) {
            // Update existing post
            $post_id = $existing_post[0]->ID;
            wp_update_post([
                'ID' => $post_id,
                'post_title' => $event['title'],
                'post_content' => $event['content'],
                'post_excerpt' => $event['excerpt'],
                'post_status' => 'publish'
            ]);
        } else {
            // Create new post
            $post_id = wp_insert_post([
                'post_title' => $event['title'],
                'post_content' => $event['content'],
                'post_excerpt' => $event['excerpt'],
                'post_type' => 'legal-events',
                'post_status' => 'publish'
            ]);
        }
        
        // Update custom fields
        if ($post_id) {
            update_field('event_start_date', $event['start_date'], $post_id);
            update_field('event_end_date', $event['end_date'], $post_id);
            update_field('location_name', $event['location']['name'] ?? '', $post_id);
            update_field('location_address', $event['location']['address'] ?? '', $post_id);
            update_field('community_name', $event['community']['name'] ?? '', $post_id);
            update_field('contact_email', $event['submitted_by'] ?? '', $post_id);
            update_field('event_photo', $event['photo'], $post_id);
            update_field('external_event_id', $event['id'], $post_id);
            update_field('event_status', $event['status'], $post_id);
        }
    }
}

// Submit event to Next.js backend
function submit_event_to_backend($post_id) {
    // Only run for legal-events post type
    if (get_post_type($post_id) !== 'legal-events') {
        return;
    }
    
    $post = get_post($post_id);
    
    // Get custom field values
    $start_date = get_field('event_start_date', $post_id);
    $end_date = get_field('event_end_date', $post_id);
    $location_name = get_field('location_name', $post_id);
    $location_address = get_field('location_address', $post_id);
    $community_name = get_field('community_name', $post_id);
    $contact_email = get_field('contact_email', $post_id);
    $event_photo = get_field('event_photo', $post_id);
    
    // Prepare data for API
    $event_data = [
        'title' => $post->post_title,
        'description' => $post->post_content,
        'start_date' => $start_date ? date('c', strtotime($start_date)) : null,
        'end_date' => $end_date ? date('c', strtotime($end_date)) : null,
        'location_name' => $location_name,
        'location_address' => $location_address,
        'community_name' => $community_name,
        'contact_email' => $contact_email,
        'photo_url' => $event_photo ? $event_photo['url'] : null,
        'wordpress_id' => $post_id
    ];
    
    // Submit to backend
    $response = wp_remote_post('https://lawyerevents.net/api/events/wordpress', [
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'body' => json_encode($event_data)
    ]);
    
    if (!is_wp_error($response)) {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($data['success']) {
            // Store the external event ID
            update_field('external_event_id', $data['data']['id'], $post_id);
        }
    }
}

// Hooks
add_action('save_post', 'submit_event_to_backend');
add_action('wp_ajax_sync_events', 'sync_events_to_wordpress');
add_action('wp_ajax_nopriv_sync_events', 'sync_events_to_wordpress');

// Add admin menu for manual sync
function add_events_sync_menu() {
    add_management_page(
        'Sync Events',
        'Sync Events',
        'manage_options',
        'sync-events',
        'events_sync_page'
    );
}
add_action('admin_menu', 'add_events_sync_menu');

function events_sync_page() {
    if (isset($_POST['sync_events'])) {
        sync_events_to_wordpress();
        echo '<div class="notice notice-success"><p>Events synced successfully!</p></div>';
    }
    ?>
    <div class="wrap">
        <h1>Sync Events</h1>
        <p>Click the button below to sync events from the Next.js backend to WordPress.</p>
        <form method="post">
            <input type="submit" name="sync_events" class="button button-primary" value="Sync Events Now">
        </form>
    </div>
    <?php
}
?>
```

### Step 5: Create Event Display Template

Create `single-legal-events.php` in your theme:

```php
<?php get_header(); ?>

<div class="container">
    <?php while (have_posts()) : the_post(); ?>
        <article class="event-detail">
            <header>
                <h1><?php the_title(); ?></h1>
                <div class="event-meta">
                    <?php if (get_field('event_start_date')): ?>
                        <p><strong>Date:</strong> <?php echo date('F j, Y', strtotime(get_field('event_start_date'))); ?></p>
                    <?php endif; ?>
                    
                    <?php if (get_field('location_name')): ?>
                        <p><strong>Location:</strong> <?php the_field('location_name'); ?></p>
                        <?php if (get_field('location_address')): ?>
                            <p><?php the_field('location_address'); ?></p>
                        <?php endif; ?>
                    <?php endif; ?>
                    
                    <?php if (get_field('community_name')): ?>
                        <p><strong>Hosted by:</strong> <?php the_field('community_name'); ?></p>
                    <?php endif; ?>
                    
                    <?php if (get_field('contact_email')): ?>
                        <p><strong>Contact:</strong> <a href="mailto:<?php the_field('contact_email'); ?>"><?php the_field('contact_email'); ?></a></p>
                    <?php endif; ?>
                </div>
            </header>
            
            <?php if (get_field('event_photo')): ?>
                <div class="event-photo">
                    <?php $image = get_field('event_photo'); ?>
                    <img src="<?php echo $image['url']; ?>" alt="<?php echo $image['alt']; ?>">
                </div>
            <?php endif; ?>
            
            <div class="event-content">
                <?php the_content(); ?>
            </div>
        </article>
    <?php endwhile; ?>
</div>

<?php get_footer(); ?>
```

## 🔄 Workflow Options

### Option 1: WordPress as Primary CMS
1. **Create events in WordPress** → Auto-submit to Next.js backend
2. **Manage events in WordPress admin** → Sync to backend
3. **Display events on WordPress site** → Pull from backend for consistency

### Option 2: Next.js as Primary Source
1. **Create events in Next.js admin** → Auto-sync to WordPress
2. **WordPress displays events** → Pull from Next.js RSS/API
3. **WordPress can submit new events** → Back to Next.js for approval

### Option 3: Bidirectional Sync
1. **Events created anywhere** → Sync to both systems
2. **Changes in either system** → Update the other
3. **Single source of truth** → Next.js backend database

## 🚀 Deployment Steps

1. **Set up WordPress site** with required plugins
2. **Add the PHP functions** to your theme
3. **Create custom post type** and fields
4. **Test the API endpoints** from your Next.js app
5. **Run initial sync** to populate WordPress
6. **Set up automated sync** (cron job or manual)

## 🔧 Advanced Features

### Automated Sync with Cron
```php
// Add to wp-config.php or use a plugin
if (!wp_next_scheduled('sync_events_cron')) {
    wp_schedule_event(time(), 'hourly', 'sync_events_cron');
}
add_action('sync_events_cron', 'sync_events_to_wordpress');
```

### Event Status Management
- WordPress can update event status
- Send status changes back to Next.js
- Sync approval/denial workflows

### Custom Event Categories
- Create WordPress taxonomies for event types
- Sync categories between systems
- Filter events by category

## 📊 Benefits

✅ **WordPress Admin Interface** - Familiar CMS for content creators  
✅ **SEO Optimization** - WordPress SEO plugins and tools  
✅ **Content Management** - Easy editing and publishing workflow  
✅ **User Management** - WordPress user roles and permissions  
✅ **Plugin Ecosystem** - Access to thousands of WordPress plugins  
✅ **Backup & Security** - WordPress backup and security solutions  

## 🔗 Next Steps

1. **Choose your workflow** (WordPress primary vs Next.js primary)
2. **Set up WordPress site** with the provided code
3. **Test the integration** with sample events
4. **Customize the templates** to match your design
5. **Set up automated sync** for production use

This integration gives you the best of both worlds - the powerful event management of your Next.js app with the familiar content management of WordPress!
