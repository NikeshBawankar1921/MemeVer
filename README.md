# Memeverse

A modern meme creation and sharing platform built with React and Firebase.

## Setup Instructions

1. Clone the repository
```bash
git clone <your-repo-url>
cd memeverse
```

2. Install dependencies
```bash
npm install
```

3. Environment Variables
- Copy `.env.example` to `.env`
```bash
cp .env.example .env
```
- Fill in your environment variables in `.env`:
  - Firebase configuration (from Firebase Console)
  - ImgBB API key (from ImgBB)
  - Other API endpoints if needed

4. Run the development server
```bash
npm run dev
```

## Environment Variables Required

- `VITE_FIREBASE_API_KEY`: Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID`: Firebase App ID
- `VITE_IMGBB_API_KEY`: ImgBB API Key for image uploads

## Deployment

1. Build the project:
```bash
npm run build
```

2. Test the production build locally:
```bash
npm run preview
```

3. Deploy to your preferred hosting platform (Firebase Hosting, Vercel, etc.)

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys and secrets secure
- Use environment variables for all sensitive information
- Follow security best practices for authentication and data storage
