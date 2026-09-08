import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { LogOut, Moon, Sun, User } from "lucide-react";

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 justify-between">
      <div className="flex flex-1 items-center gap-4 md:hidden">
        {/* Mobile menu toggle would go here */}
        <span className="font-semibold text-primary">SupplySentry AI</span>
      </div>
      
      <div className="hidden md:flex flex-1" />
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title="Toggle Theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium hidden md:block">
            {user?.full_name || user?.username || "User"}
          </span>
        </div>

        <Button variant="ghost" size="icon" onClick={logout} title="Log out">
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  );
}
