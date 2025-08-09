# BYND

Voice-first productivity assistant with emotional clarity. A monorepo containing backend (Node/Express/TypeScript) and React Native (Expo) mobile app.

## Features

- **Voice Commands**: Natural language task creation and management
- **Smart AI**: Interprets voice commands and provides motivational responses
- **Task Management**: Create, complete, and organize tasks with due dates
- **Calendar Integration**: Schedule events and view upcoming meetings
- **Payment Tracking**: Detect and track upcoming payments
- **Cross-Platform**: React Native mobile app with responsive design
- **Secure Authentication**: JWT-based auth with refresh token rotation

## Backend

### Quick Start
```
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Environment Setup

Required environment variables (see `backend/.env.example`):
- `JWT_SECRET`: Strong secret for JWT signing
- `OPENAI_API_KEY`: OpenAI API key (or "dummy" for development)
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: For database (optional, uses in-memory fallback)

### API Endpoints

**Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user

**Tasks**
- `GET /tasks` - List tasks (supports pagination and filtering)
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

**AI & Voice**
- `POST /ai/interpret` - Convert voice utterance to tasks
- `POST /ai/future-self` - Get motivational AI response
- `POST /voice/transcribe` - Transcribe audio to text

**Calendar**
- `GET /calendar/events` - List calendar events
- `POST /calendar/schedule` - Create calendar event

**Health**
- `GET /health` - Health check endpoint

## Mobile App

### Quick Start
```
cd mobile
npm install
npm start
```

### Features
- **Voice Recording**: Tap and hold microphone for voice commands
- **Task Management**: View and complete tasks with swipe gestures
- **Calendar View**: Monthly calendar with agenda view
- **Theme Support**: Light and dark mode with system preference detection
- **Offline Support**: Basic offline functionality with sync on reconnect

### Development

The mobile app uses Expo for development. Key commands:
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator

## Architecture

### Backend Architecture
- **Express.js** with TypeScript for type safety
- **JWT Authentication** with refresh token rotation
- **Supabase** for database (with in-memory fallback)
- **OpenAI Integration** for AI features (with dummy fallback)
- **Modular Services** for business logic separation

### Mobile Architecture
- **React Native** with Expo for cross-platform development
- **Axios** for API communication with automatic token refresh
- **AsyncStorage** for local data persistence
- **Expo Audio** for voice recording capabilities

## Security Features

- Password complexity requirements
- Rate limiting on all endpoints
- JWT with short expiration and refresh token rotation
- Refresh token family invalidation on reuse detection
- CORS and security headers via Helmet
- Input validation with Zod schemas

## Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   npm run dev    # Start with hot reload
   npm run test   # Run tests
   npm run lint   # Check code style
   ```

2. **Mobile Development**
   ```bash
   cd mobile
   npm start      # Start Expo dev server
   ```

3. **Testing**
   - Backend: Jest with supertest for API testing
   - Mobile: Manual testing with Expo Go app

## Deployment

### Backend Deployment
```bash
npm run build
npm start
```

### Mobile Deployment
- **Development**: Use Expo Go app
- **Production**: Build with `expo build` or EAS Build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and tests
6. Submit a pull request

## MVP Status

✅ **Core Features Complete**
- User authentication with secure token management
- Task creation and management
- Voice command interpretation
- Calendar event scheduling
- Mobile app with voice recording
- AI-powered task creation from natural language

✅ **Security & Reliability**
- Input validation and sanitization
- Rate limiting and security headers
- Error handling and user feedback
- Offline support and sync

✅ **User Experience**
- Intuitive mobile interface
- Voice-first interaction model
- Real-time feedback and animations
- Theme support (light/dark)

## License

MIT License - see LICENSE file for details.
