import React from 'react';
import { Target, Plus, Minus, HelpCircle } from 'lucide-react';

export default function ZoomWidget() {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-[200]">
      <div className="flex flex-col bg-white rounded-full shadow-lg border border-slate-100 overflow-hidden">
        <button className="p-3 hover:bg-slate-50 transition-colors text-slate-600 border-b border-slate-100">
           <Target className="w-[18px] h-[18px]" />
        </button>
        <button className="p-3 hover:bg-slate-50 transition-colors text-slate-600">
           <Plus className="w-[18px] h-[18px]" />
        </button>
        <div className="py-1 flex items-center justify-center bg-white text-slate-500 font-semibold text-[11px] border-y border-slate-100">
           77%
        </div>
        <button className="p-3 hover:bg-slate-50 transition-colors text-slate-600">
           <Minus className="w-[18px] h-[18px]" />
        </button>
      </div>
      
      <button className="p-3 bg-white rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors text-slate-600">
         <HelpCircle className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}
