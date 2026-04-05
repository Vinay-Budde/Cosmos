# 🌌 Virtual Cosmos

A real-time multiplayer virtual space where users can move around a 2D pixel-art world and chat with others based on proximity — just like a virtual office.

---

## ✨ Features

- 🎮 Move your avatar with **WASD** or **Arrow keys**
- 💬 **Proximity-based chat** — conversations open automatically when you get close to someone and close when you move away
- 🎨 Customize your avatar with a **name and color**
- 🗺️ Explore a **pixel-art 2D map** rendered with PixiJS
- ⚡ Real-time communication powered by **Socket.IO**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + PixiJS + Tailwind CSS |
| Backend | Node.js + Express + Socket.IO |
| Database | MongoDB (Mongoose) |

---

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) `>= 18`
- [MongoDB](https://www.mongodb.com/) running locally **or** a MongoDB Atlas URI

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/virtual-cosmos.git
cd virtual-cosmos
```

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `/server` directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/virtual-cosmos
```

> 💡 Replace `MONGO_URI` with your MongoDB Atlas connection string if you're not running MongoDB locally.

Start the backend server:

```bash
# Development (with auto-restart)
npm run dev

# OR Production
node index.js
```

### 3. Set Up the Frontend

Open a new terminal window:

```bash
cd client
npm install
npm run dev
```

### 4. Open the App

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

> 🪟 Open **multiple browser windows** to simulate multiple users in the same space!

---

## 🎮 How to Play

1. **Enter your name** and **pick a color** on the welcome screen
2. Use **WASD** or **Arrow keys** to move your avatar around the map
3. **Walk near another user** → a chat window opens automatically
4. **Walk away** → the chat window closes automatically

---

## 📁 Project Structure

```
virtual-cosmos/
├── client/               # Frontend (React + Vite + PixiJS)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── game/         # PixiJS game logic & map
│   │   └── main.jsx      # App entry point
│   └── package.json
│
└── server/               # Backend (Node.js + Express + Socket.IO)
    ├── index.js          # Server entry point
    ├── .env              # Environment variables (create this)
    └── package.json
```

---

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Port the backend server runs on |
| `MONGO_URI` | `mongodb://localhost:27017/virtual-cosmos` | MongoDB connection URI |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Built with ❤️ using React, PixiJS, and Socket.IO
