# IgnisStream

🎮 **Social Media Platform for Gamers**

IgnisStream is a comprehensive gaming social platform that combines social media with gaming culture. Connect with fellow gamers, share your gaming moments, and discover new gaming communities.

## 🚀 Features

- **Social Media for Gamers**: Share videos, photos, and text posts focused on gaming content
- **Smart Matchmaking**: Find teammates who match your skill, style, and schedule
- **AI Gaming Assistant (Ignis)**: Get gaming tips, strategies, and insights
- **Achievement System**: Earn Ignis Points through platform engagement
- **Real-time Features**: Live updates, notifications, and interactions
- **Multi-Platform Gaming Support**: Connect your Steam, Xbox, PlayStation accounts

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with custom gaming theme
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Video Processing**: Mux for video upload and streaming
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand

## 🏗 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── achievements/       # Achievements system
│   ├── matchmaking/       # Smart matchmaking features
│   └── globals.css        # Global styles and theme
├── components/            # Reusable React components
│   ├── ai/               # AI Gaming Assistant
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and configurations
├── types/                # TypeScript type definitions
└── supabase/            # Database migrations and types
```

## 🎯 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/slatesense/ignisstream.git
   cd ignisstream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Supabase and other API keys
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🌟 Key Pages

- **Landing Page**: Welcome to IgnisStream with feature highlights
- **Matchmaking**: Smart teammate finding system
- **Achievements**: Gaming progress tracking
- **AI Assistant**: Chat with Ignis for gaming help

## 🔧 Recent Updates

- ✅ Fixed matchmaking session handling
- ✅ Enhanced AI gaming assistant
- ✅ Updated branding to IgnisStream
- ✅ Improved error handling and user experience

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for the gaming community**
