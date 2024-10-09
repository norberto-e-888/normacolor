/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require("zod");

const Config = z.object({
  AUTH_SECRET: z.string(),
  AUTH_RESEND_KEY: z.string(),
  AUTH_SENDGRID_KEY: z.string(),
  MONGODB_URI: z.string(),
  NGROK_TOKEN: z.string().optional(),
  NGROK_TUNNEL: z.string().optional(),
});

const config = Config.parse(process.env);

module.exports.config = config;
