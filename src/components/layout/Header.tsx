import { Bell, Search, Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 transition-all duration-300">
      <div className="h-full px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden md:flex items-center relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-xl bg-slate-50 border-none w-64 text-sm focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-primary-600 transition-all duration-300 group">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform" />
          </button>

          <div className="h-8 w-[1px] bg-slate-200 mx-2" />

          <button className="flex items-center gap-3 p-1.5 pl-2 pr-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold border border-gold-300/50 shadow-sm group-hover:shadow group-hover:scale-105 transition-all">
              JD
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-700 group-hover:text-gold-700 transition-colors">John Doe</p>
              <p className="text-xs text-slate-400 font-medium">Senior Portfolio Manager</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
