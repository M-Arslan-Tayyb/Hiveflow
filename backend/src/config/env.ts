import dotenv from "dotenv";

dotenv.config();

interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

interface SmtpConfig {
  host: string | undefined;
  port: string | undefined;
  user: string | undefined;
  pass: string | undefined;
}

interface AwsConfig {
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  region: string | undefined;
  bucketName: string | undefined;
}

interface AppConfig {
  env: string;
  port: number;
  appName: string;
  dbUrl: string;
  jwt: JwtConfig;
  smtp: SmtpConfig;
  aws: AwsConfig;
  frontendUrl: string | undefined;
  ownerInviteSecret: string | undefined;
  appUrl: string | undefined;
}

const config: AppConfig = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  appName: process.env.APP_NAME || "API",
  dbUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_BUCKET_NAME,
  },
  frontendUrl: process.env.FRONTEND_URL,
  ownerInviteSecret: process.env.OWNER_INVITE_SECRET,
  appUrl: process.env.APP_URL,
};

if (!config.dbUrl) {
  console.error("FATAL: DATABASE_URL is not defined");
  process.exit(1);
}

if (!config.jwt.accessSecret || !config.jwt.refreshSecret) {
  console.error("FATAL: JWT secrets are not defined");
  process.exit(1);
}

export default config;
