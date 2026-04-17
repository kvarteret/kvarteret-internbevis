# PostHog Analytics Spec

This repository implements the **mobile app** side of the shared Kvarteret analytics taxonomy.
The website should mirror the same event names and shared properties in its own codebase.

## Shared Properties

Every app event is sent with these default properties:

- `surface`: `mobile_app`
- `product`: `kvarteret`
- `app_area`: inferred from the current route
- `auth_state`: `identified`, `anonymous`, or `signed_out`
- `platform`: the runtime platform
- `language`: current app language

Shared funnel property values:

- `funnel_area`: `account`
- `funnel_area`: `events`
- `funnel_area`: `feedback`
- `funnel_area`: `volunteer`

The website should use the same property names, but set `surface` to `website`.

## Event Taxonomy

### Account Funnel

- `auth_code_requested`
  - Properties: `funnel_area`, `login_method`, `request_source`
- `auth_code_request_failed`
  - Properties: `funnel_area`, `login_method`, `request_source`
- `auth_login_succeeded`
  - Properties: `funnel_area`, `login_method`
- `auth_login_failed`
  - Properties: `funnel_area`, `login_method`
- `auth_deeplink_login_succeeded`
  - Properties: `funnel_area`, `login_method`
- `auth_deeplink_login_failed`
  - Properties: `funnel_area`, `login_method`
- `auth_clipboard_link_used`
  - Properties: `funnel_area`, `has_token`
- `auth_continue_anonymous`
  - Properties: `funnel_area`

### Volunteer Funnel

- `volunteer_cta_clicked`
  - Properties: `funnel_area`, `destination_type`, `destination_url`, `destination_host`, `link_location`

### Events Funnel

- `event_opened`
  - Properties: `funnel_area`, `event_id`, `event_title`, `event_type_slug`, `organizer_group_slugs`, `is_featured`, `visibility`
- `event_ticket_cta_clicked`
  - Properties: `funnel_area`, `event_id`, `event_title`, `event_type_slug`, `is_featured`, `visibility`, `destination_type`, `destination_url`, `destination_host`
- `event_facebook_cta_clicked`
  - Properties: `funnel_area`, `event_id`, `event_title`, `event_type_slug`, `is_featured`, `visibility`, `destination_type`, `destination_url`, `destination_host`

### Feedback Funnel

- `feedback_submitted`
  - Properties: `funnel_area`, `contact_allowed`, `has_contact_email`, `is_logged_in`
- `feedback_submit_failed`
  - Properties: `funnel_area`, `contact_allowed`, `has_contact_email`, `is_logged_in`

### Broad Product Events

- `menu_item_clicked`
  - Properties: `menu_item_id`, `destination`
- `about_external_link_clicked`
  - Properties: `destination_type`, `destination_url`, `destination_host`, `link_location`
- `profile_roles_updated`
  - Properties: `role_selection_count`, `role_names`, `role_groups`, `primary_role_name`, `primary_role_group`
- `games_dice_rolled`
  - Properties: `dice_type`, `result`, `dice_roll_count`
- `games_chess_timer_started`
  - Properties: `preset`, `initial_minutes_per_side`, `increment_seconds`, `active_player`
- `games_chess_timer_completed`
  - Properties: `preset`, `initial_minutes_per_side`, `increment_seconds`, `active_player`, `winner`, `move_count`
