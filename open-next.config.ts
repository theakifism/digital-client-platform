import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Default settings. Every page of this site reads fresh data from the database, so no page cache is configured.
export default defineCloudflareConfig()
