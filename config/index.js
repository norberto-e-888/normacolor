/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require("zod");

const Config = z.object({
  ADOBE_CLIENT_ID: z.string(),
  ADOBE_CLIENT_SECRET: z.string(),
  ADOBE_ACCESS_TOKEN: z.string(),
  AUTH_SECRET: z.string(),
  AUTH_RESEND_KEY: z.string(),
  AUTH_SENDGRID_KEY: z.string(),
  AWS_ACCESS_KEY: z.string(),
  AWS_SECRET_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),
  FREEPIK_API_KEY: z.string(),
  MONGODB_URI: z.string(),
  NGROK_TOKEN: z.string().optional(),
  NGROK_TUNNEL: z.string().optional(),
  OPEN_AI_API_KEY: z.string(),
});

const config = Config.parse(process.env);

module.exports.config = config;
