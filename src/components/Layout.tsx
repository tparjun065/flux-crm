import { motion } from "framer-motion";
import { NavLink, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  FileText,
  Building2
} from "lucide-react";
import { BRAND_NAME, BRAND_LOGO } from "@/lib/brand";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <motion.div 
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <img 
                  src={BRAND_LOGO} 
                  alt={`${BRAND_NAME} logo`} 
                  className="h-12 w-12 rounded-lg shadow-lg object-cover" 
                />
              </motion.div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary/20 text-primary neon-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <div className="flex items-center space-x-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `p-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}