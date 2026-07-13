import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '../hooks/useUser'
import { zonesApi } from '../services/api/zone'
import { useEvents } from '../hooks/useEvents'
import VerificationModal from '../components/shared/VerificationModal'
import StatusBanner from '../components/dashboard/StatusBanner'
import { Feed } from '../components/dashboard/feed/Feed'
import { CreatePostForm } from '../components/dashboard/feed/CreatePostForm'
import { ZoneMembershipStatus } from '../types/status.enum'
import {
  MapPin, Users, Coins, ArrowRight, ShieldAlert, Sparkles,
  Info, Sun, CloudSun, Cloud, CloudFog, CloudRain,
  Snowflake, CloudLightning, Calendar
} from 'lucide-react'

function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user, isRefreshing, refreshProfile } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const hasZone = !!user?.zoneId;
  const isVerified = user?.zoneStatut === ZoneMembershipStatus.ACTIVE;

  const { data: zone } = useQuery({
    queryKey: ['my-zone'],
    queryFn: async () => {
      const { data } = await zonesApi.getMyZone()
      return data
    },
    enabled: hasZone,
    staleTime: 1000 * 60 * 5,
  })

  const [weather, setWeather] = useState<{
    temp: number;
    descriptionKey: string;
    icon: any;
  } | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(false)

  useEffect(() => {
    let lat = 48.8566
    let lng = 2.3522
    
    if (zone?.polygone?.coordinates?.[0]?.[0]) {
      lng = zone.polygone.coordinates[0][0][0]
      lat = zone.polygone.coordinates[0][0][1]
    } else if (!zone) {
      return
    }

    const fetchWeather = async () => {
      setLoadingWeather(true)
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
        const data = await res.json()
        if (data?.current_weather) {
          const temp = Math.round(data.current_weather.temperature)
          const code = data.current_weather.weathercode
          
          let descriptionKey = 'variable'
          let icon = Cloud
          
          if (code === 0) {
            descriptionKey = 'clearSky'
            icon = Sun
          } else if (code >= 1 && code <= 2) {
            descriptionKey = 'cloudyPart'
            icon = CloudSun
          } else if (code === 3) {
            descriptionKey = 'cloudy'
            icon = Cloud
          } else if (code === 45 || code === 48) {
            descriptionKey = 'fog'
            icon = CloudFog
          } else if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) {
            descriptionKey = 'rain'
            icon = CloudRain
          } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
            descriptionKey = 'snow'
            icon = Snowflake
          } else if (code >= 95) {
            descriptionKey = 'thunderstorm'
            icon = CloudLightning
          }

          setWeather({ temp, descriptionKey, icon })
        }
      } catch (err) {
        console.error('Error fetching weather:', err)
      } finally {
        setLoadingWeather(false)
      }
    }

    fetchWeather()
  }, [zone])

  const { events } = useEvents(isVerified)

  const nextEvent = events
    ? [...events]
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null

  const formatEventDate = (dateStr: string, locale: string) => {
    try {
      const d = new Date(dateStr)
      const day = d.getDate()
      const month = d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' })
      return { day, month }
    } catch {
      return { day: '?', month: '?' }
    }
  }

  return (
    <div className="font-sans flex flex-col h-full bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/20 dark:from-gray-950 dark:via-gray-950 dark:to-slate-900/50 min-h-screen pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-200/20 to-purple-200/20 dark:from-indigo-950/15 dark:to-purple-950/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-100/15 to-blue-200/15 dark:from-emerald-950/10 dark:to-blue-950/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <StatusBanner
        user={user ?? null}
        isRefreshing={isRefreshing}
        onRefresh={refreshProfile}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        {!hasZone ? (
          <div className="max-w-3xl mx-auto rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-12 text-center shadow-lg border border-gray-100/50 dark:border-gray-800/50 ring-1 ring-black/[0.03]">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('dashboard.welcome')}
            </h1>
            <p className="mt-4 text-muted-foreground dark:text-gray-400 text-lg max-w-md mx-auto">
              {t('dashboard.joinNeighborhoodPrompt')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {isVerified && <CreatePostForm zoneId={user.zoneId!} />}
              <Feed zoneId={user.zoneId!} />
            </div>

            <div className="space-y-6 lg:sticky lg:top-20">
              
              <div className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/[0.04] dark:ring-white/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {t('dashboard.widgets.myZone.title', 'Mon Quartier')}
                  </span>
                  <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                
                {zone ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {zone.nom}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {zone.ville}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {t('dashboard.widgets.myZone.membersCount', { count: zone.membresCount, defaultValue: '{{count}} voisins' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-20 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
                )}

                {!isVerified && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-400 leading-normal">
                      {t('dashboard.widgets.myZone.unverifiedWarning', 'Compte non vérifié. Soumettez vos justificatifs pour interagir dans le quartier.')}
                    </div>
                  </div>
                )}
              </div>

              {hasZone && (loadingWeather || weather) && (
                <div className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/[0.04] dark:ring-white/[0.04]">
                  {loadingWeather ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                      <div className="flex items-center justify-between py-1">
                        <div className="space-y-2 flex-1">
                          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                        </div>
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                      </div>
                    </div>
                  ) : weather ? (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {zone ? t('dashboard.widgets.weather.title', { city: zone.ville, defaultValue: 'Météo à {{city}}' }) : t('dashboard.widgets.weather.title_local', 'Météo locale')}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                            {weather.temp}°C
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {t(`dashboard.widgets.weather.wmo.${weather.descriptionKey}`, 'Météo variable')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <weather.icon className="w-6 h-6" />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="bg-gradient-to-br from-[#2c308e] to-[#4c51bf] text-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    {t('dashboard.widgets.wallet.title', 'Mon Portefeuille')}
                  </span>
                  <Coins className="w-4 h-4 text-indigo-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-extrabold tracking-tight">
                    {t('dashboard.widgets.wallet.points', { count: user?.points ?? 100, defaultValue: '{{count}} pts' })}
                  </p>
                  <p className="text-xs text-indigo-100 leading-normal">
                    {t('dashboard.widgets.wallet.description', 'Utilisez vos points pour louer du matériel ou demander des services à vos voisins.')}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-end items-center text-xs text-indigo-100">
                  <a href="/services" className="flex items-center gap-1 font-bold hover:text-white transition">
                    {t('dashboard.widgets.wallet.proposeService', 'Proposer un service')} <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {hasZone && isVerified && (
                <div className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/[0.04] dark:ring-white/[0.04]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {t('dashboard.widgets.event.title', 'Prochain événement')}
                    </span>
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  {nextEvent ? (
                    <>
                      <div className="flex gap-4 items-start group">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/50 dark:border-indigo-900/20 flex flex-col items-center justify-center shrink-0">
                          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">
                            {formatEventDate(nextEvent.date, i18n.language).day}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-1">
                            {formatEventDate(nextEvent.date, i18n.language).month}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {nextEvent.titre}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <span>📍 {typeof nextEvent.lieu === 'object' ? (nextEvent.lieu?.ville || nextEvent.lieu?.adresse) : nextEvent.lieu}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                        <a
                          href="/evenements"
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition"
                        >
                          {t('dashboard.widgets.event.allEventsBtn', 'Voir tous les événements')}
                        </a>
                        <a
                          href="/evenements"
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition"
                        >
                          {t('dashboard.widgets.event.joinBtn', "Participer à l'événement")} <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        {t('dashboard.widgets.event.noEvents', 'Aucun événement prévu prochainement.')}
                      </p>
                      <a
                        href="/evenements"
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition"
                      >
                        {t('dashboard.widgets.event.allEventsBtn', 'Voir tous les événements')}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-gray-800/30 border border-slate-200/30 flex gap-2.5 items-start">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  {t('dashboard.widgets.guidelines.warning', 'Chaque publication et service partagé renforce la cohésion de notre quartier. Soyez respectueux et solidaire dans vos échanges.')}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default DashboardPage
