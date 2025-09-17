#!/bin/bash

# 🚀 Quick Deployment Script for Notes Application
# This script helps you deploy your application quickly

echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote repository is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote repository found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/yourrepo.git"
    exit 1
fi

echo "✅ Git repository found"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

echo "✅ Code pushed to GitHub"

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Deploy Backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Create new project from GitHub repo"
echo "   - Set root directory to 'backend'"
echo "   - Add environment variables:"
echo "     MONGO_URI=mongodb+srv://..."
echo "     JWT_SECRET=your-secret-key"
echo "     OPENSEARCH_URL=your-opensearch-url"
echo "     CORS_ORIGIN=your-frontend-url"
echo ""
echo "2. Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Set root directory to 'notes-frontend'"
echo "   - Add environment variable:"
echo "     VITE_API_URL=https://your-railway-backend-url"
echo ""
echo "3. Set up MongoDB Atlas:"
echo "   - Go to https://mongodb.com/atlas"
echo "   - Create free cluster"
echo "   - Get connection string"
echo "   - Add to Railway environment variables"
echo ""
echo "🎉 Your application will be live once deployment is complete!"
