# 🤖 AI Chat Application

A modern, responsive chat interface powered by Google's Gemini AI. This application provides a seamless chat experience with a clean UI and real-time AI responses.

![AI Chat Preview](./client/assets/preview.png)

## 🚀 Features

- 💬 Real-time AI-powered chat interface
- ✨ Modern and responsive design
- 🛠️ Built with Vite for fast development
- 🔄 Asynchronous API calls with abort controller
- 🎨 Clean and intuitive user interface
- 🔒 Secure API key management with environment variables

## 🛠️ Tech Stack

### Frontend
- ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
- ![Marked](https://img.shields.io/badge/Marked.js-000000?style=flat&logo=markdown&logoColor=white)
- ![DOMPurify](https://img.shields.io/badge/DOMPurify-000000?style=flat)

### Backend
- ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
- ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
- ![Google Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)
- ![CORS](https://img.shields.io/badge/CORS-000000?style=flat)
- ![dotenv](https://img.shields.io/badge/dotenv-000000?style=flat)

## 📦 Prerequisites

- Node.js (v14+)
- npm or yarn
- Google Gemini API key

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat.git
   cd ai-chat
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   Create a `.env` file in the root directory with your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

5. **Start the development servers**
   In separate terminal windows:
   ```bash
   # Start backend server
   cd server
   npm run server
   
   # Start frontend development server
   cd ../client
   npm run dev
   ```

6. **Open the application**
   Visit `http://localhost:5173` in your browser

## 🧪 Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Server
- `npm run server` - Start the backend server with nodemon

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

Daniel Gidey - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/ai-chat](https://github.com/yourusername/ai-chat)

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [Shields.io](https://shields.io/) for badges
