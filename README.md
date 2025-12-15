# Hotel Ortus - Authentication Backend

A production-ready user authentication system for the Hotel Ortus website.

## Quick Start

### 1. Prerequisites

- Node.js (v16 or later) - [Download](https://nodejs.org/)
- MongoDB Atlas account (free) - [Sign up](https://www.mongodb.com/atlas)

### 2. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign up/login
2. Create a new **FREE** cluster (M0 tier)
3. In "Database Access", create a new user with password
4. In "Network Access", add your IP address (or `0.0.0.0/0` for all IPs)
5. Click "Connect" → "Connect your application"
6. Copy the connection string

### 3. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update these values:
MONGODB_URI=your-connection-string-from-step-2
JWT_SECRET=generate-a-random-secret-key
```

> **Tip**: Generate a secure JWT secret at [randomkeygen.com](https://randomkeygen.com/)

### 4. Install & Run

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Visit `http://localhost:3000` - Your website is now running with authentication!

---

## Features

✅ User Registration (Sign Up)  
✅ User Login (Sign In)  
✅ Session Persistence (Stay logged in)  
✅ Secure Password Hashing (bcrypt)  
✅ JWT Token Authentication  
✅ Input Validation

---

## API Endpoints

| Endpoint           | Method | Description        |
| ------------------ | ------ | ------------------ |
| `/api/auth/signup` | POST   | Register new user  |
| `/api/auth/login`  | POST   | Login user         |
| `/api/auth/logout` | POST   | Logout user        |
| `/api/auth/me`     | GET    | Get current user   |
| `/api/auth/check`  | GET    | Check login status |

---

## Deployment (Render.com)

1. Push your code to GitHub
2. Go to [Render.com](https://render.com) and create account
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Add environment variables (from your `.env` file)
8. Deploy!

---

## Security Notes

- ⚠️ **Never commit `.env` file** (it's in `.gitignore`)
- ⚠️ **Use HTTPS in production**
- ⚠️ **Change JWT_SECRET before deployment**

---

## Support

For any issues, contact the development team.
