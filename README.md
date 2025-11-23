# Winter Arc App - Complete Implementation ❄️🔥

A personal life-alignment companion that acts as your "big brother" during your Winter Arc journey. Built with React Native, Expo, and AI-powered harsh motivation.

## 🎯 Features Implemented

### ✅ Core Features (Fully Working)
- **Onboarding Flow**: 8+ step journey to collect user's story, setbacks, dreams, inspirations
- **Daily Check-ins**: Reflection questions, mood tracking, accomplishments, struggles, tomorrow's plan
- **Streak System**: Photo upload tracking with camera/gallery access
- **Goals Management**: CRUD operations, progress tracking, deadline management
- **Story/Journey Timeline**: View your Winter Arc progress and history
- **Settings & Profile**: Edit preferences, motivation style, reset data
- **AI Backend**: TypeScript/Node.js/Express with Google Gemini AI for harsh reminders
- **Minimalistic UI**: Black/white theme, clean design

### ✅ Data Persistence
- **AsyncStorage**: All data persists locally (onboarding, profile, goals, check-ins, streaks, activities)
- **Offline-first**: App works completely offline except AI features

### ⚠️ Push Notifications (Requires Development Build)
- **Status**: Implemented but requires development build (doesn't work in Expo Go)
- **Features**: Daily check-in reminders, harsh AI reminders, goal deadlines, streak reminders
- **See**: `NOTIFICATIONS_SETUP.md` for build instructions

### 🚧 Optional/Future Features
- **Screen Time Monitoring**: Native APIs integration
- **Analytics Dashboard**: Charts and graphs for progress visualization

## 📱 Running the App

### Current Setup (Expo Go)
```bash
cd apps/mobile
npx expo start
```

**Note**: All features work except push notifications. Scan QR code with Expo Go.

### For Push Notifications (Development Build)
See `NOTIFICATIONS_SETUP.md` for complete instructions.

Quick start:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android (recommended for testing)
eas build --profile development --platform android

# After build completes, install APK and run:
npx expo start --dev-client
```

## 🤖 AI Backend

Located in `/ai-backend` directory.

### Running Locally
```bash
cd ai-backend
npm install
npm run dev
```

Server runs on `http://localhost:3000`

### API Endpoints
- `POST /api/generate-reminder`: Generate harsh motivational reminder
- `POST /api/generate-checkin-prompt`: Generate daily check-in questions

### Deployment
Ready to deploy to:
- Vercel
- Railway
- Render
- Any Node.js hosting

Set environment variable:
```
GEMINI_API_KEY=your_google_gemini_api_key
```

## 🏗️ Architecture

```
apps/mobile/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── index.jsx          # Entry point
│   │   ├── onboarding.jsx     # 8-step onboarding
│   │   ├── checkin.jsx        # Daily check-in
│   │   ├── (tabs)/            # Tab navigation
│   │   │   ├── home.jsx       # Dashboard
│   │   │   ├── goals.jsx      # Goals management
│   │   │   ├── story.jsx      # Journey timeline
│   │   │   ├── analytics.jsx  # Analytics (TODO)
│   │   │   └── settings.jsx   # Settings
│   ├── components/            # Reusable components
│   └── utils/
│       ├── storage.js         # AsyncStorage utilities
│       ├── notifications.js   # Push notifications
│       ├── ai.ts             # AI backend client
│       ├── theme.js          # Theme system
│       └── auth/             # Auth utilities

ai-backend/
├── src/
│   ├── server.ts             # Express server
│   ├── gemini.service.ts     # AI integration
│   └── types.ts              # TypeScript types
└── package.json
```

## 📦 Tech Stack

### Frontend
- **Framework**: React Native + Expo SDK 54
- **Router**: expo-router v6
- **State**: @tanstack/react-query
- **Storage**: AsyncStorage
- **UI**: Custom minimalistic theme
- **Icons**: lucide-react-native
- **Fonts**: Inter family

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **AI**: Google Gemini AI
- **HTTP Client**: Axios

## 🎨 Design Philosophy

- **Minimalistic**: Black/white color scheme, clean interface
- **Accountability**: Harsh motivation when needed, based on user's story
- **Privacy-first**: All data stored locally, AI backend optional
- **Offline-capable**: Works without internet (except AI features)

## 🔐 Data Stored Locally

- User profile (name, story, setbacks, dreams)
- Inspiration sources (movies, books, role models)
- Distraction apps and screen time limits
- Goals with progress tracking
- Daily check-ins with timestamps
- Streak data with photos
- Recent activities log

## 🚀 Next Steps

1. **Test Current Build**: All features except notifications work in Expo Go
2. **Create Development Build**: Follow `NOTIFICATIONS_SETUP.md` for full functionality
3. **Deploy AI Backend**: Deploy to Vercel/Railway for production
4. **Optional Enhancements**:
   - Implement screen time monitoring
   - Build analytics dashboard with charts
   - Add social accountability features

## 📝 Environment Variables

Create `.env` in `apps/mobile`:
```
# For local development (if running backend locally):
EXPO_PUBLIC_AI_BACKEND_URL=http://localhost:3000

# For production (using deployed Railway backend):
EXPO_PUBLIC_AI_BACKEND_URL=https://winarcbe-production.up.railway.app
```

**Note**: The app works offline with fallback quotes. AI features are optional.

## 🐛 Known Issues

1. **Notifications Error in Expo Go**: Expected - requires development build
2. **Package Version Warnings**: Safe to ignore, app works correctly
3. **Missing notification-icon.png**: Optional, app works without it

## 📖 Documentation

- `NOTIFICATIONS_SETUP.md`: Complete guide for push notifications setup
- `README.md`: This file - project overview
- Code comments: Extensive inline documentation

## 🎯 Winter Arc Philosophy

This app embodies the Winter Arc mentality:
- **Brutal honesty**: AI tells you what you need to hear, not what you want to hear
- **Daily accountability**: Check-ins force reflection
- **Visual progress**: Streak photos keep you committed
- **Goal-focused**: Clear targets with deadlines
- **No excuses**: The app knows your story and uses it to motivate

## 💪 Final Notes

The app is **fully functional** for daily use in Expo Go. All core features work:
- Complete onboarding and store your story
- Set goals and track progress
- Do daily check-ins
- Upload streak photos
- View your journey timeline
- Adjust settings and preferences

Push notifications are the only feature requiring a development build. The app will log when notifications would be sent, so you can test the logic even in Expo Go.

**Ready to start your Winter Arc? Let's go! 🔥**
