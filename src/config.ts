import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? '',
  auth: {
    username: process.env.APP_USERNAME ?? 'miaoupost',
    password: process.env.APP_PASSWORD ?? '',
  },
  facebook: {
    pageId: process.env.FB_PAGE_ID ?? '',
    pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN ?? '',
  },
  instagram: {
    businessAccountId: process.env.IG_BUSINESS_ACCOUNT_ID ?? '',
    accessToken: process.env.FB_PAGE_ACCESS_TOKEN ?? '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? '',
  },
  tiktok: {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN ?? '',
  },
};
