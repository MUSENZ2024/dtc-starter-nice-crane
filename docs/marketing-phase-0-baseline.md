# Native marketing Phase 0 baseline

Recorded: 21 July 2026 (Pacific/Auckland)

## Confirmed implementation terms

- Welcome offer: NZ$20 off a first order of NZ$150 or more.
- Expiry: 120 hours from issue.
- One non-combinable, single-use code per eligible first-time subscriber.
- Clearance is excluded; limited-release exclusions remain Admin-editable in a later phase.
- Existing customers use the returning/VIP path and receive no first-order offer.
- Marketing consent is independent from transactional order communication.

## Consent copy version

Version: `2026-07-21-v1`

> By joining, you agree to receive MUSE NZ marketing emails about new drops, restocks and offers. You can unsubscribe at any time. See our Privacy Policy.

This is the implementation copy for the inactive Phase 1 foundation. It still requires final business/legal approval before any capture surface or marketing send is activated.

## Current behaviour baseline

- Homepage and footer newsletter inputs are visual-only and do not submit.
- No marketing popup is active.
- The free-shipping notification is independently controlled and can overlap future capture UI.
- The cart drawer is independently controlled and must receive purchase-flow overlay priority in Phase 2.
- Existing abandoned-cart and transactional email automation remains separate and unchanged.

## Operational checks still required before activation

- Record the current Medusa Emails monthly usage from the production account.
- Verify the sender domain, SPF, DKIM, and DMARC health in Medusa Cloud.
- Confirm monitored sender and reply-to addresses.
- Obtain final approval for consent, unsubscribe, retention, and deletion wording.

No marketing sending, flow enrollment, offer issuance, popup, or historical-customer enrollment is enabled by Phase 0/1.
