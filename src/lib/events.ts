// The things we count on a card. 'save' is counted by the server when the contact file is downloaded;
// the others are sent by the card and website pages in the visitor's browser.
export const CLIENT_EVENTS = ['view', 'site_view', 'call', 'whatsapp', 'email', 'directions', 'website', 'social'] as const
export const ALL_EVENTS = [...CLIENT_EVENTS, 'save'] as const

export const EVENT_LABELS: Record<string, string> = {
  view: 'Card views',
  site_view: 'Small website views',
  call: 'Call button taps',
  whatsapp: 'WhatsApp button taps',
  email: 'Email button taps',
  directions: 'Directions taps',
  website: 'Website link taps',
  social: 'Social link taps',
  save: 'Contacts saved',
}
