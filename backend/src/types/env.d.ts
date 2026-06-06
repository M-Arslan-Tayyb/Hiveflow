/**
 * Strongly-typed environment variables.
 * Augments NodeJS.ProcessEnv so `process.env.X` is type-checked everywhere.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "production" | "test";
      PORT?: string;
      APP_NAME?: string;
      DATABASE_URL: string;
      APP_URL?: string;

      ACCESS_TOKEN_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRES_IN?: string;
      REFRESH_TOKEN_EXPIRES_IN?: string;

      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;

      FRONTEND_URL?: string;
      OWNER_INVITE_SECRET?: string;
    }
  }
}

export {};
