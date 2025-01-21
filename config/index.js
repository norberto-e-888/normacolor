const { z } = require("zod");

let Config = z.object({
  AUTH_SECRET: z.string(),
  AUTH_RESEND_KEY: z.string(),
  AUTH_RESEND_FROM_EMAIL: z.string(),
  AWS_ACCESS_KEY: z.string(),
  AWS_SECRET_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),
  FREEPIK_API_KEY: z.string(),
  MONGODB_URI: z.string(),
  NGROK_TOKEN: z.string().optional(),
  NGROK_TUNNEL: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "staging", "test"]),
  OPEN_AI_API_KEY: z.string(),
  PAYPAL_CLIENT_ID: z.string(),
  PAYPAL_CLIENT_SECRET: z.string(),
  PAYPAL_MODE: z.enum(["sandbox", "live"]),
  PUSHER_APP_KEY: z.string(),
  PUSHER_SECRET: z.string(),
  PUSHER_APP_ID: z.string(),
  PUSHER_CLUSTER: z.enum(["us2"]),
  SHUTTERSTOCK_API_KEY: z.string(),
  UPSTASH_REDIS_REST_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
});

const config = Config.parse(process.env);

module.exports.config = config;
