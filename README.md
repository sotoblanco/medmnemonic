# 🧠 MediMnemonic AI - Medical Visual Learning Assistant

MediMnemonic is an AI-powered platform designed to transform dense medical facts into unforgettable mnemonic stories and custom visual illustrations. It uses Spaced Repetition (SRS) to help medical students and professionals retain high-yield information.

---

## 🚀 Deployment: Pure Serverless on Modal

This application is deployed on **[Modal](https://modal.com)**, utilizing its state-of-the-art AI infrastructure. Following Modal's philosophy, all infrastructure is defined in **pure Python**—no YAML files required.

### **Key Infrastructure Features**
- **Serverless FastAPI**: The backend scales automatically and supports cold starts in seconds.
- **Persistent Storage (Volumes)**: Using `modal.Volume`, the SQLite database is persisted independently of the containers. Even during redeployments, your users and stories remain safe.
- **Automatic Frontend Serving**: The React (Vite) app is built locally and bundled into the Modal image, allowing the entire application to run under a single Modal URL.

---

## 🛠 Deployment & Workflow

### **1. Prerequisites**
- Python 3.10+ and `uv` package manager.
- Node.js & npm (for frontend builds).
- A Modal account (`modal setup`).

### **2. The Deployment Flow**
To update the application, run the following sequence:

```bash
# 1. Build the React Frontend
cd frontend
npm run build
cp -r dist/* ../backend/app/static/

# 2. Deploy to Modal
cd ../backend
uv run modal deploy modal_app.py
```

---

## 📊 Database Management

The database is managed as a Modal Volume named `medmnemonic-data`.

### **Uploading Local Data**
If you have a local `medmnemonic.db` that you want to move to your live production environment:
```bash
cd backend
uv run modal volume put medmnemonic-data medmnemonic.db /medmnemonic.db
```

### **Querying Remote Data**
You can inspect your live database without downloading it by entering the Modal Shell:

1. **Enter the Shell**:
   ```bash
   uv run modal shell modal_app.py
   ```
2. **Run a Quick Python Query**:
   ```bash
   python3 -c "import sqlite3; conn = sqlite3.connect('/data/medmnemonic.db'); print(conn.execute('SELECT username, email FROM users').fetchall())"
   ```

### **Downloading for Inspection**
```bash
uv run modal volume get medmnemonic-data medmnemonic.db remote_backup.db
```

---

## 🔌 API & Querying Data

The application provides a RESTful API. You can "ping" your live instance to fetch information or verify connectivity.

### **Base URL**
`https://sotoblanco263542--medmnemonic-fastapi-app.modal.run`

### **Useful Endpoints**
- **Public**: `GET /` (Serves the Web UI)
- **Auth**: `POST /api/auth/register` | `POST /api/auth/token`
- **Stories**: `GET /api/stories` (Requires JWT Bearer token)

### **Example: Fetching Stories via curl**
```bash
curl -X GET "https://sotoblanco263542--medmnemonic-fastapi-app.modal.run/api/stories" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ✨ Implemented Fixes & Features

- ✅ **Multi-User Isolation**: Each user can only see and delete their own stories.
- ✅ **Duplicate Prevention**: The frontend identifies if a story is already saved and prevents redundant database entries.
- ✅ **Graceful Error Handling**: Fixed a server crash (500) during signup when an email already existed; it now returns a clean 400 error.
- ✅ **Robust Deletion**: Resolved an issue where story deletion was intermittent by correctly managing asynchronous database sessions.
- ✅ **No YAML**: The entire deployment stack is managed via `backend/modal_app.py`.

---

## 🔒 Security
- **Secrets**: API keys (like `GEMINI_API_KEY`) are managed via `modal.Secret` and loaded from your local `.env` file during deployment, ensuring they are never committed to version control.
- **Passwords**: Hashed using `bcrypt` before storage.
