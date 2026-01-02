---
description: Deploy the full stack application to Modal
---

1. Build the frontend application
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

2. Clean and prepare backend static directory
   ```bash
   rm -rf backend/app/static/*
   mkdir -p backend/app/static/assets
   ```

3. Copy frontend build to backend static directory
   ```bash
   cp -r frontend/dist/* backend/app/static/
   ```

4. Deploy to Modal
   ```bash
   cd backend
   modal deploy modal_app.py
   ```
