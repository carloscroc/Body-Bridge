# Cloud Database Usage Guide

## 🚀 Quick Start

### **Daily Development**
```bash
npm run dev
```
Your app will automatically connect to the cloud database at `https://groovy-pig-414.convex.cloud`

### **Building APK**
```bash
npm run build
npx cap sync
npx cap build android
```

---

## 📱 Important Note About .env.local

The `.env.local` file may get automatically updated during development. **Always verify it contains your cloud deployment URLs:**

```bash
# .env.local should contain:
CONVEX_DEPLOYMENT=groovy-pig-414
VITE_CONVEX_URL=https://groovy-pig-414.convex.cloud
VITE_CONVEX_SITE_URL=https://groovy-pig-414.convex.cloud
```

### **If .env.local gets overwritten:**

1. **Restore cloud URLs immediately:**
```bash
# Edit .env.local manually and set:
CONVEX_DEPLOYMENT=groovy-pig-414
VITE_CONVEX_URL=https://groovy-pig-414.convex.cloud
VITE_CONVEX_SITE_URL=https://groovy-pig-414.convex.cloud
```

2. **Or run this script:**
```bash
node scripts/deployConvex.mjs
```

---

## 🔍 How to Verify Cloud Connection

### **Check your current deployment:**
```bash
npx convex dashboard
```

### **Test database connection:**
```bash
npx convex run api.healthCheck
```

### **View database status:**
```bash
npx convex logs --tail
```

---

## 🛠️ Common Commands

| Command | Purpose | When to use |
|---------|---------|------------|
| `npm run dev` | Start development | Daily development |
| `npm run dev:app` | App only mode | No DB changes needed |
| `npm run dev:all` | Full local mode | Testing local DB |
| `npm run deploy:convex` | Deploy to cloud | After function changes |
| `npx convex dashboard` | View dashboard | Monitor database |
| `npx convex logs` | View logs | Debug issues |
| `npm run build` | Build app | Before APK build |

---

## 🔄 Development Workflow

### **Standard Development (Recommended)**
```bash
# 1. Start development
npm run dev

# 2. Make changes to your app

# 3. If you changed Convex functions:
npm run deploy:convex

# 4. Continue development
npm run dev
```

### **Building APK**
```bash
# 1. Ensure .env.local has cloud URLs
cat .env.local

# 2. Build app
npm run build

# 3. Sync with Capacitor
npx cap sync

# 4. Build APK
npx cap build android

# 5. Install APK on device
# Your app will connect to cloud database automatically
```

---

## ⚠️ Troubleshooting

### **App not connecting to database?**
1. Check `.env.local` has correct URLs
2. Restart development server: `npm run dev`
3. Verify deployment: `npx convex dashboard`

### **.env.local keeps getting overwritten?**
```bash
# Make cloud deployment the default
echo "CONVEX_DEPLOYMENT=groovy-pig-414" > .env.local
echo "VITE_CONVEX_URL=https://groovy-pig-414.convex.cloud" >> .env.local
echo "VITE_CONVEX_SITE_URL=https://groovy-pig-414.convex.cloud" >> .env.local
```

### **Need to check what deployment you're using?**
```bash
cat .env.local | grep CONVEX_DEPLOYMENT
```

### **Deployment switched to local accidentally?**
```bash
# Switch back to cloud
npx convex deployment select groovy-pig-414
```

---

## 📊 Cloud Database Status

### **Your Cloud Deployment**
- **URL**: https://groovy-pig-414.convex.cloud
- **Status**: ✅ Running 24/7
- **Functions**: 40+ deployed
- **Tables**: All active
- **Availability**: 99.9% uptime

### **Key Benefits**
✅ No manual startup required
✅ Access from any device
✅ Automatic scaling
✅ Production ready
✅ Real-time sync
✅ Offline support

---

## 🎯 Best Practices

### **1. Always Check .env.local**
Before running `npm run dev`, verify:
```bash
cat .env.local
# Should show CONVEX_DEPLOYMENT=groovy-pig-414
```

### **2. Deploy Function Changes**
After modifying any files in `convex/` directory:
```bash
npm run deploy:convex
```

### **3. Monitor Database**
Regularly check dashboard:
```bash
npx convex dashboard
```

### **4. Test Before APK Build**
Always test cloud connection before building:
```bash
npm run dev
# Test app functionality
npm run build
```

---

## 🆘 Getting Help

### **Common Issues**

**Issue**: Database connection errors
**Solution**: 
```bash
# Reset deployment
npx convex deployment select groovy-pig-414
# Restart dev server
npm run dev
```

**Issue**: Functions not found
**Solution**:
```bash
# Redeploy functions
npm run deploy:convex
```

**Issue**: APK can't connect to database
**Solution**:
```bash
# Verify .env.local before build
cat .env.local
# Rebuild APK
npm run build && npx cap sync && npx cap build android
```

---

## 🎉 Summary

✅ **Cloud database is running 24/7**
✅ **Just run `npm run dev` to start development**
✅ **APK automatically connects to cloud database**
✅ **No manual database setup needed**

**Your database is always working!** 🚀