import { Outlet, NavLink, Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { useUser } from "../../hooks/useUser"
import { ZoneMembershipStatus } from "../../types/status.enum"
import { toast } from "sonner"
import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { conversationsApi } from "../../services/api/conversations"
import { postsApi } from "../../services/api/posts"
import { usersApi } from "../../services/api/user"
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
  { title: "Événements", url: "/evenements", icon: PartyPopper },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Votes", url: "/votes", icon: Vote },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
]

export default function AppLayout() {
  const { logout } = useAuth0()
  const { user, refreshProfile } = useUser()
  const queryClient = useQueryClient()
  const isVerified = user?.zoneStatut === ZoneMembershipStatus.ACTIVE

  const { data: conversations = [] } = useQuery({
    queryKey: ['global-conversations'],
    queryFn: async () => {
      const { data } = await conversationsApi.getAll()
      return data
    },
    enabled: !!user?.id && isVerified
  })

  const { data: feedData } = useQuery({
    queryKey: ['global-feed', user?.zoneId],
    queryFn: async () => {
      if (!user?.zoneId) return { data: [], nextCursor: null }
      const { data } = await postsApi.getFeed(user.zoneId, undefined, 100)
      return data
    },
    enabled: !!user?.zoneId
  })

  const hasMessages = conversations.length > 0
  const hasPosts = (feedData?.data || []).some(
    (post) => post.author === user?.id || post.author === user?.auth0Id
  )

  useEffect(() => {
    if (!user?.id) return

    const checkAndAwardMissions = async () => {
      let pointsToAdd = 0
      let pointsUpdated = false
      const currentPoints = user.points ?? 100

      const msgClaimKey = `hoodly-claimed-msg-${user.id}`
      if (hasMessages && !localStorage.getItem(msgClaimKey)) {
        pointsToAdd += 20
        localStorage.setItem(msgClaimKey, 'true')
        pointsUpdated = true
        toast.success("🎉 Mission accomplie : Premier message envoyé ! +20 points (2,00 €)", { duration: 6000 })
      }

      const postClaimKey = `hoodly-claimed-post-${user.id}`
      if (hasPosts && !localStorage.getItem(postClaimKey)) {
        pointsToAdd += 30
        localStorage.setItem(postClaimKey, 'true')
        pointsUpdated = true
        toast.success("🎉 Mission accomplie : Premier post partagé ! +30 points (3,00 €)", { duration: 6000 })
      }

      if (pointsUpdated && pointsToAdd > 0) {
        try {
          await usersApi.updateProfile({ points: currentPoints + pointsToAdd })
          if (refreshProfile) refreshProfile()
          queryClient.invalidateQueries({ queryKey: ['user-profile'] })
          queryClient.invalidateQueries({ queryKey: ['global-conversations'] })
          queryClient.invalidateQueries({ queryKey: ['global-feed'] })
        } catch (err) {
          console.error("Failed to persist global points update", err)
        }
      }
    }

    checkAndAwardMissions()
  }, [hasMessages, hasPosts, user?.id, queryClient, refreshProfile])
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
                Mon Quartier
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="px-4 gap-2">
                  {(() => {
                    return items.map((item) => {
                      const isRestricted = !isVerified && item.url !== "/dashboard"

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <NavLink
                              to={isRestricted ? "#" : item.url}
                              onClick={(e) => {
                                if (isRestricted) {
                                  e.preventDefault()

                                  let msg = "Veuillez faire vérifier votre compte pour accéder à cette fonctionnalité."
                                  if (item.url === "/messages") {
                                    msg = "Vérifiez votre compte pour pouvoir communiquer avec vos voisins."
                                  } else if (item.url === "/services") {
                                    msg = "Vérifiez votre compte pour pouvoir accéder aux services de quartier."
                                  } else if (item.url === "/planning") {
                                    msg = "Vérifiez votre compte pour pouvoir accéder à l'agenda de quartier."
                                  } else if (item.url === "/profil") {
                                    msg = "Vérifiez votre compte pour pouvoir accéder à votre profil complet."
                                  } else if (item.url === "/evenements") {
                                    msg = "Vérifiez votre compte pour pouvoir accéder aux événements du quartier."
                                  } else if (item.url === "/votes") {
                                    msg = "Vérifiez votre compte pour pouvoir participer aux votes de quartier."
                                  } else if (item.url === "/incidents") {
                                    msg = "Vérifiez votre compte pour pouvoir accéder au signalement d'incidents."
                                  } else if (item.url === "/map") {
                                    msg = "Vérifiez votre compte pour pouvoir accéder à la carte de quartier."
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
              <span>Se déconnecter</span>
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
                  placeholder="Rechercher un voisin, un service..."
                  className="h-10 w-full rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#2c308e] dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-[#2c308e]/20 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
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
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.name || "Habitant"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    {isVerified ? (
                      <p className="text-xs font-bold text-[#2c308e] dark:text-indigo-400 mt-1.5 flex items-center gap-1">
                        🪙 {user?.points ?? 100} points
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mt-1.5 flex items-center gap-1">
                        ⚠️ Compte non vérifié
                      </p>
                    )}
                  </div>

                  <DropdownMenuSeparator className="dark:border-gray-800" />

                  <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider mt-2 px-2">
                    Compte
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/profil" className="flex items-center w-full">
                      <UserIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Mon Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/points" className="flex items-center w-full">
                      <Coins className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Mon Solde</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/contrats" className="flex items-center w-full">
                      <FileText className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Contrats</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/planning" className="flex items-center w-full">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Mon Planning</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 dark:border-gray-800" />

                  <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider px-2">
                    Application
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg py-2 dark:hover:bg-gray-800" asChild>
                    <Link to="/aide" className="flex items-center w-full">
                      <LifeBuoy className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Aide & Support</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2 dark:border-gray-800" />

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 rounded-lg py-2 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
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
