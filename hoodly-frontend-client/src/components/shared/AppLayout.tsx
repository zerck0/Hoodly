import { Outlet, NavLink, Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { useUser } from "../../hooks/useUser"
import { ZoneMembershipStatus } from "../../types/status.enum"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
  Home,
  Users,
  Calendar,
  AlertTriangle,
  Settings,
  LogOut,
  Search,
  UserIcon,
  LifeBuoy,
  MessageSquare,
  Coins,
  PartyPopper,
  FileText,
  Vote,
  Shield,
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

export default function AppLayout() {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth0()
  const { user } = useUser()
  const isVerified = user?.zoneStatut === ZoneMembershipStatus.ACTIVE


  const menuItems = [
    { title: t("sidebar.dashboard"), url: "/dashboard", icon: Home },
    { title: t("sidebar.services"), url: "/services", icon: Users },
    { title: t("sidebar.events"), url: "/evenements", icon: PartyPopper },
    { title: t("sidebar.messages"), url: "/messages", icon: MessageSquare },
    { title: t("sidebar.votes"), url: "/votes", icon: Vote },
    { title: t("sidebar.incidents"), url: "/incidents", icon: AlertTriangle },
  ]

  if (user?.role === 'admin') {
    menuItems.push({ title: t("sidebar.adminCandidatures"), url: "/admin/candidatures", icon: Shield })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f5f3ed] dark:bg-gray-950">
        <Sidebar className="border-r border-gray-200 dark:border-gray-800 bg-[#fefefa] dark:bg-gray-900 flex">
          <SidebarHeader className="p-6">
            <Link to="/dashboard">
              <h2 className="text-2xl font-bold text-[#2c308e] dark:text-indigo-400" style={{ fontFamily: "'Playfair Display', serif" }}>
                Hoodly
              </h2>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t("sidebar.myQuarter")}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="px-4 gap-2">
                  {(() => {
                    return menuItems.map((item) => {
                      const isRestricted = !isVerified && item.url !== "/dashboard" && item.url !== "/admin/candidatures"

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <NavLink
                              to={isRestricted ? "#" : item.url}
                              onClick={(e) => {
                                if (isRestricted) {
                                  e.preventDefault()

                                  let msg = t("sidebar.verificationAlert")
                                  if (item.url === "/messages") {
                                    msg = t("sidebar.verificationAlert_messages")
                                  } else if (item.url === "/services") {
                                    msg = t("sidebar.verificationAlert_services")
                                  } else if (item.url === "/planning") {
                                    msg = t("sidebar.verificationAlert_planning")
                                  } else if (item.url === "/profil") {
                                    msg = t("sidebar.verificationAlert_profil")
                                  } else if (item.url === "/evenements") {
                                    msg = t("sidebar.verificationAlert_evenements")
                                  } else if (item.url === "/votes") {
                                    msg = t("sidebar.verificationAlert_votes")
                                  } else if (item.url === "/incidents") {
                                    msg = t("sidebar.verificationAlert_incidents")
                                  } else if (item.url === "/map") {
                                    msg = t("sidebar.verificationAlert_map")
                                  }

                                  toast.error(msg, {
                                    id: `restricted-${item.title}`,
                                    duration: 4000,
                                  })
                                }
                              }}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full ${
                                  isRestricted ? "cursor-not-allowed text-[#2c308e] dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800" : ""
                                } ${
                                  isActive && !isRestricted
                                    ? "bg-[#e9eaf6] text-[#2c308e] dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                                }`
                              }
                            >
                              <item.icon className="h-5 w-5" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })
                  })()}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 transition-all text-left font-bold text-xs cursor-pointer active:scale-98"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>{t("common.logout")}</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#fefefa]/80 dark:bg-gray-900/80 px-6 backdrop-blur-md">
            <div className="flex-1 flex justify-center max-w-2xl mx-auto w-full">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("common.searchPlaceholder")}
                  className="h-10 w-full rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#2c308e] dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-[#2c308e]/20 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => i18n.changeLanguage(i18n.language.startsWith('fr') ? 'en' : 'fr')}
                className="flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shrink-0 cursor-pointer select-none"
                title={i18n.language.startsWith('fr') ? 'Switch to English' : 'Passer en Français'}
              >
                {i18n.language.startsWith('fr') ? 'EN' : 'FR'}
              </button>

              <button className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 shrink-0">
                <Bell animateOnHover className="h-5 w-5" />
              </button>

              <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-800" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none shrink-0 cursor-pointer">
                    <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                      <AvatarImage src={user?.picture} alt={user?.name || "Avatar"} />
                      <AvatarFallback className="bg-[#2c308e] dark:bg-indigo-600 text-white text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-xs font-bold text-gray-700 dark:text-gray-300 select-none pr-1">
                      {user?.name || "Habitant"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl p-2 z-40 mt-1 dark:bg-gray-900 dark:border-gray-800">
                  <div className="mb-2 px-2 py-1.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.name || t("dropdown.resident")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    {isVerified ? (
                      <p className="text-xs font-bold text-[#2c308e] dark:text-indigo-400 mt-1.5 flex items-center gap-1">
                        🪙 {t("common.points", { count: user?.points ?? 100 })}
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mt-1.5 flex items-center gap-1">
                        ⚠️ {t("common.unverifiedAccount")}
                      </p>
                    )}
                  </div>

                  <DropdownMenuSeparator className="dark:border-gray-800" />

                  <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider mt-2 px-2">
                    {t("dropdown.account")}
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/profil" className="flex items-center w-full">
                      <UserIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{t("dropdown.profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/points" className="flex items-center w-full">
                      <Coins className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{t("dropdown.balance")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/contrats" className="flex items-center w-full">
                      <FileText className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{t("dropdown.contracts")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/planning" className="flex items-center w-full">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{t("dropdown.planning")}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 dark:border-gray-800" />

                  <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider px-2">
                    {t("dropdown.application")}
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{t("dropdown.settings")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/aide" className="flex items-center w-full">
                      <LifeBuoy className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{t("dropdown.help")}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 dark:border-gray-800" />

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 rounded-lg py-2 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("common.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
