import * as React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Compass,
  Kanban,
  Plus,
  Search,
  User as UserIcon,
  Menu as MenuIcon,
  X,
  Layers,
  Sparkles,
  Shield,
  LogIn,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  MenuRoot,
  MenuTrigger,
  MenuPortal,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuGroup,
  MenuGroupLabel,
} from "@/components/ui/menu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";
import { CreatePostDialog } from "@/features/posts";

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [createPostOpen, setCreatePostOpen] = React.useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = React.useState(searchParams.get("q") || "");

  // Sync search input if query param changes
  React.useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Feature Requests", icon: Compass },
    { to: "/roadmap", label: "Public Roadmap", icon: Kanban },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
              aria-label="ShipYard Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold leading-none tracking-tight">ShipYard</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Product Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px]",
                        isActive
                          ? "bg-accent text-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )
                    }
                  >
                    <Icon className="h-4 w-4 opacity-70" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requests, ideas, features..."
                className="pl-9 h-10 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border-border/80 transition-colors"
                aria-label="Search feature requests"
              />
            </div>
          </form>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* New Request Button */}
            <Tooltip content="Submit a new feature request or idea">
              <Button
                size="sm"
                variant="primary"
                className="hidden sm:inline-flex gap-1.5 font-medium shadow-sm shadow-primary/25 min-h-[40px] px-3.5"
                onClick={() => setCreatePostOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>New Request</span>
              </Button>
            </Tooltip>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Account Menu */}
            <MenuRoot>
              <MenuTrigger
                render={(props: React.ComponentPropsWithoutRef<"button">) => (
                  <Button
                    {...props}
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-border/60 bg-muted/40 hover:bg-accent min-h-[40px] min-w-[40px]"
                    aria-label="User profile menu"
                  >
                    {isAuthenticated && user ? (
                      <span className="text-xs font-bold uppercase text-primary">
                        {user.name.slice(0, 2)}
                      </span>
                    ) : (
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
              />
              <MenuPortal>
                <MenuPositioner sideOffset={6} side="bottom">
                  <MenuPopup className="w-56">
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-2 py-1.5 border-b border-border/60">
                          <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                              {user.role}
                            </span>
                            {user.isEmailVerified && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <MenuItem
                            className="gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 min-h-[36px]"
                            onClick={() => navigate("/admin")}
                          >
                            <Shield className="h-3.5 w-3.5" />
                            <span>Admin Portal</span>
                          </MenuItem>
                        )}
                        <MenuSeparator />
                        <MenuItem
                          className="gap-2 text-xs text-destructive hover:text-destructive min-h-[36px]"
                          onClick={() => logout()}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sign Out</span>
                        </MenuItem>
                      </>
                    ) : (
                      <MenuGroup>
                        <MenuGroupLabel>Account &amp; Session</MenuGroupLabel>
                        <MenuItem
                          className="gap-2 text-xs min-h-[36px]"
                          onClick={() => navigate("/login")}
                        >
                          <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Log In</span>
                        </MenuItem>
                        <MenuItem
                          className="gap-2 text-xs min-h-[36px]"
                          onClick={() => navigate("/signup")}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>Create Account</span>
                        </MenuItem>
                      </MenuGroup>
                    )}
                  </MenuPopup>
                </MenuPositioner>
              </MenuPortal>
            </MenuRoot>

            {/* Mobile Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-[40px] min-w-[40px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search requests..."
                  className="pl-9 h-10 text-xs bg-muted/40"
                  aria-label="Search requests"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[40px]",
                        isActive
                          ? "bg-accent text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 rounded-lg hover:bg-accent/50 min-h-[40px]"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Portal</span>
                </NavLink>
              )}
            </div>
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center gap-1.5 min-h-[40px]"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCreatePostOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span>New Request</span>
              </Button>
              {!isAuthenticated && (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full justify-center text-xs min-h-[40px]">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full justify-center text-xs min-h-[40px]">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* App Footer */}
      <footer className="border-t border-border/80 bg-card/30 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ShipYard Portal &bull; Live Roadmap &amp; Feedback</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors min-h-[32px] inline-flex items-center">
              Feed
            </Link>
            <Link to="/roadmap" className="hover:text-foreground transition-colors min-h-[32px] inline-flex items-center">
              Roadmap
            </Link>
            <Link to="/admin" className="hover:text-foreground transition-colors min-h-[32px] inline-flex items-center">
              Admin
            </Link>
            <span className="text-border">|</span>
            <span>MERN Stack</span>
          </div>
        </div>
      </footer>

      {/* Global Create Post Dialog */}
      <CreatePostDialog open={createPostOpen} onOpenChange={setCreatePostOpen} />
    </div>
  );
};
