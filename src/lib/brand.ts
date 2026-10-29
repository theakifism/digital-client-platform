// One place for the company name and logo. Change the name here and it updates everywhere.
// The spelling can also be switched without touching code: set NEXT_PUBLIC_BRAND_NAME in .env.local and in the host's settings.
// (The logo is a picture: public/logo.png must be replaced separately if the spelling changes.)
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Orion Teleservices',
  logo: '/logo.png',
  logoWidth: 640,
  logoHeight: 212,
}
