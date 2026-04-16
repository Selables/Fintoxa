import { useAuth } from '@/context/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Search, Settings, ChevronDown } from 'lucide-react';
import { getTheme, setTheme as setStoredTheme } from '@/lib/storage';
import { useState, useEffect } from 'react';

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3">
      <SidebarTrigger className="text-muted-foreground" />

      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search expenses..." className="pl-9 h-9 bg-muted border-0" />
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gold hover:text-gold hover:bg-gold/10">
        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 pl-2 border-l border-border rounded-md px-2 py-1 hover:bg-muted transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center text-white text-sm font-bold border border-white/10 overflow-hidden shadow-sm">
              <img src="/logo.png" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{user?.displayName || user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div>
              <p className="font-medium">{user?.displayName || user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
