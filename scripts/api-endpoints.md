# EroScripts (Discourse) API Reference

> All endpoints are on `https://discuss.eroscripts.com`.
> All read endpoints require `Accept: application/json` header to return JSON (without it, the server returns HTML for many routes).
> Endpoints marked **Auth required** return a 403 or redirect to login without a valid `_t` session cookie.
> Endpoints marked **Auth optional** return partial data anonymously and richer data when authenticated.

---

## Table of Contents

1. [Auth / Session](#auth--session)
2. [Topic Lists](#topic-lists)
3. [Category Topic Lists](#category-topic-lists)
4. [Tag Topic Lists](#tag-topic-lists)
5. [Topic Detail](#topic-detail)
6. [Posts](#posts)
7. [Search](#search)
8. [Users](#users)
9. [Notifications](#notifications)
10. [Bookmarks & Drafts](#bookmarks--drafts)
11. [Site Metadata](#site-metadata)
12. [Real-time: Message Bus](#real-time-message-bus)
13. [Not Implemented / 404](#not-implemented--404)
14. [Notes for ScriptStash App](#notes-for-scriptstash-app)

---

## Auth / Session

### `GET /session/current.json`

Returns the currently logged-in user object, or `{"current_user": null}` when anonymous.

**Auth:** Optional  
**Observed fields (`current_user`):**
`id`, `username`, `name`, `avatar_template`, `unread_notifications`,
`unread_high_priority_notifications`, `all_unread_notifications_count`,
`read_first_notification`, `admin`, `moderator`, `staff`, `trust_level`,
`can_edit`, `can_invite_to_forum`, `can_delete_account`, `can_post_anonymously`, `can_ignore_users`

**Use:** Verify that stored session cookies are still valid before making authenticated requests.

---

## Topic Lists

All topic list endpoints follow the same response shape:

```json
{
  "users": [...],
  "primary_groups": [...],
  "flair_groups": [...],
  "topic_list": {
    "can_create_topic": true,
    "more_topics_url": "/latest?no_definitions=true&page=1",
    "per_page": 30,
    "top_tags": [...],
    "topics": [...]
  }
}
```

### `GET /latest.json`

All latest topics site-wide.

**Params:**

- `page` (int, default 0) — zero-based page number
- `per_page` (int, max observed 50)
- `order` (`activity` | `created` | `views` | `posts` | `likes`)

**Auth:** Optional  
**Default per_page:** 30

---

### `GET /new.json`

Topics created in the last few days that the user hasn't visited.

**Params:** `page`  
**Auth:** Optional (meaningless without auth — returns empty for anonymous)

---

### `GET /unread.json`

Topics the user is watching/tracking with unread posts.

**Params:** `page`  
**Auth:** Required (returns empty anonymously)

---

### `GET /top.json`

Most active topics. Default period: `weekly`.

**Params:**

- `period` (`daily` | `weekly` | `monthly` | `quarterly` | `yearly` | `all`)
- `page`
- `per_page` (max 50)

**Observed:** Returns `topic_list.for_period` to confirm the active period.  
**Auth:** Optional

---

### `GET /hot.json`

Trending/hot topics (Discourse's algorithm-based selection).

**Params:** `page`  
**Auth:** Optional  
**Default per_page:** 30

---

## Category Topic Lists

Pattern: `/c/{slug}/{id}/l/{filter}.json`

Where `{filter}` is one of: `latest`, `new`, `unread`, `top`, `hot`, `unseen`

### Known categories on EroScripts

| ID  | Slug                 | Name               |
| --- | -------------------- | ------------------ |
| 5   | `scripts`            | Scripts (parent)   |
| 14  | `free-scripts`       | Free Scripts       |
| 15  | `paid-scripts`       | Paid Scripts       |
| 13  | `script-collections` | Script Collections |
| 8   | `general`            | General            |
| 9   | `software`           | Software           |
| 11  | `script-requests`    | Script Requests    |
| 12  | `help`               | Help               |
| 18  | `howto`              | How To             |
| 26  | `diy`                | DIY                |
| 32  | `review`             | Review             |
| 28  | `events`             | Events             |

---

### `GET /c/{slug}/{id}/l/latest.json`

**Params:**

- `page` (int, default 0)
- `per_page` (int, 30 default, 50 max)
- `order` (`activity` | `created`)
- `filter` (`default` | `new` | `unread`)
- `tags[]` — array of tag names (repeat param) e.g. `?tags[]=vr&tags[]=multi-axis`

**Auth:** Optional  
**Default per_page:** 30

**Sample topic object fields:**
`fancy_title`, `id`, `title`, `slug`, `posts_count`, `reply_count`,
`highest_post_number`, `image_url`, `created_at`, `last_posted_at`,
`bumped`, `bumped_at`, `archetype`, `unseen`, `pinned`, `unpinned`,
`excerpt`, `visible`, `closed`, `archived`, `bookmarked`, `liked`,
`thumbnails`, `tags`, `tags_descriptions`, `views`, `like_count`,
`has_summary`, `last_poster_username`, `category_id`, `op_like_count`,
`pinned_globally`, `featured_link`, `ratings`, `show_ratings`,
`has_accepted_answer`, `dominant_color`, `last_post_excerpt`, `last_post_id`,
`topic_post_id`, `topic_post_liked`, `topic_post_like_count`,
`topic_post_can_like`, `topic_post_bookmarked`, `topic_post_number`,
`topic_post_user`, `can_vote`, `posters`

**Note:** `thumbnails` is an array of `{max_width, max_height, width, height, url}` objects.

---

### `GET /c/{slug}/{id}/l/new.json`

Topics in this category created recently and unseen.

**Params:** `page`, `filter=new`  
**Auth:** Optional

---

### `GET /c/{slug}/{id}/l/unread.json`

Topics the user is tracking with unread posts, in this category.

**Params:** `page`  
**Auth:** Required

---

### `GET /c/{slug}/{id}/l/unseen.json`

Topics not yet visited by the user in this category.

**Params:** `page`  
**Auth:** Optional (meaningless anonymous)

---

### `GET /c/{slug}/{id}/l/top.json`

Top topics in a category by period.

**Params:**

- `period` (`daily` | `weekly` | `monthly` | `quarterly` | `yearly` | `all`)
- `page`
- `per_page` (max 50)
- `tags[]` — filter by tag(s)

**Auth:** Optional  
**Observed:** All periods confirmed working. `all` returns up to 50 topics.

---

### `GET /c/{slug}/{id}/l/hot.json`

Hot topics in a category.

**Params:** `page`, `tags[]`  
**Auth:** Optional

---

## Tag Topic Lists

Pattern: `/tag/{name}/l/{filter}.json`

### `GET /tag/{name}/l/latest.json`

All topics tagged with `{name}`, sorted by latest activity.

**Params:** `page`, `per_page`, `tags[]` (additional tag filter)  
**Auth:** Optional  
**Default per_page:** 30  
**Confirmed:** Works for `vr`, `multi-axis`, `launch`, `hentai`, etc.

---

### `GET /tag/{name}/l/top.json`

**Params:** `period`, `page`  
**Auth:** Optional

---

### `GET /tag/{name}/l/hot.json`

**Params:** `page`  
**Auth:** Optional

---

### `GET /tag/{name}/l/new.json`

**Params:** `page`  
**Auth:** Optional

---

## Topic Detail

### `GET /t/{id}.json`

Full topic detail including first page of posts (default 20 posts).

**Params:**

- `page` (int) — loads subsequent pages of posts
- `show_deleted=true` — include deleted posts (requires elevated trust)
- `track_visit=true` — marks the topic as visited (side-effect)
- `print=true` — returns topic in a different format (still 200 JSON)

**Auth:** Optional (some topics may be gated)  
**Observed top-level fields:**
`post_stream`, `timeline_lookup`, `suggested_topics`, `tags`, `tags_descriptions`,
`fancy_title`, `id`, `title`, `posts_count`, `created_at`, `views`, `reply_count`,
`like_count`, `last_posted_at`, `visible`, `closed`, `archived`, `has_summary`,
`archetype`, `slug`, `category_id`, `word_count`, `deleted_at`, `user_id`,
`featured_link`, `pinned_globally`, `image_url`, `thumbnails`,
`draft`, `draft_key`, `draft_sequence`, `current_post_number`,
`highest_post_number`, `last_read_post_number`, `chunk_size`,
`bookmarked`, `participant_count`, `message_bus_last_id`,
`ratings`, `valid_reactions`, `vote_count`, `user_voted`,
`details`, `pending_posts`, `bookmarks`, `slow_mode_seconds`

**`post_stream` shape:**

```json
{
  "posts": [...],  // First 20 posts
  "stream": [...]  // All post IDs in order
}
```

**`details` shape** (included in full topic fetch):

```json
{
  "can_edit": true,
  "notification_level": 1,
  "can_invite_to": false,
  "can_create_post": true,
  "can_reply_as_new_topic": true,
  "can_flag_topic": true,
  "participants": [{"id":2104, "username":"defucilis", ...}],
  "created_by": {...},
  "last_poster": {...},
  "links": [
    {
      "url": "https://example.com/video.mp4",
      "title": "Video title",
      "internal": false,
      "attachment": false,
      "reflection": false,
      "clicks": 42,
      "user_id": 12345,
      "domain": "example.com",
      "root_domain": "example.com"
    }
  ]
}
```

**`thumbnails` shape:**

```json
[
  { "max_width": null, "max_height": null, "width": 200, "height": 140, "url": "...original..." },
  { "max_width": 100, "max_height": 100, "width": 100, "height": 70, "url": "...100x70..." },
  { "max_width": 50, "max_height": 50, "width": 50, "height": 35, "url": "...50x35..." }
]
```

**Relevance:** PRIMARY endpoint for ScriptStash. Provides full post content, link_counts, cooked HTML, thumbnails, and the `details.links` aggregate (all external links in the topic with click counts).

---

### `GET /t/{slug}/{id}.json`

Identical to `/t/{id}.json` but with slug in URL. Returns the same JSON. The slug is ignored server-side.

---

### `GET /t/{id}/post_ids.json`

Returns the ordered list of all post IDs in the topic stream.

**Params:** `post_number` (int, optional — start from this post number)  
**Response:** `{"post_ids": [123, 456, ...]}`  
**Auth:** Optional  
**Use:** Efficient way to get the full stream without loading all post content.

---

### `GET /topics/similar_to.json`

Finds topics with similar titles (used when creating a new topic).

**Params:** `title` (string), `raw` (string — post body)  
**Response keys:** `topics`, `users`, `primary_groups`, `flair_groups`, `similar_topics`  
**Auth:** Optional

---

### `GET /topics/created-by/{username}.json`

All topics created by a user.

**Params:** `page`  
**Response:** `{"topic_list": {...}}`  
**Auth:** Optional

---

## Posts

### `GET /t/{id}/posts.json?post_ids[]=...`

Load specific posts by ID (for lazy-loading pagination).

**Params:**

- `post_ids[]` — repeated parameter, one per post ID to load (up to 20 per request observed)
- `include_suggested=false` — skip suggested topics in response

**Response:**

```json
{
  "post_stream": {"posts": [...]},
  "id": 317906
}
```

**Auth:** Optional  
**Use:** Primary mechanism for loading posts beyond the first 20. Use `post_stream.stream` from the full topic fetch to get all post IDs, then batch them 20 at a time.

---

### `GET /posts/{id}.json`

Single post detail.

**Observed fields (same as post object in topic stream):**
`id`, `name`, `username`, `avatar_template`, `created_at`, `cooked`,
`post_number`, `post_type`, `posts_count`, `updated_at`, `reply_count`,
`reply_to_post_number`, `quote_count`, `incoming_link_count`, `reads`,
`readers_count`, `score`, `yours`, `topic_id`, `topic_slug`,
`primary_group_name`, `flair_name`, `badges_granted`, `version`,
`can_edit`, `can_delete`, `link_counts`, `read`, `user_title`,
`bookmarked`, `actions_summary`, `moderator`, `admin`, `staff`, `user_id`,
`hidden`, `trust_level`, `deleted_at`, `user_deleted`, `wiki`, `post_url`,
`reactions`, `current_user_reaction`, `reaction_users_count`,
`can_accept_answer`, `accepted_answer`, `topic_accepted_answer`, `can_vote`

**`link_counts` shape** (per post):

```json
[
  {
    "url": "https://pixeldrain.com/d/AaxeddyG",
    "clicks": 6,
    "internal": false,
    "title": "Diona - Free Use Correction ~ pixeldrain"
  }
]
```

**`reactions` shape:**

```json
[{ "id": "heart", "type": "emoji", "count": 2 }]
```

**Auth:** Optional  
**Note:** The `link_counts` in individual posts only lists links that received at least one click. For all links use `cooked` (HTML) parsing or `details.links` from the topic endpoint.

---

## Search

### `GET /search.json`

Full-page search results.

**Params:**

- `q` (string) — search query. Supports Discourse search operators:
  - `tags:vr` — filter by tag
  - `category:14` — filter by category ID
  - `order:posts` — sort by post count
  - `order:views`, `order:likes`, `order:latest`
  - `@username` — filter by author
  - `#slug` — filter by category slug
- `page` (int, 1-based)
- `search_type` (`topic` | `post` | `user` | `category` | `tag`)

**Response:**

```json
{
  "posts": [...],
  "topics": [...],
  "users": [...],
  "categories": [...],
  "tags": [...],
  "groups": [...],
  "grouped_search_result": {
    "more_posts": false,
    "more_users": false,
    "term": "funscript",
    "search_log_id": 12345,
    "more_full_page_results": true,
    "can_create_topic": true,
    "post_ids": [...]
  }
}
```

**Auth:** Optional (anonymous search works)  
**Max results per page:** 50 topics observed

---

### `GET /search/query`

Typeahead/autocomplete search (used in the header search box as you type).

**Requires:** `Accept: application/json` header  
**Params:** `term` (string), `type_filter` (`exclude_topics` | `users` | `categories` | `tags`)  
**Response:**

```json
{
  "posts": [...],
  "users": [{"id":..., "username":"...", "name":"...", "avatar_template":"...", "custom_data":[...]}],
  "categories": [...],
  "tags": [...],
  "groups": [...]
}
```

**Auth:** Optional

---

## Users

### `GET /u/{username}.json`

User profile.

**Observed user fields:**
`id`, `username`, `name`, `avatar_template`, `email`, `secondary_emails`,
`last_posted_at`, `last_seen_at`, `created_at`, `ignored`, `muted`,
`can_ignore_user`, `can_mute_user`, `can_send_private_messages`,
`trust_level`, `moderator`, `admin`, `title`

**Auth:** Required for `email` field; optional for everything else

---

### `GET /u/{username}/card.json`

Lightweight user card (shown on avatar click).

**Requires:** `Accept: application/json` header  
**Params:** `include_post_count_for` (topic ID — adds post count for that topic)  
**Response keys:** `user_badges`, `badges`, `badge_types`, `users`, `user`  
**Observed user fields:**
`id`, `username`, `name`, `avatar_template`, `last_posted_at`, `last_seen_at`,
`created_at`, `trust_level`, `moderator`, `admin`, `title`, `badge_count`,
`custom_fields`, `time_read`, `recent_time_read`, `primary_group_id`,
`primary_group_name`, `flair_group_id`, `flair_name`, `flair_url`, `bio_excerpt`

**Auth:** Optional

---

### `GET /u/{username}/summary.json`

User activity summary statistics.

**Response keys:** `topics`, `badges`, `badge_types`, `users`, `user_summary`  
**Observed `user_summary` fields:**
`likes_given`, `likes_received`, `topics_entered`, `posts_read_count`,
`days_visited`, `topic_count`, `post_count`, `time_read`, `recent_time_read`,
`bookmark_count`, `can_see_summary_stats`, `can_see_user_actions`,
`solved_count`, `topic_ids`, `replies`

**Auth:** Optional

---

### `GET /u/{username}/badges.json`

Badges earned by the user.

**Response keys:** `user_badges`, `badges`, `badge_types`, `users`, `user`  
**Auth:** Optional

---

### `GET /user_actions.json`

User activity feed.

**Params:**

- `username` (required)
- `filter` (int) — action type filter:
  - `1` = liked a post
  - `4` = topics created
  - `5` = replies made
  - `6` = responses received
  - `7` = mentions
  - `9` = quoted
  - `11` = private messages sent
  - `12` = private messages received
- `offset` (int, 0-based pagination)

**Response:** `{"user_actions": [...]}`  
**Auth:** Required (own actions); Optional (public actions)

---

### `GET /u/recent-searches`

Returns the current user's recent search terms.

**Requires:** `Accept: application/json` header  
**Response:** `{"success": "OK", "recent_searches": ["funscript tags:vr", "funs", ...]}`  
**Auth:** Required

---

## Notifications

### `GET /notifications.json`

Paginated notification list.

**Params:**

- `filter` (`all` | `read` | `unread`)
- `limit` (int, default 30)
- `offset` (int)
- `username` (string)

**Response:**

```json
{
  "notifications": [...],
  "total_rows_notifications": 716,
  "seen_notification_id": 12345,
  "load_more_notifications": "/notifications?filter=all&limit=30&offset=30&username=whoever"
}
```

**Observed notification fields:**
`id`, `user_id`, `notification_type`, `read`, `high_priority`, `created_at`,
`post_number`, `topic_id`, `slug`, `fancy_title`, `data`

**Auth:** Required

---

### `GET /notifications?recent=true`

Recent notifications panel (used in header dropdown).

**Params:** `limit`, `recent=true`, `bump_last_seen_reviewable=true`  
**Response:** `{"notifications": [...], "seen_notification_id": 12345}`  
**Auth:** Required

---

## Bookmarks & Drafts

### `GET /bookmarks.json`

Returns bookmarked topics as a topic list.

**Response:** `{"topic_list": {...}}`  
**Auth:** Required

---

### `GET /drafts.json`

In-progress drafts.

**Response:** `{"drafts": [...]}`  
**Observed draft fields:**
`excerpt`, `created_at`, `draft_key`, `sequence`, `draft_username`,
`avatar_template`, `data`, `topic_id`, `username`, `name`, `user_id`,
`title`, `archetype`

**Auth:** Required

---

## Site Metadata

### `GET /categories.json`

All categories.

**Params:** `include_subcategories=true`  
**Observed category fields:**
`id`, `name`, `color`, `text_color`, `slug`, `topic_count`, `post_count`,
`position`, `description`, `description_text`, `description_excerpt`,
`topic_url`, `read_restricted`, `permission`, `notification_level`,
`topic_template`, `subcategory_ids`

**Response:** `{"category_list": {"categories": [...]}}`  
**Auth:** Optional

---

### `GET /tags.json`

All tags with usage counts.

**Response:** `{"tags": [...], "extras": {"categories": [...]}}`  
**Observed tag fields:** `id`, `text`, `name`, `slug`, `description`, `count`, `pm_only`, `target_tag`  
**Observed:** 204 tags as of June 2026  
**Sample common tags:** `hentai(126)`, `vr(111)`, `multi-axis(102)`, `launch(101)`, `blowjob(40)`, `pov(25)`, `joi(16)`, `titfuck(14)`, `vaginal(13)`, `anal(13)`  
**Auth:** Optional

---

### `GET /about.json`

Site information and statistics.

**Response keys:** `users`, `categories`, `about`  
**Observed `about` fields:**
`stats`, `description`, `extended_site_description`, `site_creation_date`,
`title`, `locale`, `version`, `https`, `contact_url`, `contact_email`,
`moderator_ids`, `admin_ids`, `category_moderators`

**Auth:** Optional

---

### `GET /site.json`

Site configuration (notification types, post types, trust levels, etc.).

**Response keys:**
`default_archetype`, `notification_types`, `post_types`, `trust_levels`,
`groups`, `filters`, `periods`, `top_menu_items`, `anonymous_top_menu_items`,
`uncategorized_category_id`, `user_field_max_length`, `post_action_types`

**Auth:** Optional

---

## Real-time: Message Bus

### `POST /message-bus/{client_id}/poll`

Long-poll endpoint used by the Discourse Ember frontend for real-time updates (new posts, notification counts, etc.).

**Params:** `client_id` — a random hex string unique to the browser session  
**Body:** JSON describing the channels to subscribe to  
**Auth:** Required (session cookie)  
**Note:** Not needed for ScriptStash's read-only scraping. Observed in SPA navigation and notification panel open.

---

## Not Implemented / 404

These Discourse endpoints exist in vanilla Discourse but are **not available** on EroScripts:

| Endpoint                             | Notes                              |
| ------------------------------------ | ---------------------------------- |
| `POST /t/{id}/view`                  | Track topic view                   |
| `/t/{id}/summarize.json`             | AI summary (not enabled)           |
| `/topics/feature.json`               | Featured topics list               |
| `/solution/topics.json`              | Solved topics (plugin not enabled) |
| `/admin/site_settings.json`          | Admin only, 404 for regular users  |
| `/posts/{id}/revisions/1.json`       | Post revision history              |
| `/t/{id}/details`                    | Standalone details endpoint        |
| `/t/{id}/timer`                      | Topic timer                        |
| `POST /post_actions`                 | React/like to a post               |
| `/topics/replies-by/{username}.json` | User's reply list                  |
| `/u/{username}/posts.json`           | User's posts (HTML only)           |

---

## Notes for ScriptStash App

### Recommended data flow for "best video from comments" feature

1. **Get topic list:**
   - Primary source: `GET /c/scripts/free-scripts/14/l/latest.json?per_page=50`
   - Supplement: `GET /c/scripts/paid-scripts/15/l/latest.json`
   - Filter by tag: add `?tags[]=vr` or other tags
   - The topic list already includes `thumbnails`, `image_url`, `tags`, `like_count`, `excerpt`

2. **Get full topic content:**
   - `GET /t/{id}.json` — returns first 20 posts + `post_stream.stream` (all post IDs)
   - `details.links` gives ALL external links in the topic with click counts (sorted by clicks desc) — this is the most efficient way to find video links
   - `thumbnails` array gives 3 sizes (original, 100×70, 50×35) for UI display

3. **Load additional posts (for topics with >20 posts):**
   - Get remaining post IDs from `post_stream.stream`
   - Batch 20 IDs at a time: `GET /t/{id}/posts.json?post_ids[]=...`
   - Each post has `link_counts` (links clicked at least once) and `cooked` (full HTML)

4. **Video link extraction strategies (in priority order):**
   - `details.links` (topic-level aggregate) — most reliable, includes all external links with `clicks`, `domain`, `root_domain`
   - Per-post `link_counts` — same links but scoped per post, useful to know if link came from OP vs comment
   - Parse `cooked` HTML href attributes — catches links with zero clicks (never clicked by community)

5. **Key fields for ranking "best" video:**
   - `link_counts[].clicks` / `details.links[].clicks` — community engagement metric
   - `post_number` — distinguish OP (post #1) from comments
   - `is_op` — if `post.post_number === 1`
   - `like_count` on post — popularity signal
   - Topic `views` and `like_count` — overall popularity

6. **Auth requirements:**
   - All read operations on public topics/categories work without auth
   - `unread.json` and notification endpoints need auth
   - Store `_t` cookie from user login in encrypted electron-store (already implemented)

7. **Rate limiting:**
   - Discourse enforces approximately 60 requests/minute by default
   - The existing `scrape-analysis.js` uses 1200ms delay (50 req/min) which is safe
   - Batch post loading reduces request count significantly

8. **Thumbnail CDN:**
   - Images are hosted at `https://eroscripts-discourse.eroscripts.com/`
   - Optimized variants follow pattern: `.../optimized/4X/.../sha256_2_{W}x{H}.ext`
   - Always use the smallest thumbnail adequate for the UI to reduce load

9. **Pagination pattern:**
   - Topic lists: `?page=0` (default), `?page=1`, etc. — 30 topics per page (50 with `per_page=50`)
   - Topic posts: use `post_stream.stream` IDs + `/posts.json?post_ids[]=...` batching
   - `more_topics_url` in `topic_list` gives the next page URL

10. **Search for discovery:**
    - `/search.json?q=tags:vr+order:likes&search_type=topic` — VR topics by popularity
    - `/search.json?q=category:14+order:views` — free scripts by views
    - Up to 50 results per page
