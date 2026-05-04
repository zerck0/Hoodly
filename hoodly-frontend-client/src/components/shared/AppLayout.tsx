import { Outlet, NavLink, Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { useUser } from "../../hooks/useUser"
import {
  Home,
  Users,
  Calendar,
  AlertTriangle,
  Map as MapIcon,
  Settings,
  LogOut,
  Search,
  UserIcon,
  LifeBuoy,
} from "lucide-react"
import { Bell } from "../animate-ui/icons/bell"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "../ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

const items = [
  { title: "Accueil", url: "/dashboard", icon: Home },
  { title: "Services", url: "/services", icon: Users },
  { title: "Événements", url: "/events", icon: Calendar },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
  { title: "Carte du quartier", url: "/map", icon: MapIcon },
]

export default function AppLayout() {
  const { logout } = useAuth0()
  const { user } = useUser()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f5f3ed]">
        <Sidebar className="border-r border-gray-200 bg-[#fefefa] flex">
          <SidebarHeader className="p-6">
            <Link to="/">
              <h2 className="text-2xl font-bold text-[#2c308e]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Hoodly
              </h2>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Mon Quartier
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="px-4 gap-2">
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                              isActive
                                ? "bg-[#e9eaf6] text-[#2c308e] font-semibold shadow-sm"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-gray-100 transition-colors text-left outline-none">
                  <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarImage src={user?.picture} alt={user?.name || "Avatar"} />
                    <AvatarFallback className="bg-[#2c308e] text-white">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user?.name || "Habitant"}
                    </p>
                    <p className="truncate text-xs text-gray-500">Voir mon profil</p>
                  </div>
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
                <div className="mb-2 px-2 py-1.5">
                  <p className="text-sm font-bold text-gray-900">{user?.name || "Habitant"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider mt-2">
                  Compte
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2">
                  <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Mon Profil</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
                  Application
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2">
                  <Settings className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg py-2">
                  <LifeBuoy className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Aide & Support</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem
                  className="cursor-pointer text-red-600 rounded-lg py-2 focus:text-red-600 focus:bg-red-50"
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-[#fefefa]/80 px-6 backdrop-blur-md">
            <div className="flex-1 flex justify-center max-w-2xl mx-auto w-full">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un voisin, un service..."
                  className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#2c308e] focus:bg-white focus:ring-1 focus:ring-[#2c308e]/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
                <Bell animateOnHover className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
