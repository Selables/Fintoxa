import {
  LayoutDashboard,
  PlusCircle,
  FileBarChart,
  Tag,
  Settings,
  ShieldCheck,
  HandCoins,
  BookHeart,
  Sparkles,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { publicAsset } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Add Expense', url: '/add', icon: PlusCircle },
  { title: 'My Wallet', url: '/funds', icon: HandCoins },
  { title: 'Reports', url: '/reports', icon: FileBarChart },
  { title: 'Categories', url: '/categories', icon: Tag },
  { title: 'Diary', url: '/diary', icon: BookHeart },
];

export function AppSidebar() {
  const { isAdmin, user } = useAuth();
  const isActuallyAdmin = isAdmin || user?.username.toLowerCase() === 'admin';
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const year = new Date().getFullYear();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={publicAsset('logo.png')} alt="Fintoxa logo" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
          {!collapsed && (
            <span className="text-lg font-heading font-bold text-sidebar-accent-foreground">
              Fintoxa
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">
            {!collapsed && 'Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isActuallyAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="space-y-3">
            <NavLink
              to="/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </NavLink>

            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2">
              <p className="text-sm font-medium text-sidebar-accent-foreground">{user?.displayName || user?.username}</p>
              <p className="text-xs text-sidebar-muted capitalize">{user?.role}</p>
            </div>

            <p className="text-xs text-sidebar-muted flex items-center gap-1">
              © {year} Fintoxa <Sparkles className="w-3 h-3" /> Thanks SparkOn
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
