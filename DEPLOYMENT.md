# Deployment Guide

This guide covers deploying your API Monitoring application to production.

## 🏗️ Architecture Overview

- **Frontend**: Next.js 14 (can be deployed to Vercel, Netlify, or any Node.js host)
- **Backend**: Express.js API (can be deployed to Railway, Render, Fly.io, or any Node.js host)
- **Database**: Supabase (already hosted)
- **Email**: SMTP service (Gmail, SendGrid, etc.)

## 📋 Pre-Deployment Checklist

- [ ] Supabase project is set up and migrations are run
- [ ] Environment variables are documented
- [ ] Production build works locally
- [ ] SMTP credentials are configured
- [ ] Domain names are ready (optional)

---

## 🚀 Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

### Frontend Deployment (Vercel)

1. **Push your code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy to Vercel**

   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "Add New Project"
   - Import your repository
   - Configure:
     - **Root Directory**: `frontend`
     - **Framework Preset**: Next.js
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
     - **Install Command**: `npm install`

3. **Set Environment Variables in Vercel**

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_APP_NAME=API Monitor
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main

### Backend Deployment (Railway)

1. **Install Railway CLI** (optional, or use web interface)

   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Create a new project**

   ```bash
   railway init
   railway link
   ```

3. **Configure Build Settings**

   - In Railway dashboard, go to Settings → Build
   - Set:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

4. **Set Environment Variables**
   Go to Variables tab and add:

   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=<generate-a-strong-secret>
   JWT_EXPIRES_IN=7d
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=<your-email@gmail.com>
   SMTP_PASS=<your-app-password>
   FROM_EMAIL=<your-email@gmail.com>
   FROM_NAME=API Monitor
   FRONTEND_URL=https://your-frontend.vercel.app
   DEFAULT_CHECK_INTERVAL=5
   MAX_CHECKS_PER_USER=50
   ALERT_COOLDOWN_MINUTES=30
   ```

5. **Run Migrations**
   After first deployment, run migrations:

   ```bash
   railway run npm run migrate:up
   ```

   Or SSH into the container and run migrations manually.

6. **Deploy**
   - Push to your connected branch
   - Railway will automatically deploy

---

## 🐳 Option 2: Docker Deployment

### Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
```

### Create Dockerfile for Frontend

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY next.config.js* ./
COPY tsconfig.json ./
COPY tailwind.config.js* ./
COPY postcss.config.js* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js* ./

EXPOSE 3000

CMD ["npm", "start"]
```

### Create docker-compose.yml

Create `docker-compose.yml` in root:

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      JWT_SECRET: ${JWT_SECRET}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      FROM_EMAIL: ${FROM_EMAIL}
      FRONTEND_URL: ${FRONTEND_URL}
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    depends_on:
      - backend
    restart: unless-stopped
```

### Deploy with Docker

1. **Build and run locally**

   ```bash
   docker-compose up -d
   ```

2. **Deploy to cloud with Docker support**
   - **Fly.io**: `flyctl launch`
   - **DigitalOcean App Platform**: Connect GitHub repo
   - **AWS ECS/Fargate**: Use docker-compose or individual containers
   - **Google Cloud Run**: `gcloud run deploy`

---

## 🌐 Option 3: Render (Full Stack)

### Backend on Render

1. **Create a new Web Service**

   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repo

2. **Configure**

   - **Name**: `api-monitoring-backend`
   - **Environment**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Set Environment Variables** (same as Railway)

4. **Deploy**

### Frontend on Render

1. **Create a new Static Site**

   - Click "New +" → "Static Site"
   - Connect your GitHub repo

2. **Configure**

   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`

3. **Set Environment Variables**

   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

4. **Deploy**

---

## 🔧 Environment Variables Reference

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=API Monitor

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# Monitoring Config
DEFAULT_CHECK_INTERVAL=5
MAX_CHECKS_PER_USER=50
ALERT_COOLDOWN_MINUTES=30
```

### Frontend (.env.local or Vercel Environment Variables)

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_APP_NAME=API Monitor
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 🔐 Security Checklist

- [ ] Use strong JWT_SECRET (generate with `openssl rand -hex 32`)
- [ ] Never commit `.env` files
- [ ] Enable HTTPS only
- [ ] Set up CORS properly (FRONTEND_URL)
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting in production
- [ ] Set up proper error logging (avoid exposing stack traces)

---

## 📊 Post-Deployment Steps

1. **Run Database Migrations**

   ```bash
   # SSH into your backend container/server
   cd backend
   npm run migrate:up
   ```

2. **Verify Deployment**

   - Test frontend: `https://your-frontend.vercel.app`
   - Test backend: `https://your-backend.railway.app/api/health`
   - Test login/register flow
   - Create a test monitor

3. **Set Up Monitoring** (optional)

   - Use UptimeRobot or similar to monitor your backend
   - Set up error tracking (Sentry, LogRocket)

4. **Set Up Custom Domain** (optional)
   - Vercel: Add domain in project settings
   - Railway: Add custom domain in settings
   - Update CORS and FRONTEND_URL accordingly

---

## 🐛 Troubleshooting

### Backend won't start

- Check environment variables are set correctly
- Verify database connection (Supabase)
- Check logs: `railway logs` or `docker logs <container>`

### Frontend can't connect to backend

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

### Database migration errors

- Ensure bootstrap SQL is run in Supabase
- Check Supabase credentials are correct
- Verify migrations table exists

### Email not working

- Verify SMTP credentials
- For Gmail, use App Password (not regular password)
- Check firewall/security settings

---

## 🚀 Quick Deploy Commands

### Railway (Backend)

```bash
railway login
railway init
railway link
railway up
```

### Vercel (Frontend)

```bash
npm i -g vercel
vercel login
cd frontend
vercel
```

### Docker

```bash
docker-compose up -d
docker-compose logs -f
```

---

## 📝 Notes

- **Free Tier Limits**: Be aware of free tier limits on hosting platforms
- **Cold Starts**: Some platforms have cold starts (Render, Railway free tier)
- **Database**: Supabase free tier is generous but has limits
- **Email**: Consider using SendGrid/Mailgun for production (better deliverability)

---

## 🎯 Recommended Production Setup

1. **Frontend**: Vercel (best Next.js support, free tier)
2. **Backend**: Railway or Render (good free tiers)
3. **Database**: Supabase (already set up)
4. **Email**: SendGrid or Mailgun (better than Gmail SMTP)
5. **Monitoring**: UptimeRobot (free tier available)
6. **Error Tracking**: Sentry (free tier available)

Good luck with your deployment! 🚀
