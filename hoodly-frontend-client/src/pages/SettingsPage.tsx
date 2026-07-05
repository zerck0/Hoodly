import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useUser } from '../hooks/useUser'
import { rgpdApi } from '../services/api/rgpd'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  Palette,
  Download,
  Trash2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const { logout } = useAuth0()
  const { theme, setTheme } = useTheme()

  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')

  const handleExportData = async () => {
    try {
      const response = await rgpdApi.exportData()
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `hoodly-rgpd-export-${user?.name?.replace(/\s+/g, '-').toLowerCase() || 'user'}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      toast.success(t('settings.export_success'))
    } catch (err) {
      toast.error(t('settings.export_error'))
    }
  }

  const handleAnonymizeData = async () => {
    if (confirmDeleteText !== t('settings.confirm_delete_word')) {
      toast.error(t('settings.delete_validation_error'))
      return
    }

    try {
      await rgpdApi.anonymizeData()
      toast.success(t('settings.delete_success'))
      setTimeout(() => {
        logout({ logoutParams: { returnTo: window.location.origin } })
      }, 2000)
    } catch (err) {
      toast.error(t('settings.delete_error'))
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 dark:text-gray-100 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('settings.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('settings.description')}
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold dark:text-white flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#2c308e] dark:text-indigo-400" />
              {t('settings.appearance.title')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('settings.appearance.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('settings.appearance.theme_label')}</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    theme === 'light'
                      ? 'border-[#2c308e] bg-[#e9eaf6]/40 dark:bg-indigo-950/20'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="h-10 w-full rounded-md bg-[#fefefa] border border-gray-200 shadow-xs flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">{t('settings.appearance.light_mode')}</span>
                  </div>
                  <span className="text-xs font-bold dark:text-white">{t('settings.appearance.light_mode')}</span>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    theme === 'dark'
                      ? 'border-[#2c308e] bg-[#e9eaf6]/40 dark:bg-indigo-950/20'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="h-10 w-full rounded-md bg-gray-950 border border-gray-800 shadow-xs flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">{t('settings.appearance.dark_mode')}</span>
                  </div>
                  <span className="text-xs font-bold dark:text-white">{t('settings.appearance.dark_mode')}</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold dark:text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#2c308e] dark:text-indigo-400" />
              {t('settings.rgpd.title')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('settings.rgpd.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
              <div className="space-y-1">
                <p className="text-sm font-semibold dark:text-white">{t('settings.rgpd.export_title')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.rgpd.export_description')}</p>
              </div>
              <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2 shrink-0 dark:border-gray-700 dark:text-white cursor-pointer active:scale-98">
                <Download className="h-4 w-4" />
                <span>{t('settings.rgpd.export_button')}</span>
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-red-100 dark:border-red-950/30 bg-red-50/20 dark:bg-red-950/10 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t('settings.rgpd.delete_title')}</p>
                <p className="text-xs text-red-600 dark:text-red-500">{t('settings.rgpd.delete_description')}</p>
              </div>

              {isDeleting ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {t('settings.rgpd.confirm_prompt_prefix')}<span className="text-red-600 font-extrabold">{t('settings.confirm_delete_word')}</span>{t('settings.rgpd.confirm_prompt_suffix')}
                  </p>
                  <div className="flex gap-2 max-w-sm">
                    <Input
                      value={confirmDeleteText}
                      onChange={(e) => setConfirmDeleteText(e.target.value)}
                      placeholder={t('settings.confirm_delete_word')}
                      className="border-red-200 dark:border-red-900 bg-white dark:bg-gray-850 dark:text-white font-bold"
                    />
                    <Button onClick={handleAnonymizeData} variant="destructive" className="cursor-pointer active:scale-98 bg-red-600 hover:bg-red-700 text-white font-bold">
                      {t('settings.confirm_button')}
                    </Button>
                    <Button onClick={() => setIsDeleting(false)} variant="outline" className="dark:border-gray-700 dark:text-white cursor-pointer">
                      {t('settings.cancel_button')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setIsDeleting(true)} variant="destructive" className="flex items-center gap-2 cursor-pointer active:scale-98 bg-red-600 hover:bg-red-700 text-white font-bold">
                  <Trash2 className="h-4 w-4" />
                  <span>{t('settings.rgpd.delete_account_button')}</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
