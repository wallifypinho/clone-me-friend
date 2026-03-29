import { useState } from "react";
import { Link } from "react-router-dom";
import { Tag, ClipboardList, HelpCircle, User, Menu, X } from "lucide-react";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center">
          <img src="/images/logo.png" alt="RotaCerta" className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Tag className="w-4 h-4" />
            Ofertas
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ClipboardList className="w-4 h-4" />
            Pedidos
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="w-4 h-4" />
            Ajuda
          </Link>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors">
            <User className="w-4 h-4" />
            Entrar
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border animate-in slide-in-from-top-2 duration-200">
          <nav className="container flex flex-col py-4 gap-1">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Tag className="w-4 h-4 text-primary" />
              Ofertas
            </Link>
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-primary" />
              Pedidos
            </Link>
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              Ajuda
            </Link>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-accent transition-colors mt-1">
              <User className="w-4 h-4" />
              Entrar
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
