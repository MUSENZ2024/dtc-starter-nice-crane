# MUSE Native Marketing System

Status: implementation specification  
Platform: Medusa Cloud Launch + Medusa Emails  
Storefront: MUSE Next.js storefront  
Primary market: New Zealand  
Implementation approach: phased releases with an independent production gate after every phase

## 1. Purpose

Build a complete native email-marketing platform inside the existing MUSE Medusa application. Medusa must become the source of truth for subscribers, consent, segments, automated flows, campaigns, discounts, email events, conversions, revenue attribution, suppression, previews, reporting, and marketing operations.

The system must use Medusa Emails through the Notification Module. Klaviyo must not be required for production sending or subscriber management.

This document is intentionally divided into small implementation phases. Do not implement all phases in one release. Each phase must pass its own acceptance tests before the next phase begins.

## 2. Confirmed business decisions

- Initial welcome offer: **NZ$20 off the first order when spending NZ$150 or more**.
- The welcome offer expires exactly five calendar days after issue.
- Each first-time subscriber receives a unique, single-use promotion code.
- Welcome discounts cannot be combined with another promotion.
- Clearance products are excluded initially.
- Selected limited releases can be excluded through an Admin-editable product/tag rule.
- Existing customers do not receive a first-order discount.
- Existing customers enter a shorter VIP/drop-access flow.
- A purchase immediately cancels remaining welcome emails.
- Abandoned-cart, transactional, welcome, and campaign emails all use Medusa Emails.
- Marketing consent is separate from transactional order communication.
- automatic bulk import of customers into marketing is allowed. Historical customers are treated as subscribed unless said
- No gamified popup initially.
- The current MUSE visual identity must be reused: black, warm off-white, MUSE lime, existing typography, existing radius and spacing patterns.
- Storefront popups must not use emoji UI icons.

## 3. Current-state problems

### Storefront

- Homepage and footer forms have no submission handler.
- There is no subscriber storage or source record.
- There is no consent record or consent evidence.
- There is no welcome-flow trigger.
- There is no loading, success, duplicate, suppressed, or error state.
- Existing subscribers are not suppressed from capture UI.
- Homepage promises early access while the footer promises a first-order discount.
- The free-shipping notification can obscure the newsletter section.
- Homepage and footer capture areas are visually too close and compete for attention.

### Backend

- Existing `emailAutomation` models handle templates and scheduled order emails, but do not constitute a subscriber/marketing platform.
- Existing abandoned-cart models contain useful patterns but must remain a separate automation domain.
- There is no canonical marketing profile, consent ledger, segment engine, campaign system, or global frequency control.
- There is no explicit marketing unsubscribe endpoint.

### Legal/content

- The live Privacy Policy currently names Klaviyo as the email/SMS provider and mentions Klaviyo marketing cookies.
- Before native marketing launches, update the policy to describe Medusa Cloud/Medusa Emails accurately and remove claims that no longer apply.
- Consent language, unsubscribe behaviour, retention, and deletion handling must be reviewed before production activation.

## 4. Success criteria

The completed system must allow MUSE staff to:

1. Capture a marketing subscriber from any approved storefront source.
2. Preserve consent evidence and source attribution.
3. Determine whether the subscriber is first-time or returning.
4. Issue a valid, unique welcome promotion only when eligible.
5. Run the correct welcome or VIP sequence.
6. Stop promotional sequences immediately after purchase or unsubscribe.
7. Create and schedule targeted campaigns in Medusa Admin.
8. Preview every automated and campaign email before activation.
9. Observe scheduled, sent, delivered, opened, clicked, failed, cancelled, bounced, complained, and unsubscribed states where provider data is available.
10. Attribute clicks, orders, revenue, and discount cost to a flow or campaign.
11. Export subscriber and reporting data without exposing secrets.
12. Stay within safe daily/monthly sending and frequency limits.

## 5. System architecture

```text
Storefront capture surfaces
  -> Store signup API
  -> Marketing workflow
  -> Marketing module
  -> Consent ledger + subscriber profile
  -> Segment/eligibility calculation
  -> Promotion creation (eligible first-time subscribers only)
  -> Flow enrollment + scheduled email events
  -> Scheduled dispatch job
  -> Medusa Notification Module
  -> Medusa Emails
  -> Event/click/unsubscribe ingestion
  -> Order attribution and flow cancellation
  -> Medusa Admin marketing dashboard
```

Architecture rules:

- Module models and CRUD remain in a custom `marketing` module.
- All mutations run through workflows with compensating steps where appropriate.
- API routes validate inputs with Zod middleware.
- Admin calls custom routes with the Medusa SDK client, never raw `fetch`.
- Storefront calls custom store routes with the existing Medusa SDK, never raw `fetch`.
- Scheduled jobs query due work in bounded batches and call workflows for mutations.
- Sending is idempotent. A retry must never create a duplicate email.
- Promotion issuance is idempotent per subscriber/offer version.
- All times are stored in UTC and rendered as Pacific/Auckland in Admin.

## 6. Data model

Create one new custom module at `apps/backend/src/modules/marketing/`.

### 6.1 `marketing_subscriber`

Canonical marketing identity, unique by normalised email.

Required fields:

- `id`
- `email`
- `email_normalized` — lowercase and trimmed; unique index
- `customer_id` — nullable Medusa customer reference identifier
- `first_name` — nullable
- `last_name` — nullable
- `status` — `subscribed | unsubscribed | suppressed | pending`
- `customer_type` — `first_time | returning | unknown`
- `primary_preference` — `footwear | outerwear | restocks | everything`
- `source_first`
- `source_latest`
- `subscribed_at`
- `unsubscribed_at` — nullable
- `suppressed_at` — nullable
- `suppression_reason` — nullable
- `last_email_sent_at` — nullable
- `last_engaged_at` — nullable
- `order_count` — cached reporting value, recalculable
- `lifetime_revenue` — cached reporting value, recalculable
- `metadata` — JSON for non-critical extension data

Indexes:

- unique `email_normalized` where not deleted
- `customer_id`
- `status`
- `primary_preference`
- `subscribed_at`
- `last_engaged_at`

### 6.2 `marketing_consent_event`

Append-only evidence ledger. Consent history must never be overwritten.

Fields:

- `id`
- `subscriber_id`
- `action` — `subscribed | unsubscribed | resubscribed | suppressed | consent_updated`
- `channel` — initially `email`
- `source`
- `consent_text`
- `privacy_policy_version`
- `occurred_at`
- `ip_hash` — hash only; do not store unnecessary raw IP data
- `user_agent_summary` — bounded, nullable
- `country_code`
- `metadata`

### 6.3 `marketing_preference_event`

Tracks preference changes without losing history.

Fields:

- `id`
- `subscriber_id`
- `preference`
- `source`
- `occurred_at`

### 6.4 `marketing_flow`

Admin-editable automation definition.

Fields:

- `id`
- `key` — unique, for example `welcome_first_time_v1`
- `name`
- `type` — `welcome | vip_welcome | winback | restock | custom`
- `status` — `draft | active | paused | archived`
- `version`
- `entry_rules` — JSON
- `exit_rules` — JSON
- `frequency_rules` — JSON
- `activated_at`
- `metadata`

Initial seeded flows:

- `welcome_first_time_v1`
- `welcome_returning_v1`

### 6.5 `marketing_flow_step`

- `id`
- `flow_id`
- `sequence_number`
- `name`
- `template_key`
- `delay_minutes`
- `subject`
- `preview_text`
- `status` — `draft | active | paused`
- `audience_rules` — JSON, including preference variants
- `metadata`

### 6.6 `marketing_enrollment`

One subscriber’s execution of a flow.

Fields:

- `id`
- `subscriber_id`
- `flow_id`
- `flow_version`
- `status` — `active | completed | converted | cancelled | unsubscribed | suppressed`
- `entered_at`
- `completed_at`
- `cancelled_at`
- `cancel_reason`
- `converted_order_id`
- `converted_at`
- `attributed_revenue`
- `attribution_currency`
- `source`
- `metadata`

Uniqueness rule: one active enrollment for the same subscriber and flow version.

### 6.7 `marketing_email_event`

Shared email history for automated flows and campaigns.

Fields:

- `id`
- `subscriber_id`
- `enrollment_id` — nullable
- `campaign_id` — nullable
- `flow_step_id` — nullable
- `template_key`
- `subject_snapshot`
- `preview_text_snapshot`
- `status` — `scheduled | sending | sent | delivered | opened | clicked | failed | cancelled | bounced | complained`
- `scheduled_at`
- `send_started_at`
- `sent_at`
- `delivered_at`
- `first_opened_at`
- `first_clicked_at`
- `failed_at`
- `cancelled_at`
- `provider_notification_id`
- `attempt_count`
- `last_error`
- `tracking_token` — unique
- `content_snapshot` — optional HTML or render input snapshot according to retention decision
- `metadata`

Constraint: exactly one of `enrollment_id` or `campaign_id` must be populated.

### 6.8 `marketing_offer`

Logical offer definition.

Fields:

- `id`
- `key` — `welcome_nzd20_150_v1`
- `name`
- `status` — `draft | active | paused | archived`
- `amount_type` — `fixed | percentage`
- `amount`
- `currency_code`
- `minimum_spend`
- `expires_after_hours`
- `first_order_only`
- `combinable`
- `excluded_product_ids` — JSON
- `excluded_category_ids` — JSON
- `excluded_tag_ids` — JSON
- `metadata`

Initial value:

- fixed NZ$20
- NZD
- NZ$150 minimum spend
- 120-hour expiry
- first order only
- not combinable
- clearance tag/category excluded

### 6.9 `marketing_offer_issuance`

- `id`
- `offer_id`
- `subscriber_id`
- `promotion_id`
- `code`
- `status` — `active | redeemed | expired | revoked`
- `issued_at`
- `expires_at`
- `redeemed_at`
- `redeemed_order_id`
- `discount_amount_realized`
- `currency_code`

Unique constraints:

- code unique
- one issuance per subscriber and offer version

### 6.10 `marketing_campaign`

- `id`
- `name`
- `status` — `draft | scheduled | sending | sent | paused | cancelled | failed`
- `subject`
- `preview_text`
- `template_key`
- `content` — structured JSON used by approved React Email blocks
- `audience_definition` — JSON
- `audience_snapshot_count`
- `scheduled_at`
- `started_at`
- `completed_at`
- `created_by`
- `utm_campaign`
- `metadata`

### 6.11 `marketing_campaign_recipient`

Materialised recipient snapshot for safe sending and reporting.

- `id`
- `campaign_id`
- `subscriber_id`
- `email`
- `status` — `eligible | excluded | scheduled | sent | failed | cancelled`
- `exclusion_reason`
- `email_event_id`
- `created_at`

Unique `(campaign_id, subscriber_id)`.

### 6.12 `marketing_capture_event`

Anonymous and identified conversion funnel analytics.

- `id`
- `session_id_hash`
- `subscriber_id` — nullable
- `event_type` — `eligible | popup_viewed | preference_selected | form_viewed | submitted | succeeded | dismissed | error`
- `source`
- `preference` — nullable
- `page_type`
- `device_type`
- `occurred_at`
- `metadata`

Do not store full browsing histories or unnecessary personal data.

### 6.13 `marketing_attribution_event`

- `id`
- `subscriber_id`
- `email_event_id`
- `campaign_id` — nullable
- `enrollment_id` — nullable
- `event_type` — `click | order | revenue | discount`
- `order_id` — nullable
- `amount` — nullable
- `currency_code` — nullable
- `occurred_at`
- `metadata`

## 7. Subscriber identity and consent rules

1. Normalise email before all lookup and mutation operations.
2. Never create duplicate profiles for case or whitespace differences.
3. A signup from a new email creates a subscribed profile and consent event.
4. A signup from an already subscribed email updates source/preference but does not create a duplicate flow enrollment or discount.
5. A signup from an unsubscribed email is a resubscription only after explicit fresh consent; append a consent event.
6. A suppressed email cannot be resubscribed automatically. Admin must see the reason.
7. Transactional emails continue after marketing unsubscribe when required for an order or account action.
8. Marketing emails must include an unsubscribe link and MUSE contact/postal identity.
9. Unsubscribe must be one-click, tokenised, and must not require login.
10. Deletion requests must preserve only records that are legally required, with personal fields removed where possible.

Approved consent copy draft:

> By joining, you agree to receive MUSE NZ marketing emails about new drops, restocks and offers. You can unsubscribe at any time. See our Privacy Policy.

This copy requires final legal/content approval before activation.

## 8. Customer classification

Classification must be evaluated at signup and rechecked before each promotional send.

- `first_time`: no completed or placed order is associated with the normalised email/customer ID.
- `returning`: at least one valid order exists.
- `unknown`: classification failed; do not issue a first-order offer until resolved.

If a first-time subscriber orders after enrollment:

- mark enrollment `converted`
- cancel all remaining scheduled welcome events
- mark issued offer `redeemed` if used, otherwise `revoked` after conversion because it is first-order only
- attribute order and revenue using the approved attribution rule
- allow transactional/post-purchase emails

## 9. Welcome offer implementation

Use Medusa’s Promotion Module through verified current workflows/APIs during implementation. Do not insert promotion rows directly.

Code characteristics:

- random, non-sequential, non-guessable
- suggested visible format: `MUSE20-XXXXXXXX`
- one customer use
- one global use
- active only between `issued_at` and `expires_at`
- NZ$20 fixed reduction
- NZ$150 qualifying subtotal
- non-combinable
- first completed order only
- exclude clearance and Admin-selected exclusions

Security and abuse controls:

- rate-limit signup by hashed IP/session and email
- do not reveal whether a suppressed email belongs to an existing customer
- idempotency key for signup and offer issuance
- never return internal customer/order history from the public endpoint
- prevent code enumeration
- log issuance without logging secrets beyond the operationally required code

Future A/B test, not part of initial launch:

- Variant A: NZ$20 off NZ$150+
- Variant B: 10% off first order
- Compare first-order conversion, revenue per subscriber, realised discount, gross revenue, and AOV.

## 10. Automated flows

### 10.1 First-time five-email welcome flow

All messages include the offer code, truthful expiry, unsubscribe link, preference-aware shop link, and free NZ delivery threshold.

#### Email 1 — immediate

- Template key: `welcome_offer_delivery`
- Subject: `Welcome to MUSE—your $20 is inside`
- Timing: immediately after successful enrollment
- Purpose: deliver promised value
- Content:
  - code and expiry above the fold
  - `SHOP NOW` primary CTA
  - 3–4 bestsellers selected dynamically or from an Admin-curated fallback
  - free NZ delivery threshold
  - concise subscriber-benefit explanation
  - preference-aware product/category content

#### Email 2 — 22 hours

- Template key: `welcome_trust`
- Subject: `What shopping with MUSE actually looks like`
- Purpose: reduce risk and build trust
- Content:
  - New Zealand positioning
  - authentic product photography
  - secure checkout and tracked delivery
  - local support
  - returns/exchange reassurance
  - approved customer reviews/UGC
  - small offer reminder

#### Email 3 — 48 hours

- Template key: `welcome_discovery`
- Subject variants:
  - footwear: `The footwear MUSE customers keep coming back for`
  - outerwear: `Outerwear worth knowing about`
  - restocks: `Your next-size restock starts here`
  - everything: `The MUSE pieces worth knowing about`
- Purpose: personalised discovery
- Content:
  - one focused category or interest
  - products with individual links
  - stock/restock context only when supported by live data
  - offer reminder

#### Email 4 — 72 hours

- Template key: `welcome_personal_checkin`
- Subject: `Did your MUSE code come through?`
- Style: plain-text visual treatment
- Draft:

> Hey [first name],  
> Just checking that your MUSE welcome code came through properly. It’s still active if you’ve been deciding on a size or product. Reply to this email if you need help choosing.  
> Your code: [CODE]  
> — MUSE NZ

#### Email 5 — expiry day, approximately 108 hours

- Template key: `welcome_last_chance`
- Subject: `Your MUSE welcome code expires tonight`
- Purpose: truthful urgency
- Content:
  - expiry first
  - code prominent
  - preference-aware bestsellers or recently clicked products
  - social proof
  - one primary CTA
  - no fake countdown

### 10.2 Returning-customer VIP flow

No first-order promotion is issued.

#### VIP Email 1 — immediate

- Confirm list membership and saved preference.
- Explain early-access/restock benefits.
- Link to new arrivals.

#### VIP Email 2 — 48 hours

- Preference-aware new products/restocks.
- Use past purchase categories only when the data is reliable.
- No unnecessary discount.

### 10.3 Global flow exit rules

Cancel remaining marketing flow events when:

- subscriber places an order where the flow requires non-purchaser status
- subscriber unsubscribes
- subscriber becomes suppressed
- flow is paused with `cancel_pending=true`
- subscriber is manually removed by an Admin user
- campaign frequency guard blocks the send

## 11. Storefront experience

### 11.1 Two-step popup

Step 1 headline:

> What do you want first access to?

Options:

- Sneakers and footwear
- Outerwear and apparel
- Restocks in my size
- Everything MUSE

Step 2 headline:

> Get first access—and $20 off your first order over $150.

Fields and controls:

- email only
- consent text and Privacy Policy link
- CTA: `UNLOCK MY ACCESS`
- close button with at least 44×44px target
- backdrop close
- Escape close
- focus trap and focus restoration
- `role="dialog"`, `aria-modal="true"`, descriptive label

Success:

> You’re on the list. Check your inbox for your private code.

Duplicate subscribed response:

> You’re already on the MUSE list. We’ve kept your preferences up to date.

Do not disclose customer/order status in the public response.

### 11.2 Popup eligibility and suppression

Desktop trigger, whichever occurs first:

- 12–15 seconds active browsing
- 35–40% page scroll
- second product detail view in the session

Mobile trigger, whichever occurs first:

- 20–30 seconds active browsing
- 50% page scroll

Never show:

- cart page
- checkout pages
- order confirmation
- account authentication/password pages
- unsubscribe/preferences pages
- while cart drawer is open
- while free-shipping notification is visible
- when another modal is open
- after session maximum is reached
- after known signup

Suppression persistence:

- maximum one popup view per session
- dismissal cooldown: 30 days
- successful signup: permanent local suppression plus server identity check when email is known
- do not use local storage as the consent source of truth

### 11.3 Homepage section

Retain the current large MUSE design but remove the competing direct form.

- Eyebrow: `DROP ACCESS`
- Heading: `Get first access to your next pair.`
- CTA: `CHOOSE MY ACCESS`
- CTA opens the two-step capture dialog at Step 1.
- Explain the NZ$20 offer beneath the CTA without competing with the headline.

### 11.4 Footer form

Copy:

> $20 off your first order over $150 + first access to new drops.

Behaviour:

- direct email capture
- source `footer_signup`
- after success, display optional preference choices inline
- stack field/button on mobile
- loading, error, duplicate, success, and suppressed-safe states

### 11.5 Source values

Supported values:

- `welcome_popup`
- `homepage_drop_access`
- `footer_signup`
- `checkout_opt_in`
- `account_opt_in`
- `admin_import`
- `admin_manual`
- `campaign_landing_page`

### 11.6 Free-shipping notification coordination

Create one shared overlay/notification coordinator in the storefront.

- popup requests exclusive modal priority
- cart drawer has purchase-flow priority
- free-shipping notification must hide or move while the popup/footer form is active
- never display two fixed bottom-right/bottom overlays simultaneously
- mobile safe-area insets are mandatory

## 12. Store API

All request bodies use Zod validation middleware. Apply rate limits and generic public responses.

### `POST /store/marketing/subscribe`

Input:

- email
- preference
- source
- consent version/text identifier
- session identifier
- country code

Output:

- success
- public status: `subscribed | already_subscribed | preference_updated`
- message

Do not return:

- customer type
- prior orders
- suppression details
- raw promotion code before eligibility and send processing unless product explicitly requires on-screen delivery later

### `POST /store/marketing/unsubscribe`

Input:

- signed unsubscribe token

Result:

- update status through workflow
- append consent event
- cancel scheduled marketing events
- preserve transactional eligibility

### `GET /store/marketing/preferences/:token`

Returns bounded current marketing preferences for a signed token.

### `POST /store/marketing/preferences/:token`

Updates preference or unsubscribes through a workflow.

### `POST /store/marketing/events`

Accept only allowlisted capture events. Rate limit, validate and avoid raw PII.

### `GET /store/marketing/click/:token`

Record click idempotently and redirect only to an allowlisted MUSE storefront URL. Prevent open redirect vulnerabilities.

## 13. Admin API

All mutation routes run workflows. All list routes support pagination, search, filters, sorting, and bounded limits.

### Dashboard/reporting

- `GET /admin/marketing/dashboard`
- `GET /admin/marketing/reports/timeseries`
- `GET /admin/marketing/reports/funnel`
- `GET /admin/marketing/reports/revenue`
- `GET /admin/marketing/usage`

### Subscribers

- `GET /admin/marketing/subscribers`
- `GET /admin/marketing/subscribers/:id`
- `POST /admin/marketing/subscribers/:id`
- `POST /admin/marketing/subscribers/:id/unsubscribe`
- `POST /admin/marketing/subscribers/:id/resubscribe` — requires fresh consent evidence
- `POST /admin/marketing/subscribers/:id/suppress`
- `POST /admin/marketing/subscribers/export`

### Flows

- `GET /admin/marketing/flows`
- `GET /admin/marketing/flows/:id`
- `POST /admin/marketing/flows`
- `POST /admin/marketing/flows/:id`
- `POST /admin/marketing/flows/:id/activate`
- `POST /admin/marketing/flows/:id/pause`
- `GET /admin/marketing/flows/:id/preview/:stepId`
- `POST /admin/marketing/flows/:id/test/:stepId`

Test sends require a deliberate confirmation and must only send to the signed-in Admin’s entered test address.

### Campaigns

- `GET /admin/marketing/campaigns`
- `GET /admin/marketing/campaigns/:id`
- `POST /admin/marketing/campaigns`
- `POST /admin/marketing/campaigns/:id`
- `POST /admin/marketing/campaigns/:id/estimate-audience`
- `POST /admin/marketing/campaigns/:id/materialise-audience`
- `POST /admin/marketing/campaigns/:id/schedule`
- `POST /admin/marketing/campaigns/:id/pause`
- `POST /admin/marketing/campaigns/:id/cancel`
- `GET /admin/marketing/campaigns/:id/preview`
- `POST /admin/marketing/campaigns/:id/test`

### Offers

- `GET /admin/marketing/offers`
- `GET /admin/marketing/offers/:id`
- `POST /admin/marketing/offers`
- `POST /admin/marketing/offers/:id`
- `POST /admin/marketing/offers/:id/activate`
- `POST /admin/marketing/offers/:id/pause`

### Segments

- `GET /admin/marketing/segments`
- `POST /admin/marketing/segments/estimate`
- `POST /admin/marketing/segments`
- `POST /admin/marketing/segments/:id`

### Email activity

- `GET /admin/marketing/email-events`
- `GET /admin/marketing/email-events/:id`
- `GET /admin/marketing/email-events/:id/preview`
- `POST /admin/marketing/email-events/:id/retry` — failed events only
- `POST /admin/marketing/email-events/:id/cancel` — scheduled events only

## 14. Medusa Admin marketing dashboard

Create a top-level sidebar section named `Marketing` with the following native pages.

### 14.1 Marketing Overview

Purpose: daily operating dashboard.

Cards:

- active subscribers
- new subscribers: 7 and 30 days and fully flexable dates
- unsubscribes: 7 and 30 days and fully flexable dates
- emails sent this month
- estimated Medusa allowance remaining
- delivery rate
- click rate
- welcome conversion: 7 and 14 days and fully flexable dates
- attributed orders
- attributed revenue
- revenue per subscriber
- active abandoned carts and recovered revenue summary

Charts:

- subscriber growth over time
- sends/deliveries/clicks over time
- welcome funnel
- revenue by automation/campaign
- signup source performance
- preference mix
- email usage versus 10,000 monthly allowance

Alerts:

- usage at 7,500 and 9,000 sends
- elevated failure/bounce/complaint rate
- scheduled job has not completed within expected interval
- active flow has no valid template
- campaign audience unexpectedly equals zero
- campaign audience exceeds configured safety threshold
- offer issuance failures

Quick actions:

- create campaign
- view scheduled sends
- preview welcome flow
- export subscribers
- pause marketing sends

### 14.2 Subscribers

DataTable columns:

- email/customer
- status
- preference
- first-time/returning
- signup source
- signup date
- current flow/stage
- last email status
- last engagement
- order count
- attributed revenue

Filters:

- status
- preference
- customer type
- source
- signup date range
- flow
- engagement state
- has purchased
- offer status

Bulk actions:

- export selected
- suppress selected with reason
- add/remove segment tag
- never bulk resubscribe

Subscriber detail view:

- identity and consent summary
- immutable consent timeline
- preferences
- flow enrollments
- complete email-event history
- offer code/expiry/redemption
- orders and attributed revenue
- source history
- suppression reason
- Admin notes/audit history
- preview buttons for each email event
- safe manual actions with confirmation

### 14.3 Automations

List all flows with:

- status
- entries
- active enrollments
- sends
- clicks
- conversions
- revenue
- revenue per recipient
- last execution health

Flow detail:

- visual ordered step timeline
- timing controls
- subject and preview text
- preference variants
- entry and exit rules
- frequency rules
- per-step metrics
- desktop/mobile preview
- HTML/plain-text preview
- test send
- version history
- activate/pause controls

Activation gate:

- valid templates
- valid unsubscribe link
- sender identity
- non-zero eligible audience logic
- offer active when required
- no missing subject/preview text
- test send completed

### 14.4 Campaigns

Views:

- Drafts
- Scheduled
- Sending
- Sent
- Cancelled/failed

Campaign composer:

- campaign name
- subject and preview text
- approved structured content blocks
- audience builder
- exclusion builder
- estimated recipients
- schedule in Pacific/Auckland
- UTM values
- preview and test send
- frequency-cap warning
- monthly/daily usage forecast

Initial content blocks:

- MUSE header
- hero image + headline + CTA
- rich text
- product grid
- category row
- review/UGC block
- offer block
- delivery/trust block
- spacer/divider
- MUSE footer with unsubscribe

Do not start with unrestricted arbitrary HTML editing. Use safe structured blocks backed by React Email components.

Pre-send confirmation must show:

- exact recipient count
- excluded count and reasons
- estimated monthly allowance after send
- scheduled local time and UTC time
- subject and sender
- unsubscribe validation

### 14.5 Segments

Saved segments and live estimates.

Initial operators:

- subscribed/unsubscribed status
- source
- preference
- first-time/returning
- order count
- lifetime revenue
- last order date
- signup date
- clicked/opened within period
- has/has not received campaign
- has/has not entered flow
- product/category/tag purchase
- offer redeemed/not redeemed

Initial saved segments:

- New subscribers, no order, 7 days
- Footwear interest
- Outerwear interest
- Restock interest
- Returning VIP customers
- Engaged 30 days
- Unengaged 90 days
- High-value customers
- Welcome offer not redeemed

### 14.6 Email Activity

Unified event table across welcome, VIP, future automations, and campaigns.

Columns:

- recipient
- automation/campaign
- template/step
- subject
- scheduled time
- status
- sent/delivered/opened/clicked timestamps
- provider ID
- failure reason

Actions:

- preview
- inspect event timeline
- retry failed email
- cancel scheduled email
- navigate to subscriber/campaign/enrollment

### 14.7 Offers

- active/draft/paused offers
- terms and exclusions
- issued count
- redeemed count
- redemption rate
- realised discount cost
- attributed revenue
- expiry distribution
- code lookup
- pause future issuance without invalidating already-issued codes unless explicitly chosen

### 14.8 Reports

Reports must support date range, source, preference, flow, campaign, and customer-type filters.

Reports:

- capture funnel
- list growth and churn
- flow performance by step
- campaign performance
- conversion at 1, 7, and 14 days
- attributed orders/revenue
- revenue per subscriber/recipient
- offer redemption and discount cost
- source quality
- preference performance
- deliverability health
- monthly email allowance usage/forecast

### 14.9 Settings

- sender name/email
- reply-to email
- organisation identity/footer
- default UTM values
- attribution window
- global frequency cap
- daily safety cap below Medusa’s 1,500 limit
- monthly warning thresholds
- test-recipient allowlist
- default quiet hours
- popup cooldown
- offer exclusions
- capture consent copy/version
- unsubscribe confirmation copy
- emergency global pause

### 14.10 Audit Log

Record:

- campaign created/edited/scheduled/cancelled
- flow activated/paused/versioned
- offer activated/paused
- subscriber manually suppressed/unsubscribed/resubscribed
- test sends
- export actions
- settings changes

Store Admin actor, timestamp, action, target, and bounded before/after summaries.

## 15. Campaign audience and sending safety

Default global rules:

- only `subscribed` profiles
- exclude suppressed, unsubscribed, complained, or bounced profiles
- exclude recipients who exceed frequency cap
- exclude missing/invalid emails
- deduplicate by normalised email
- materialise recipients before scheduling
- freeze the recipient snapshot at schedule time unless campaign is explicitly rebuilt
- batch sending with idempotency
- stop if failure rate crosses safety threshold
- support global emergency pause

Initial frequency recommendation:

- maximum one promotional campaign in 24 hours
- maximum three promotional emails in seven days, excluding transactional emails
- automation and campaign collision rules favour purchase-critical automation and suppress low-priority campaign sends

## 16. Email dispatch jobs

### Marketing scheduler

- Run every five minutes.
- Select due events in bounded batches.
- Atomically claim events before sending.
- Recheck subscriber status, flow status, purchase exit, offer validity, and frequency cap immediately before send.
- Render from immutable event inputs/current approved template version.
- Send through Notification Module.
- Persist provider notification ID.
- Mark failure with bounded error text.
- Retry transient errors with capped exponential schedule.
- Never retry permanent suppression/bounce failures.

### Campaign dispatcher

- Separate job from automation scheduler.
- Respect daily cap and configured per-run batch.
- Maintain progress counters.
- Resume safely after deployment/restart.
- Never regenerate recipient audience mid-send.

### Reconciliation jobs

- Expire offer issuances.
- Cancel purchased/unsubscribed enrollments.
- Refresh subscriber order counts and revenue.
- Reconcile provider/email activity where Medusa exposes programmatic events.
- Detect stuck `sending` events.
- Calculate daily aggregate reporting tables if live queries become expensive.

## 17. Event tracking and attribution

### Click tracking

- Every marketing link passes through a signed MUSE redirect token.
- Record first click and subsequent aggregate count.
- Redirect only to allowlisted MUSE domains/paths.
- Attach UTM parameters.

### Order attribution

Initial attribution model:

- last clicked marketing email within seven days
- if no click, optional last opened email within one day only if reliable provider data exists
- promotion-code redemption is deterministic attribution
- record both attributed and assisted values when appropriate
- never double-count the same order’s revenue across dashboards

Order subscriber responsibilities:

- find subscriber by customer ID or normalised email
- update order count/lifetime revenue
- cancel non-purchaser flows
- mark offer redeemed if code matches
- create attribution events
- update campaign/flow aggregates

## 18. Reporting definitions

Use explicit metric definitions in code and Admin tooltips.

- Popup view rate = popup views / eligible sessions
- Preference completion = preference selections / popup views
- Signup conversion = successful new subscriptions / popup views
- Source conversion = first orders within attribution window / new subscribers from source
- Delivery rate = delivered / sent
- Click rate = unique clicked recipients / delivered
- Flow conversion = attributed purchasers / flow entrants
- Revenue per subscriber = attributed revenue / flow entrants or new subscribers, labelled by context
- Offer redemption = redeemed issuances / issued offers
- Discount cost = realised discount applied, not face value issued
- Net attributed revenue indicator = attributed revenue minus realised discount; not a profit calculation
- Unsubscribe rate = unsubscribes / delivered
- Complaint rate = complaints / delivered

Open rate must be presented as directional because email privacy features can inflate opens.

## 19. Email allowance controls

Launch allowance assumptions:

- 10,000 emails/month included
- 1,500/day provider limit

Application controls:

- warning at 7,500 projected/actual sends
- critical warning at 9,000
- campaign scheduling blocked when projected monthly usage exceeds configurable safety level unless Admin explicitly confirms
- dispatcher hard safety cap below 1,500/day, initially 1,350, leaving room for transactional emails
- transactional emails always reserve capacity
- show estimated cost of overage using configured plan values, not a hardcoded permanent claim

## 20. Privacy, security, and deliverability

- Verify the MUSE sender domain, SPF, DKIM, and DMARC in Medusa Cloud.
- Use a stable sender such as `MUSE NZ <hello@musenz.com>` and monitored reply-to.
- Keep order mail and marketing consent logically separate even if sent through the same provider.
- Include unsubscribe in every marketing email.
- Honour unsubscribe immediately.
- Treat provider complaint/bounce suppression as authoritative.
- Never buy/import marketing lists without consent.
- Do not log full tokens, raw request bodies containing unnecessary PII, or email HTML containing sensitive customer/order content.
- Tokenise and sign unsubscribe, preference, and click URLs.
- Rotate signing secrets safely.
- Protect Admin exports and record them in the audit log.
- Add CSRF/auth protections through normal Medusa Admin session patterns.
- Rate-limit public capture/event endpoints.
- Sanitize campaign content and disallow arbitrary scripts/unsafe URLs.

## 21. Implementation phases

### Phase 0 — decisions, legal copy, and baseline

Deliverables:

- approve NZ$20 off NZ$150 terms
- approve clearance/limited exclusions
- approve consent and unsubscribe copy
- replace obsolete Klaviyo references in Privacy Policy
- record current Medusa email usage baseline
- confirm sender domain health
- document current popup/free-shipping/cart overlay behaviour

Gate:

- no sending changes
- business/legal copy approved
- baseline saved

### Phase 1 — marketing module and consent foundation

Deliverables:

- subscriber, consent, preference models
- module registration
- generated migration
- subscribe/unsubscribe/preferences workflows
- public Store APIs
- Admin subscriber read-only list/detail
- seed source/preference enums

Gate tests:

- duplicate signup idempotency
- normalised email uniqueness
- resubscribe appends history
- unsubscribe cancels marketing eligibility
- no transactional suppression
- migration and rollback validation
- backend build/typecheck

### Phase 2 — functional onsite capture

Deliverables:

- two-step popup
- homepage CTA opens popup
- functional footer capture
- source tracking
- success/error/duplicate states
- eligibility/session cooldown
- accessibility behaviour
- overlay coordination with cart drawer/free-shipping notification
- capture funnel events

Gate tests:

- desktop/mobile viewport matrix
- keyboard-only flow
- Escape/focus restoration
- cart/checkout exclusions
- dismissal 30-day suppression
- successful permanent local suppression
- no stacked overlays
- footer works with JavaScript/network failure messaging
- storefront typecheck/build

### Phase 3 — offer issuance

Deliverables:

- offer and issuance models
- promotion-creation workflow
- unique code generation
- NZ$20/NZ$150/120-hour rules
- first-order eligibility
- exclusions and non-combinability
- Admin offer page

Gate tests:

- existing customer gets no code
- first-time subscriber gets exactly one code
- duplicate request returns same issuance
- below-minimum cart rejected
- clearance excluded
- second use rejected
- expired code rejected
- combined promotion rejected
- qualifying checkout succeeds without payment submission during QA

### Phase 4 — first-time welcome automation

Deliverables:

- flow, step, enrollment, email-event models
- five React Email templates
- preview routes
- scheduled dispatcher
- cancellation on purchase/unsubscribe/suppression
- Admin automation list/detail
- per-event preview

Gate tests:

- correct timing and subjects
- preference-specific Email 3
- unique code in all relevant emails
- true expiry display
- unsubscribe present
- one plain-text pattern-interrupt email
- no duplicate send after retry/restart
- purchase cancels remaining events
- preview never sends
- explicit test-send confirmation

### Phase 5 — returning-customer VIP flow

Deliverables:

- returning classification
- two-step VIP flow
- preference and purchase-aware content
- no discount issuance
- reporting split

Gate tests:

- imported/returning customer receives no first-order claim
- classification failure issues no offer
- VIP enrollment is idempotent

### Phase 6 — full subscriber Admin and email activity

Deliverables:

- filters, pagination, search
- consent timeline
- enrollment and email history
- offer/order/revenue panels
- safe manual actions
- CSV export
- unified Email Activity page
- retry/cancel controls

Gate tests:

- Admin SDK authentication
- loading/error/empty states
- correct cache invalidation
- export respects filters and authorization
- no sensitive tokens in UI/export

### Phase 7 — dashboard and reporting

Deliverables:

- overview KPI cards
- funnel/time-series/revenue/source reports
- usage forecast
- health alerts
- attribution logic
- order subscriber integration

Gate tests:

- fixture reconciliation from raw events to aggregates
- no revenue double-counting
- NZD formatting
- Pacific/Auckland display
- date filters consistent across reports

### Phase 8 — campaign builder and segments

Deliverables:

- segment definitions/estimator
- campaign/recipient models
- structured composer
- preview/test send
- materialised audience
- scheduling/pausing/cancelling
- campaign dispatcher
- usage and frequency gates
- campaign reporting

Gate tests:

- excludes unsubscribed/suppressed profiles
- audience snapshot stable
- no duplicate recipients
- no duplicate sends after restart
- global pause works
- daily cap reserves transactional capacity
- campaign cannot send without confirmation

### Phase 9 — hardening and optimisation

Deliverables:

- provider event reconciliation where available
- bounce/complaint alerts
- stuck-send recovery
- query/index performance review
- data retention jobs
- disaster/retry runbook
- A/B testing framework
- content version history

Gate:

- production load rehearsal
- failure injection
- restore/retry test
- end-to-end audit

## 22. Verification matrix

Every implementation phase must include proportionate tests.

### Backend

- module migration generation and application
- service CRUD tests
- workflow success, compensation, retry, and idempotency
- API validation/auth/rate-limit tests
- scheduled-job batch and restart tests
- TypeScript and Medusa build

### Storefront

- homepage, PDP, collection, store, cart, checkout, account, static pages
- desktop and mobile
- anonymous, customer, subscribed, dismissed states
- slow network and server error
- keyboard/screen-reader basics
- cart drawer and free-shipping notification collision

### Admin

- list/detail navigation
- pagination/search/filter
- loading/error/empty states
- previews
- safe action confirmations
- cache invalidation after mutation
- timezone and currency display

### Email

- Gmail web/mobile
- Apple Mail
- Outlook where practical
- images-off fallback
- dark mode
- links and tracking
- unsubscribe
- subject/preview text
- plain-text rendering
- code/expiry accuracy

### Production

- migration succeeds
- backend/storefront deployed
- sender domain verified
- Store API returns expected safe responses
- test subscriber end-to-end
- offer applies to qualifying test cart
- unsubscribe immediately blocks future marketing
- Admin dashboard reflects events
- no real-customer bulk sends during verification

## 23. Rollout controls

- All flows default to `draft` after deployment.
- A separate explicit Admin activation is required.
- Initial production allowlist: internal MUSE test addresses only.
- Expand to 5%, 25%, then 100% of new eligible signups after clean checks.
- Existing historical profiles must not be enrolled retroactively by default.
- Campaign sending remains disabled until Phase 8 passes.
- Emergency global pause must be available before broad activation.
- Preserve the existing abandoned-cart feature; do not merge its data tables during initial marketing build.

## 24. Recommended file map

```text
apps/backend/src/modules/marketing/
  index.ts
  service.ts
  models/
  migrations/

apps/backend/src/workflows/marketing/
apps/backend/src/workflows/steps/marketing/
apps/backend/src/api/store/marketing/
apps/backend/src/api/admin/marketing/
apps/backend/src/jobs/process-marketing-automations.ts
apps/backend/src/jobs/process-marketing-campaigns.ts
apps/backend/src/subscribers/marketing-order-placed.ts
apps/backend/src/emails/marketing/

apps/backend/src/admin/routes/marketing/page.tsx
apps/backend/src/admin/routes/marketing/subscribers/
apps/backend/src/admin/routes/marketing/automations/
apps/backend/src/admin/routes/marketing/campaigns/
apps/backend/src/admin/routes/marketing/segments/
apps/backend/src/admin/routes/marketing/email-activity/
apps/backend/src/admin/routes/marketing/offers/
apps/backend/src/admin/routes/marketing/reports/
apps/backend/src/admin/routes/marketing/settings/

apps/storefront/src/modules/marketing/
  components/welcome-popup/
  components/newsletter-form/
  context/marketing-overlay-context.tsx
  hooks/
  types/
```

During implementation, confirm exact existing SDK and Admin dependency versions before adding imports.

## 25. Deferred features

Do not include these in the initial welcome launch, but the architecture should permit them:

- restock alerts tied to product/variant/size
- browse abandonment
- post-purchase cross-sell
- replenishment reminders
- customer win-back
- birthday/anniversary flows
- loyalty/VIP tiers
- SMS
- referral program
- predictive send time
- product recommendation ranking
- A/B tests for subject, offer, popup timing, and content
- campaign templates and reusable content library
- approval workflow for campaign publishing

## 26. Definition of done for the full system

The full native system is complete only when:

- every capture surface writes to one canonical subscriber profile
- consent history is auditable
- unsubscribe is immediate and global for marketing
- first-time/returning split is correct
- promotions are unique, enforced, and reported
- welcome and VIP flows render, schedule, send, cancel, preview, and attribute correctly
- Admin contains Overview, Subscribers, Automations, Campaigns, Segments, Email Activity, Offers, Reports, Settings, and Audit Log
- campaigns have audience, frequency, allowance, preview, test-send, and confirmation safeguards
- email and revenue metrics reconcile against source events
- all production activation gates pass
- no dependency on Klaviyo remains in runtime code or public policy copy

## 27. First implementation task

Start with **Phase 0 and Phase 1 only**.

Do not build the popup or send welcome emails in the first implementation task. Establish the canonical subscriber/consent foundation, safe APIs, migration, and read-only Admin visibility first. This gives every later phase a reliable source of truth and makes rollout reversible.
