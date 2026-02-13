import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    disable: true, // Disable built-in admin - we use custom admin-ui
  },
  modules: [
    {
      resolve: "./src/modules/brand",
    },
    {
      resolve: "./src/modules/page",
    },
    {
      resolve: "./src/modules/tag",
    },
    {
      resolve: "./src/modules/announcement",
    },
    {
      resolve: "./src/modules/popup",
    },
    {
      resolve: "./src/modules/banner",
    },
    {
      resolve: "./src/modules/article",
    },
    {
      resolve: "./src/modules/curated-collection",
    },
    {
      resolve: "./src/modules/menu",
    },
  ],
  projectConfig: {
    redisUrl: process.env.REDIS_URL,
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})
