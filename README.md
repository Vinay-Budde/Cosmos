# 🌌 Virtual Cosmos

A real-time multiplayer virtual space where users can move around a 2D pixel-art world and chat with others based on proximity — just like a virtual office.

🚀 Try it live: https://cosmos-gules.vercel.app/ — open in multiple tabs to see real-time multiplayer in action!


✨ Features

🎮 Move your avatar with WASD or Arrow keys
💬 Proximity-based chat — conversations open automatically when you get close to someone and close when you move away
🎨 Customize your avatar with a name and color
🗺️ Explore a pixel-art 2D map rendered with PixiJS
⚡ Real-time communication powered by Socket.IO


🔗 Live Demo
👉 cosmos-gules.vercel.app

No installation needed — just open the link
Open in multiple browser tabs or windows to test multiplayer
Enter a name, pick a color, and start exploring!


🛠️ Tech Stack
LayerTechnologyFrontendReact + Vite + PixiJS + Tailwind CSSBackendNode.js + Express + Socket.IODatabaseMongoDB (Mongoose)

📋 Prerequisites
Before you begin, make sure you have the following installed:

Node.js >= 18
MongoDB running locally or a MongoDB Atlas URI


🚀 Getting Started
1. Clone the Repository
bashgit clone https://github.com/your-username/virtual-cosmos.git
cd virtual-cosmos

💡 Replace the GitHub URL with your actual repository URL.

2. Set Up the Backend
bashcd server
npm install
Create a .env file inside the /server directory:
envPORT=3000
MONGO_URI=mongodb://localhost:27017/virtual-cosmos

💡 Replace MONGO_URI with your MongoDB Atlas connection string if you're not running MongoDB locally.

Start the backend server:
bash# Development (with auto-restart)
npm run dev

# OR Production
node index.js
3. Set Up the Frontend
Open a new terminal window:
bashcd client
npm install
npm run dev
4. Open the App
Navigate to http://localhost:5173 in your browser.

🪟 Open multiple browser windows to simulate multiple users in the same space!


🎮 How to Play

Enter your name and pick a color on the welcome screen
Use WASD or Arrow keys to move your avatar around the map
Walk near another user → a chat window opens automatically
Walk away → the chat window closes automatically


📁 Project Structure
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

🌐 Environment Variables
VariableDefaultDescriptionPORT3000Port the backend server runs onMONGO_URImongodb://localhost:27017/virtual-cosmosMongoDB connection URI

🚢 Deployment
The frontend is deployed on Vercel at cosmos-gules.vercel.app.
To deploy your own instance:
Frontend (Vercel):

Push the /client folder to a GitHub repository
Import the project on vercel.com
Set the root directory to client and deploy

Backend:

Deploy the /server folder to any Node.js host (Railway, Render, Fly.io, etc.)
Set the environment variables (PORT, MONGO_URI) in the host dashboard
Update the Socket.IO server URL in the frontend config to point to your deployed backend


🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

Fork the repository
Create your feature branch: git checkout -b feature/my-feature
Commit your changes: git commit -m 'Add my feature'
Push to the branch: git push origin feature/my-feature
Open a Pull Request


📄 License
This project is licensed under the MIT License.


Built with ❤️ using React, PixiJS, and Socket.IO  |  🌐 Live at cosmos-gules.vercel.app
