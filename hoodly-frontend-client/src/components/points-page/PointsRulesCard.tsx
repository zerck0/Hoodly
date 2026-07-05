import { Info, TrendingUp } from 'lucide-react'
import { Card } from '../ui/card'
import { useTranslation } from 'react-i18next'

export function PointsRulesCard() {
  const { t } = useTranslation()
  return (
    <Card className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="h-10 w-10 rounded-full bg-[#e9eaf6] flex items-center justify-center text-[#2c308e]">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-snug">
            {t('points.rulesCard.title', "Règles d'échange")}
          </h3>
          <p className="text-xs text-gray-500 mt-1.5 font-light leading-relaxed">
            {t('points.rulesCard.desc1', 'Le solde de points Hoodly est purement virtuel et communautaire.')}
            <br/>
            {t('points.rulesCard.desc2', "Chaque nouvel habitant bénéficie d'un cadeau de 100 points pour commencer à solliciter de l'aide auprès de ses voisins.")}
          </p>
        </div>
      </div>
      <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-[#2c308e] shrink-0 mt-0.5" />
        <p className="text-[10px] text-gray-600 leading-relaxed font-light">
          <strong>{t('points.rulesCard.missionsCitoyennesTitle', 'Missions citoyennes :')} </strong>
          {t('points.rulesCard.missionsCitoyennesText', 'Réalisez vos premières actions de bon voisinage (publier sur le feed, signaler un incident...) pour gagner des points supplémentaires.')}
        </p>
      </div>
    </Card>
  )
}
