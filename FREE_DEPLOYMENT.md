# 🆓 Free Deployment Guide

This guide focuses on **100% FREE** deployment options for your API monitoring app.

## 🎯 Best Free Stack

- **Frontend**: Vercel (Free tier: Unlimited projects, 100GB bandwidth)
- **Backend**: Render (Free tier: 750 hours/month) OR Fly.io (Free tier: 3 VMs)
- **Database**: Supabase (Free tier: 500MB database, 2GB bandwidth)
- **Email**: Gmail SMTP (Free, but limited) OR Resend (Free tier: 3,000 emails/month)

---

## 🚀 Option 1: Vercel + Render (Recommended - Easiest)

### Frontend: Vercel (Free Forever)

1. **Push to GitHub** (see GitHub setup below)
2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
3. Click "Add New Project" → Import your repo
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_APP_NAME=API Monitor
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```
6. Click "Deploy" → Done! ✅

**Free Tier Limits:**

- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains (free)
- ⚠️ Sleeps after 30 days of inactivity (wakes on first request)

### Backend: Render (Free Tier)

1. Go to [render.com](https://render.com) → Sign up with GitHub (free)
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: `api-monitoring-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Free Tier Settings:**
   - Plan: Free
   - Auto-Deploy: Yes
6. Add Environment Variables (see Environment Variables section below)
7. Click "Create Web Service"
8. **After first deploy**, run migrations:
   - Go to "Shell" tab in Render dashboard
   - Run: `npm run migrate:up`

**Free Tier Limits:**

- ✅ 750 hours/month (enough for 24/7)
- ✅ 512MB RAM
- ⚠️ Sleeps after 15 minutes of inactivity (wakes in ~30 seconds)
- ⚠️ Limited CPU when sleeping

**Note**: The sleep/wake is fine for a side project. First request after sleep takes ~30 seconds.

---

## 🚀 Option 2: Vercel + Fly.io (More Reliable, No Sleep)

### Frontend: Vercel (Same as above)

### Backend: Fly.io (Free Tier)

1. Install Fly CLI:

   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Sign up: [fly.io](https://fly.io) → Sign up (free)

3. Login:

   ```bash
   flyctl auth login
   ```

4. Create app:

   ```bash
   cd backend
   flyctl launch
   ```

   - Choose app name (or auto-generate)
   - Choose region
   - Don't deploy yet (say no)

5. Create `backend/fly.toml`:

   ```toml
   app = "your-app-name"
   primary_region = "iad"  # Change to your region

   [build]
     builder = "paketobuildpacks/builder:base"

   [http_service]
     internal_port = 3001
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[services]]
     http_checks = []
     internal_port = 3001
     processes = ["app"]
     protocol = "tcp"
     script_checks = []

     [services.concurrency]
       hard_limit = 25
       soft_limit = 20
       type = "connections"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

     [[services.http_checks]]
       interval = "10s"
       timeout = "2s"
       grace_period = "5s"
       method = "GET"
       path = "/health"
   ```

6. Set secrets (environment variables):

   ```bash
   flyctl secrets set JWT_SECRET="your-secret"
   flyctl secrets set SUPABASE_URL="your-url"
   # ... set all other env vars
   ```

7. Deploy:
   ```bash
   flyctl deploy
   ```

**Free Tier Limits:**

- ✅ 3 shared-cpu-1x VMs (256MB RAM each)
- ✅ 3GB persistent volume storage
- ✅ 160GB outbound data transfer
- ✅ No sleep (always on)
- ⚠️ Limited to 3 apps

---

## 🚀 Option 3: All-in-One with Docker (Advanced)

Deploy both frontend and backend together using Docker on a free VPS:

### Free VPS Options:

- **Oracle Cloud Free Tier**: 2 VMs, 200GB storage (forever free)
- **Google Cloud Free Tier**: $300 credit for 90 days
- **AWS Free Tier**: 12 months free

### Quick Docker Deploy:

1. **Set up VPS** (Oracle Cloud example):

   - Sign up at [cloud.oracle.com](https://cloud.oracle.com)
   - Create a VM (Always Free eligible)
   - SSH into it

2. **Install Docker**:

   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Clone and deploy**:
   ```bash
   git clone <your-repo>
   cd api-monitoring
   # Create .env file with all variables
   docker-compose up -d
   ```

---

## 📝 Environment Variables

### Backend (Render/Fly.io)

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_EXPIRES_IN=7d
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<gmail-app-password>
FROM_EMAIL=<your-email@gmail.com>
FROM_NAME=API Monitor
FRONTEND_URL=https://your-app.vercel.app
DEFAULT_CHECK_INTERVAL=5
MAX_CHECKS_PER_USER=50
ALERT_COOLDOWN_MINUTES=30
```

### Frontend (Vercel)

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_APP_NAME=API Monitor
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 🔐 Generate JWT Secret

```bash
openssl rand -hex 32
```

---

## 📊 Free Tier Comparison

| Service        | Free Tier                           | Sleep?       | Best For             |
| -------------- | ----------------------------------- | ------------ | -------------------- |
| **Vercel**     | Unlimited projects, 100GB bandwidth | No           | Frontend (Next.js)   |
| **Render**     | 750 hours/month                     | Yes (15 min) | Backend (easy setup) |
| **Fly.io**     | 3 VMs, always on                    | No           | Backend (reliable)   |
| **Supabase**   | 500MB DB, 2GB bandwidth             | No           | Database             |
| **Gmail SMTP** | Unlimited (but rate limited)        | No           | Email alerts         |

---

## 🎯 Recommended Setup for Side Project

**Best Free Stack:**

1. **Frontend**: Vercel (free, no sleep, perfect for Next.js)
2. **Backend**: Render (free, easy, sleeps but wakes fast)
3. **Database**: Supabase (free tier is generous)
4. **Email**: Gmail SMTP (free, works for side projects)

**Total Cost: $0/month** ✅

---

## 🚨 Important Notes

1. **Render Sleep**: Your backend will sleep after 15 min of inactivity. First request takes ~30 seconds. This is fine for a side project.

2. **Vercel**: Frontend never sleeps, always fast.

3. **Supabase**: Free tier is very generous for side projects.

4. **Gmail SMTP**:

   - Use App Password (not regular password)
   - Limited to 500 emails/day
   - For more, use Resend (free tier: 3,000/month)

5. **Custom Domains**: Both Vercel and Render support free custom domains.

---

## 🐛 Troubleshooting

### Render Backend Sleeping

- This is normal on free tier
- First request after sleep takes ~30 seconds
- Consider Fly.io if you need always-on

### Vercel Build Fails

- Check `NEXT_PUBLIC_API_URL` is set
- Verify build command: `npm run build`
- Check root directory is `frontend`

### Can't Connect Frontend to Backend

- Verify `NEXT_PUBLIC_API_URL` in Vercel matches Render URL
- Check CORS in backend (FRONTEND_URL should match Vercel URL)
- Ensure backend is awake (make a request to it first)

---

## ✅ Quick Start Checklist

- [ ] Push code to GitHub (personal account)
- [ ] Deploy frontend to Vercel (free)
- [ ] Deploy backend to Render (free)
- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Test the app
- [ ] Set up custom domain (optional)

**Total time: ~30 minutes** ⏱️

Good luck! 🚀
