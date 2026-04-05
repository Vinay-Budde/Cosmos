import { Users } from 'lucide-react';

export default function UserList({ users }) {
  return (
    <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
      <div className="bg-cosmos-800/80 backdrop-blur border border-slate-700 rounded-full px-5 py-2 flex items-center gap-3 shadow-lg">
        <Users className="w-5 h-5 text-indigo-400" />
        <span className="text-white font-medium">Cosmos Online : {users.length + 1}</span>
      </div>
      
      <div className="bg-cosmos-800/80 backdrop-blur border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg hidden md:flex">
        <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">Controls: WASD / Arrows</span>
      </div>
    </div>
  );
}
