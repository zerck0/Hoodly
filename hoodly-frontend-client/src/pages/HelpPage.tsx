import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Mail,
  MessageSquare,
  FileText,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Coins,
  MapPin,
  HeartHandshake
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

export default function HelpPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const faqItems = [
    {
      question: t('help.faq.join_neighborhood.question'),
      answer: t('help.faq.join_neighborhood.answer'),
      icon: MapPin
    },
    {
      question: t('help.faq.points_system.question'),
      answer: t('help.faq.points_system.answer'),
      icon: Coins
    },
    {
      question: t('help.faq.contract.question'),
      answer: t('help.faq.contract.answer'),
      icon: FileText
    },
    {
      question: t('help.faq.incident.question'),
      answer: t('help.faq.incident.answer'),
      icon: ShieldCheck
    },
    {
      question: t('help.faq.rgpd.question'),
      answer: t('help.faq.rgpd.answer'),
      icon: HeartHandshake
    }
  ]

  const filteredFaqs = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 dark:text-gray-100 space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex p-3 bg-[#e9eaf6] dark:bg-indigo-950/40 rounded-2xl text-[#2c308e] dark:text-indigo-400">
          <LifeBuoy className="h-8 w-8 animate-spin-slow" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('help.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
          {t('help.description')}
        </p>
      </div>

      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('help.search_placeholder')}
          className="h-12 w-full rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-12 pr-4 text-sm shadow-xs focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 transition-all dark:text-white"
        />
      </div>

      <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold dark:text-white">{t('help.faq_title')}</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {t('help.faq_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredFaqs.length === 0 ? (
            <p className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
              {t('help.no_results')}
            </p>
          ) : (
            filteredFaqs.map((faq, index) => {
              const Icon = faq.icon
              const isOpen = openFaqIndex === index
              return (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between text-left font-bold text-sm text-gray-900 dark:text-white hover:text-[#2c308e] dark:hover:text-indigo-400 cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 text-gray-400 dark:text-gray-500 shrink-0" />
                      {faq.question}
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="mt-3 pl-7 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light animate-in fade-in slide-in-from-top-1 duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs flex flex-col justify-between">
          <CardHeader className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-[#e9eaf6] dark:bg-indigo-950/30 text-[#2c308e] dark:text-indigo-400 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold dark:text-white">{t('help.email_support.title')}</CardTitle>
            <CardDescription className="text-xs dark:text-gray-400">
              {t('help.email_support.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <a href="mailto:hoodlypro@gmail.com" className="inline-flex items-center gap-2 text-xs font-bold text-[#2c308e] dark:text-indigo-400 hover:underline">
              hoodlypro@gmail.com
            </a>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 dark:bg-gray-900 shadow-xs flex flex-col justify-between">
          <CardHeader className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-[#e9eaf6] dark:bg-indigo-950/30 text-[#2c308e] dark:text-indigo-400 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-bold dark:text-white">{t('help.moderators.title')}</CardTitle>
            <CardDescription className="text-xs dark:text-gray-400">
              {t('help.moderators.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button variant="outline" className="h-8 px-4 rounded-xl text-[10px] font-bold dark:border-gray-700 dark:text-white cursor-pointer active:scale-98" onClick={() => window.location.href = '/messages'}>
              {t('help.moderators.open_chat')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
