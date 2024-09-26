/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require("zod");

const Config = z.object({
  AUTH_SECRET: z.string(),
  AUTH_RESEND_KEY: z.string(),
  AUTH_SENDGRID_KEY: z.string(),
  MONGODB_URI: z.string(),
  NGROK_TOKEN: z.string(),
  NGROK_TUNNEL: z.string(),
  USER_CLIENT_ROOT: z.string().optional().default("/"),
  USER_ADMIN_ROOT: z.string().optional().default("/admin"),
});

const config = Config.parse(process.env);

module.exports.config = config;
