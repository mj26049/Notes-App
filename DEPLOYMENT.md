# 🚀 Deployment Guide for Notes Application

## **Option 1: Railway Deployment (Recommended)**

### **Step 1: Prepare Your Repository**
1. Push your code to GitHub
2. Make sure all files are committed

### **Step 2: Deploy Backend to Railway**
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set the root directory to `backend`
6. Add environment variables:
   ```
   MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/knowledgeDB
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   OPENSEARCH_URL=https://your-opensearch-url
   CORS_ORIGIN=https://your-frontend-url
   NODE_ENV=production
   PORT=5002
   ```

### **Step 3: Deploy Frontend to Vercel**
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the root directory to `notes-frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend-url
   ```

## **Option 2: Render Deployment**

### **Backend Deployment**
1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Set build command: `cd backend && npm install`
5. Set start command: `cd backend && npm start`
6. Add environment variables (same as Railway)

### **Frontend Deployment**
1. Create new Static Site
2. Set build command: `cd notes-frontend && npm run build`
3. Set publish directory: `notes-frontend/dist`

## **Option 3: Docker Deployment**

### **Local Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up --build

# Or run individual services
docker build -t notes-backend ./backend
docker run -p 5002:5002 --env-file .env notes-backend
```

### **Cloud Docker Deployment**
1. **DigitalOcean App Platform**
2. **Google Cloud Run**
3. **AWS ECS**

## **Environment Variables Setup**

### **Required Variables:**
```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/knowledgeDB

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenSearch (if using external service)
OPENSEARCH_URL=https://your-opensearch-url

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Environment
NODE_ENV=production
PORT=5002
```

### **Frontend Variables:**
```bash
VITE_API_URL=https://your-backend-url.com
```

## **Database Setup**

### **MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Add to environment variables

### **OpenSearch Options**
1. **Self-hosted** (using Docker)
2. **OpenSearch Service** (AWS)
3. **Elastic Cloud** (Elasticsearch)

## **Domain & SSL Setup**

### **Custom Domain**
1. Add custom domain in your hosting platform
2. Configure DNS records
3. Enable SSL/HTTPS

### **SSL Certificate**
- Railway: Automatic SSL
- Vercel: Automatic SSL
- Render: Automatic SSL

## **Monitoring & Analytics**

### **Health Checks**
- Backend: `GET /api`
- Frontend: `GET /`

### **Logs**
- Railway: Built-in logging
- Vercel: Built-in logging
- Render: Built-in logging

## **Troubleshooting**

### **Common Issues:**
1. **CORS Errors**: Check CORS_ORIGIN environment variable
2. **Database Connection**: Verify MONGO_URI format
3. **OpenSearch Connection**: Check OPENSEARCH_URL
4. **Build Failures**: Check Node.js version compatibility

### **Debug Commands:**
```bash
# Check backend logs
railway logs

# Check frontend build
npm run build

# Test API endpoints
curl https://your-backend-url.com/api
```

## **Performance Optimization**

### **Backend Optimization**
- Enable compression
- Implement caching
- Optimize database queries
- Use CDN for static assets

### **Frontend Optimization**
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

## **Security Checklist**

- [ ] Environment variables are set
- [ ] JWT_SECRET is strong and unique
- [ ] CORS is properly configured
- [ ] HTTPS is enabled
- [ ] Database access is restricted
- [ ] Input validation is implemented
- [ ] Rate limiting is configured

## **Backup Strategy**

### **Database Backup**
- MongoDB Atlas: Automatic backups
- Manual backups: `mongodump`

### **Code Backup**
- GitHub repository
- Regular commits
- Release tags

---

**🎉 Your application is now ready for deployment!**
