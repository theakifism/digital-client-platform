// The ready-made social media post templates (Milestone 8).
// Everything here is our own design: colours, layouts and wording are written for this project.
// To add a template, add one line to TEMPLATES at the bottom. No database change is needed.

export type PaletteId = 'sunrise' | 'royal' | 'forest' | 'ocean' | 'rose' | 'midnight' | 'sand' | 'crimson'

export type Palette = {
  label: string
  bg1: string // background gradient start
  bg2: string // background gradient end
  text: string // text on the background
  accent: string // highlight colour (offer text, bands, rings)
  accentText: string // text drawn on top of the accent colour
  strong: string // a strong colour that is easy to read on white
  light: boolean // true when the background is light (so text is dark)
}

export const PALETTES: Record<PaletteId, Palette> = {
  sunrise: { label: 'Sunrise', bg1: '#e8590c', bg2: '#c2255c', text: '#ffffff', accent: '#ffe066', accentText: '#5a1030', strong: '#c2255c', light: false },
  royal: { label: 'Royal', bg1: '#3b2a8c', bg2: '#7b3fb8', text: '#ffffff', accent: '#ffd166', accentText: '#2a1a66', strong: '#3b2a8c', light: false },
  forest: { label: 'Forest', bg1: '#0f6b4a', bg2: '#2fa36b', text: '#ffffff', accent: '#fff3b0', accentText: '#0b4a33', strong: '#0f6b4a', light: false },
  ocean: { label: 'Ocean', bg1: '#0b4f9c', bg2: '#1fa3d8', text: '#ffffff', accent: '#ffffff', accentText: '#0b4f9c', strong: '#0b4f9c', light: false },
  rose: { label: 'Rose', bg1: '#c2185b', bg2: '#ff6f91', text: '#ffffff', accent: '#ffffff', accentText: '#a3124a', strong: '#c2185b', light: false },
  midnight: { label: 'Midnight', bg1: '#0e1a2b', bg2: '#1f3556', text: '#ffffff', accent: '#f5c542', accentText: '#0e1a2b', strong: '#0e1a2b', light: false },
  sand: { label: 'Sand', bg1: '#fbf1dc', bg2: '#f3d9a8', text: '#3a2a14', accent: '#b5541c', accentText: '#ffffff', strong: '#b5541c', light: true },
  crimson: { label: 'Crimson', bg1: '#a4161a', bg2: '#e5383b', text: '#ffffff', accent: '#ffffff', accentText: '#a4161a', strong: '#a4161a', light: false },
}

export type LayoutId = 'center' | 'band' | 'frame' | 'split' | 'badge'
export type MotifId = 'rays' | 'dots' | 'circles' | 'diagonals' | 'diamonds'
export type Category = 'festival' | 'offer' | 'general'

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'festival', label: 'Festivals' },
  { id: 'offer', label: 'Offers' },
  { id: 'general', label: 'General' },
]

export type PostTemplate = {
  id: string
  category: Category
  name: string // shown in the picker
  headline: string // starting text, the client can change it
  message: string // starting text, the client can change it
  offer: string // big offer text (can be empty)
  layout: LayoutId
  palette: PaletteId
  motif: MotifId
}

const t = (
  id: string,
  category: Category,
  name: string,
  headline: string,
  message: string,
  offer: string,
  layout: LayoutId,
  palette: PaletteId,
  motif: MotifId
): PostTemplate => ({ id, category, name, headline, message, offer, layout, palette, motif })

export const TEMPLATES: PostTemplate[] = [
  // Festivals
  t('diwali', 'festival', 'Diwali', 'Happy Diwali', 'May your home glow with light, joy and prosperity.', '', 'badge', 'sunrise', 'rays'),
  t('diwali-gold', 'festival', 'Diwali (night)', 'Shubh Deepavali', 'Wishing you and your family a bright and joyful festival of lights.', '', 'frame', 'midnight', 'diamonds'),
  t('holi', 'festival', 'Holi', 'Happy Holi', 'Wishing you a colourful day full of laughter and good moments.', '', 'center', 'rose', 'dots'),
  t('eid', 'festival', 'Eid', 'Eid Mubarak', 'May this Eid bring peace, happiness and blessings to you and your loved ones.', '', 'frame', 'forest', 'circles'),
  t('christmas', 'festival', 'Christmas', 'Merry Christmas', 'Warm wishes for a joyful season with the people you love.', '', 'center', 'crimson', 'dots'),
  t('new-year', 'festival', 'New Year', 'Happy New Year', 'Wishing you a year full of good health, success and happiness.', '', 'badge', 'midnight', 'rays'),
  t('republic', 'festival', 'Republic Day', 'Happy Republic Day', 'Proud of our nation. Wishing you a happy Republic Day.', '', 'split', 'forest', 'diagonals'),
  t('independence', 'festival', 'Independence Day', 'Happy Independence Day', 'Celebrating freedom, unity and pride. Jai Hind.', '', 'band', 'sunrise', 'circles'),
  t('rakhi', 'festival', 'Raksha Bandhan', 'Happy Raksha Bandhan', 'Celebrating the bond of love and care between brothers and sisters.', '', 'center', 'rose', 'circles'),
  t('ganesh', 'festival', 'Ganesh Chaturthi', 'Ganesh Chaturthi Wishes', 'May Lord Ganesha bless you with wisdom, health and happiness.', '', 'frame', 'sunrise', 'diamonds'),
  t('navratri', 'festival', 'Navratri', 'Happy Navratri', 'Wishing you nine days of joy, devotion and celebration.', '', 'badge', 'royal', 'dots'),
  t('dussehra', 'festival', 'Dussehra', 'Happy Dussehra', 'May good always win. Wishing you a joyful Dussehra.', '', 'band', 'crimson', 'diagonals'),
  t('sankranti', 'festival', 'Makar Sankranti', 'Happy Makar Sankranti', 'Wishing you a season of fresh starts and sweet moments.', '', 'center', 'ocean', 'rays'),
  t('pongal', 'festival', 'Pongal', 'Happy Pongal', 'May your home be full of harvest joy and good fortune.', '', 'split', 'sand', 'dots'),
  t('onam', 'festival', 'Onam', 'Happy Onam', 'Wishing you a joyful Onam filled with warmth and togetherness.', '', 'frame', 'sand', 'circles'),
  t('baisakhi', 'festival', 'Baisakhi', 'Happy Baisakhi', 'Wishing you a bright harvest festival and a prosperous year ahead.', '', 'center', 'forest', 'diagonals'),
  t('gudi-padwa', 'festival', 'Gudi Padwa', 'Happy Gudi Padwa', 'Wishing you a new year of happiness and success.', '', 'band', 'sunrise', 'dots'),
  t('shivratri', 'festival', 'Maha Shivratri', 'Maha Shivratri Wishes', 'May you find peace, strength and blessings tonight and always.', '', 'badge', 'midnight', 'circles'),
  t('womens-day', 'festival', "Women's Day", "Happy Women's Day", 'Celebrating the strength, talent and spirit of women everywhere.', '', 'split', 'rose', 'diamonds'),
  t('teachers-day', 'festival', "Teachers' Day", "Happy Teachers' Day", 'Thank you to every teacher who guides us.', '', 'center', 'royal', 'dots'),
  t('durga-puja', 'festival', 'Durga Puja', 'Shubho Durga Puja', 'Wishing you joy, devotion and celebration.', '', 'frame', 'crimson', 'rays'),
  t('guru-nanak', 'festival', 'Guru Nanak Jayanti', 'Guru Nanak Jayanti Wishes', 'Wishing you peace, kindness and blessings on this auspicious day.', '', 'center', 'ocean', 'circles'),
  t('janmashtami', 'festival', 'Janmashtami', 'Happy Janmashtami', 'Wishing you joy and blessings on this special day.', '', 'badge', 'ocean', 'rays'),

  // Offers (change the offer text to your real offer before you share)
  t('big-sale', 'offer', 'Big sale', 'Big Sale', 'For a limited time only. Visit us or call to know more.', 'UP TO 50% OFF', 'split', 'crimson', 'diagonals'),
  t('festive-offer', 'offer', 'Festive offer', 'Festive Offer', 'Celebrate with special prices on our best products and services.', 'FLAT 20% OFF', 'badge', 'sunrise', 'rays'),
  t('grand-opening', 'offer', 'Grand opening', 'Grand Opening', 'Come and visit us. We are open and ready to serve you.', 'NOW OPEN', 'band', 'forest', 'circles'),
  t('new-arrival', 'offer', 'New arrival', 'New Arrival', 'Fresh stock is here. Visit us to see what is new.', 'JUST IN', 'center', 'midnight', 'diamonds'),
  t('weekend', 'offer', 'Weekend offer', 'Weekend Offer', 'Valid this Saturday and Sunday only.', 'SAVE 15%', 'split', 'ocean', 'dots'),
  t('bogo', 'offer', 'Buy 1 Get 1', 'Special Offer', 'Ask us for details.', 'BUY 1 GET 1', 'badge', 'rose', 'diagonals'),
  t('free-delivery', 'offer', 'Free delivery', 'Free Delivery', 'On orders in your area. Call us to place your order.', 'FREE DELIVERY', 'band', 'ocean', 'dots'),
  t('limited-time', 'offer', 'Limited time', 'Limited Time Offer', 'Do not miss this special price.', '24 HOURS ONLY', 'frame', 'crimson', 'rays'),
  t('combo', 'offer', 'Combo offer', 'Combo Offer', 'Better value when you choose more.', 'SPECIAL COMBO', 'center', 'royal', 'circles'),
  t('consultation', 'offer', 'Free consultation', 'Free Consultation', 'Book your slot today. Limited slots available.', 'FREE CONSULTATION', 'split', 'forest', 'diamonds'),
  t('clearance', 'offer', 'Clearance sale', 'Clearance Sale', 'Visit us before the stock is gone.', 'UP TO 70% OFF', 'band', 'crimson', 'diagonals'),
  t('refer', 'offer', 'Refer a friend', 'Refer a Friend', 'Tell a friend about us and enjoy a special thank-you.', 'REFER & EARN', 'badge', 'sand', 'dots'),
  t('monsoon', 'offer', 'Monsoon offer', 'Monsoon Offer', 'Stay dry, save more. Special prices this season.', 'SAVE 25%', 'center', 'ocean', 'circles'),
  t('summer', 'offer', 'Summer offer', 'Summer Offer', 'Beat the heat with our special prices.', 'SAVE 20%', 'split', 'sunrise', 'rays'),

  // General
  t('thank-you', 'general', 'Thank you', 'Thank You', 'Thank you for your trust and support. We are grateful to have you with us.', '', 'frame', 'rose', 'dots'),
  t('good-morning', 'general', 'Good morning', 'Good Morning', 'Wishing you a bright and productive day.', '', 'center', 'sunrise', 'rays'),
  t('we-are-open', 'general', 'We are open', 'We Are Open', 'Visit us today. We look forward to seeing you.', '', 'band', 'forest', 'dots'),
  t('call-us', 'general', 'Call us', 'Call Us Today', 'Our team is ready to help you.', '', 'badge', 'ocean', 'circles'),
  t('hiring', 'general', 'Now hiring', 'We Are Hiring', 'Join our team. Call us or send a message to apply.', 'NOW HIRING', 'split', 'royal', 'diamonds'),
  t('happy-customers', 'general', 'Happy customers', 'Happy Customers', 'Thank you for the love and kind words.', '', 'center', 'sand', 'circles'),
  t('big-news', 'general', 'Announcement', 'Big News', 'Something new is coming. Stay tuned.', '', 'badge', 'midnight', 'rays'),
  t('closed', 'general', 'Holiday notice', 'Closed Today', 'We are closed today for the holiday and will be back soon.', '', 'frame', 'crimson', 'diagonals'),
  t('book-now', 'general', 'Book now', 'Book Your Slot', 'Limited slots available. Contact us today.', 'BOOK NOW', 'band', 'royal', 'circles'),
  t('services', 'general', 'Our services', 'Our Services', 'Quality service you can rely on.', '', 'split', 'ocean', 'dots'),
]

export function getTemplate(id: string): PostTemplate {
  return TEMPLATES.find((x) => x.id === id) ?? TEMPLATES[0]
}
