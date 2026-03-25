# IgnisStream Mobile App

The official mobile app for IgnisStream - the ultimate gaming social platform where players share moments, connect with teammates, and build communities around their favorite games.

## Features

- 📱 **Cross-Platform**: Built with React Native and Expo for iOS and Android
- 🎮 **Gaming-First Design**: UI optimized for gaming content and community
- 📸 **Capture Moments**: Built-in camera with video recording capabilities
- 🌙 **Dark/Light Mode**: Automatic theme switching based on system preferences
- 🔐 **Secure Authentication**: Supabase integration with secure storage
- 🚀 **Real-time Features**: Live updates for likes, comments, and notifications
- 🎯 **Performance Focused**: Optimized for smooth scrolling and fast loading

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Supabase** for backend and authentication
- **React Navigation** for routing
- **Expo Camera** for media capture
- **Expo Linear Gradient** for beautiful gradients
- **React Context** for state management

## Getting Started

### Prerequisites

- Node.js 16 or later
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/slatesense/ignisstream.git
cd ignisstream/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

Start the Expo development server:
```bash
npm start
```

Then choose your platform:
- Press `i` to run on iOS Simulator
- Press `a` to run on Android Emulator
- Scan the QR code with Expo Go app on your physical device

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── theme/              # Theme configuration
│   │   └── theme.ts
│   └── types/              # TypeScript type definitions
├── assets/                 # Images, icons, fonts
├── App.tsx                # Main app component
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

## Key Features Implementation

### Authentication
- Secure login/signup with Supabase
- Automatic session management
- Secure token storage with Expo SecureStore

### Camera & Media
- Built-in camera with photo/video capture
- Gallery integration for selecting existing media
- Real-time preview and editing capabilities

### Theme System
- Light/Dark/System theme modes
- Dynamic color switching
- Persistent theme preferences

### Navigation
- Bottom tab navigation for main sections
- Stack navigation for detailed views
- Deep linking support

## Building for Production

### iOS

1. Configure your app in `app.json`
2. Build the iOS app:
```bash
expo build:ios
```

### Android

1. Configure your app in `app.json`
2. Build the Android APK:
```bash
expo build:android
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@ignisstream.com or join our Discord community.

---

Built with ❤️ by the IgnisStream team
