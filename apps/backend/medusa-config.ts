import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const isProduction = process.env.NODE_ENV === "production"

const required = (name: string, developmentFallback?: string) => {
  const value = process.env[name] || developmentFallback

  if (!value && isProduction) {
    throw new Error(`Missing required production environment variable: ${name}`)
  }

  return value
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: required("STORE_CORS", "http://localhost:8000")!,
      adminCors: required("ADMIN_CORS", "http://localhost:9000")!,
      authCors: required(
        "AUTH_CORS",
        "http://localhost:8000,http://localhost:9000"
      )!,
      jwtSecret: required("JWT_SECRET", "development-jwt-secret")!,
      cookieSecret: required("COOKIE_SECRET", "development-cookie-secret")!,
    }
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              capture: process.env.STRIPE_CAPTURE === "true",
              automatic_payment_methods:
                process.env.STRIPE_AUTOMATIC_PAYMENT_METHODS === "true",
            },
          },
        ],
      },
    },
  ],
})
