# 🔐 Setting Up Git for Personal GitHub (Work Laptop)

This guide helps you push to your personal GitHub account from your work laptop.

## 🎯 Option 1: Use SSH Keys (Recommended - No Password Needed)

### Step 1: Check if you have SSH keys

```bash
ls -la ~/.ssh
```

If you see `id_rsa` and `id_rsa.pub` (or `id_ed25519`), you already have keys. Skip to Step 3.

### Step 2: Generate SSH Key (if you don't have one)

```bash
ssh-keygen -t ed25519 -C "your-personal-email@gmail.com"
```

- Press Enter to accept default location
- **Set a passphrase** (optional but recommended for work laptop)
- This creates: `~/.ssh/id_ed25519` (private) and `~/.ssh/id_ed25519.pub` (public)

### Step 3: Add SSH Key to GitHub

1. **Copy your public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Or if you have id_rsa:
   cat ~/.ssh/id_rsa.pub
   ```

2. **Add to GitHub:**
   - Go to GitHub.com → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

### Step 4: Test SSH Connection

```bash
ssh -T git@github.com
```

You should see: "Hi username! You've successfully authenticated..."

### Step 5: Initialize Git and Push

```bash
cd /Users/abhaynarayan/api-monitoring

# Initialize git (if not already)
git init

# Configure git for THIS repo only (not global)
git config user.name "Your Personal Name"
git config user.email "your-personal-email@gmail.com"

# Add files
git add .

# Create .gitignore if needed
cat > .gitignore << EOF
node_modules/
.env
.env.local
.env.*.local
dist/
.next/
build/
coverage/
.DS_Store
*.log
EOF

git add .gitignore
git commit -m "Initial commit"

# Add remote using SSH
git remote add origin git@github.com:YOUR_USERNAME/api-monitoring.git

# Push
git branch -M main
git push -u origin main
```

---

## 🎯 Option 2: Use Personal Access Token (HTTPS)

### Step 1: Create Personal Access Token

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name it: "API Monitoring Project"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Initialize Git and Push

```bash
cd /Users/abhaynarayan/api-monitoring

# Initialize git
git init

# Configure for THIS repo only
git config user.name "Your Personal Name"
git config user.email "your-personal-email@gmail.com"

# Add files
git add .
git commit -m "Initial commit"

# Add remote using HTTPS
git remote add origin https://github.com/YOUR_USERNAME/api-monitoring.git

# Push (use token as password)
git push -u origin main
# Username: YOUR_GITHUB_USERNAME
# Password: YOUR_PERSONAL_ACCESS_TOKEN
```

**Note**: Git might cache your credentials. If it asks for password, use the token.

---

## 🎯 Option 3: Use Different Git Config Per Directory

If you want to use personal credentials only for this project:

```bash
cd /Users/abhaynarayan/api-monitoring

# Set local config (only for this repo)
git config user.name "Your Personal Name"
git config user.email "your-personal-email@gmail.com"

# Verify it's local (not global)
git config --local --list
```

This way, your work git config stays unchanged globally.

---

## 🔍 Verify Your Setup

```bash
# Check current git config (for this repo)
git config --local user.name
git config --local user.email

# Check remote URL
git remote -v
```

---

## 🚨 Important Security Notes

1. **Never commit `.env` files** - They contain secrets!
2. **Use `.gitignore`** - Already created above
3. **SSH is more secure** than HTTPS tokens
4. **Use passphrase** on SSH keys for work laptops
5. **Personal Access Tokens** expire - set a reminder to renew

---

## 🐛 Troubleshooting

### "Permission denied (publickey)"
- Make sure SSH key is added to GitHub
- Test: `ssh -T git@github.com`

### "Repository not found"
- Check repository name is correct
- Make sure repo exists on GitHub (create it first!)

### "Authentication failed"
- For HTTPS: Use Personal Access Token, not password
- For SSH: Make sure key is added to GitHub

### Git uses work email
- Use `git config --local` instead of `--global`
- Or unset global: `git config --global --unset user.email`

---

## ✅ Quick Checklist

- [ ] Create GitHub repository (on github.com)
- [ ] Generate SSH key OR Personal Access Token
- [ ] Add SSH key to GitHub (if using SSH)
- [ ] Initialize git in project
- [ ] Set local git config (name & email)
- [ ] Create .gitignore
- [ ] Add and commit files
- [ ] Add remote (SSH or HTTPS)
- [ ] Push to GitHub

**Done!** 🎉

