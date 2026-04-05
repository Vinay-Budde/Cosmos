# Virtual Cosmos

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB running locally (default: mongodb://localhost:27017/virtual-cosmos) or MongoDB Atlas URI

### Installation
1. Clone the repo
2. Navigate to server: `cd server` and run `npm install`
3. Navigate to client: `cd ../client` and run `npm install`
4. Create `.env` file in `/server` based on the configuration logic
5. Start backend: `cd server` and run `node index.js` (or `npm run dev`)
6. Start frontend: `cd client` and run `npm run dev`
7. Open `http://localhost:5173` in multiple browser windows.

### How it works
- Enter your name and pick a color.
- Move with WASD or Arrow keys.
- Get close to another user → chat opens automatically.
- Move away → chat closes automatically.

### Tech Stack
- Frontend: React + Vite + PixiJS + Tailwind CSS
- Backend: Node.js + Express + Socket.IO + MongoDB (Mongoose)
