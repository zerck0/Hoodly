/* eslint-disable react-hooks/exhaustive-deps */
import { useUser } from '../hooks/useUser'
import { useTransactions } from '../hooks/useTransactions'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PointsBalanceCard } from '../components/points-page/PointsBalanceCard'
import { PointsRulesCard } from '../components/points-page/PointsRulesCard'
import { TransactionList } from '../components/points-page/TransactionList'
import { SuggestedRatesCard } from '../components/points-page/SuggestedRatesCard'

export default function PointsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const { data: backendTransactions, isLoading: isLoadingInbox } = useTransactions()

  const points = user?.points ?? 100

  const translateTransactionDescription = (desc: string) => {
    if (!desc) return desc;

    if (desc === 'Cadeau de Bienvenue Hoodly') {
      return t('points.transactions.welcomeGrant', 'Cadeau de Bienvenue Hoodly');
    }

    let match = desc.match(/^Remboursement désinscription "([^"]*)"$/);
    if (match) {
      return t('points.transactions.refundUnregister', { title: match[1], defaultValue: `Remboursement désinscription "${match[1]}"` });
    }

    match = desc.match(/^Points réservés pour l'événement "([^"]*)"$/);
    if (match) {
      return t('points.transactions.reservedPoints', { title: match[1], defaultValue: `Points réservés pour l'événement "${match[1]}"` });
    }

    match = desc.match(/^Récompense organisation de l'événement "([^"]*)"$/);
    if (match) {
      return t('points.transactions.rewardOrganizer', { title: match[1], defaultValue: `Récompense organisation de l'événement "${match[1]}"` });
    }

    match = desc.match(/^Récompense participation à l'événement "([^"]*)"$/);
    if (match) {
      return t('points.transactions.rewardParticipant', { title: match[1], defaultValue: `Récompense participation à l'événement "${match[1]}"` });
    }

    match = desc.match(/^Points accumulés des inscriptions pour l'événement "([^"]*)"$/);
    if (match) {
      return t('points.transactions.accumulatedPoints', { title: match[1], defaultValue: `Points accumulés des inscriptions pour l'événement "${match[1]}"` });
    }

    match = desc.match(/^Remboursement annulation événement "([^"]*)"$/);
    if (match) {
      return t('points.transactions.refundCancellation', { title: match[1], defaultValue: `Remboursement annulation événement "${match[1]}"` });
    }

    match = desc.match(/^Inscription confirmée pour l'événement "([^"]*)"$/);
    if (match) {
      return t('points.transactions.confirmedRegistration', { title: match[1], defaultValue: `Inscription confirmée pour l'événement "${match[1]}"` });
    }

    match = desc.match(/^Remboursement du séquestre pour le contrat annulé : (.*)$/);
    if (match) {
      return t('points.transactions.refundEscrow', { title: match[1], defaultValue: `Remboursement du séquestre pour le contrat annulé : ${match[1]}` });
    }

    match = desc.match(/^Transaction de points pour contrat : (.*)$/);
    if (match) {
      return t('points.transactions.contractTransfer', { title: match[1], defaultValue: `Transaction de points pour contrat : ${match[1]}` });
    }

    match = desc.match(/^Paiement pour le service "([^"]*)"$/);
    if (match) {
      return t('points.transactions.servicePayment', { title: match[1], defaultValue: `Paiement pour le service "${match[1]}"` });
    }

    match = desc.match(/^Mission accomplie : (.*)$/);
    if (match) {
      let mTitle = match[1];
      if (mTitle === 'Discussion active') {
        mTitle = t('points.transactions.missions.discussion', 'Discussion active');
      } else if (mTitle === 'Premier pas sur le feed') {
        mTitle = t('points.transactions.missions.firstPost', 'Premier pas sur le feed');
      } else if (mTitle === 'Signalement civique') {
        mTitle = t('points.transactions.missions.firstIncident', 'Signalement civique');
      } else if (mTitle === 'Organisateur de quartier') {
        mTitle = t('points.transactions.missions.createEvent', 'Organisateur de quartier');
      } else if (mTitle === "Esprit d'équipe") {
        mTitle = t('points.transactions.missions.joinEvent', "Esprit d'équipe");
      }
      return t('points.transactions.missionCompleted', { title: mTitle, defaultValue: `Mission accomplie : ${mTitle}` });
    }

    return desc;
  };

  const realTransactions = useMemo(() => {
    if (!backendTransactions) return []

    return backendTransactions.map((tx: any) => {
      const payerId = typeof tx.payerId === 'object' ? tx.payerId?._id : tx.payerId
      const isPayer = payerId === user?.id

      const dateLabel = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : t('points.recently')

      return {
        id: tx._id,
        title: translateTransactionDescription(tx.description),
        category: tx.serviceId?.categorie ? t('categories.' + tx.serviceId.categorie) : t('points.system_category'),
        amount: tx.amount,
        type: isPayer ? ('debit' as const) : ('credit' as const),
        date: dateLabel,
        status: t('points.completed_status')
      }
    })
  }, [backendTransactions, user?.id, i18n.language, t, translateTransactionDescription])

  const suggestedRates = [
    { name: t('points.suggested_rates.school_support'), rate: t('points.suggested_rates.school_support_rate') },
    { name: t('points.suggested_rates.diy_garden'), rate: t('points.suggested_rates.diy_garden_rate') },
    { name: t('points.suggested_rates.babysitting'), rate: t('points.suggested_rates.babysitting_rate') },
    { name: t('points.suggested_rates.shopping'), rate: t('points.suggested_rates.shopping_rate') },
    { name: t('points.suggested_rates.animals'), rate: t('points.suggested_rates.animals_rate') }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('points.title')}
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-light leading-relaxed">
          {t('points.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PointsBalanceCard points={points} />
        <PointsRulesCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TransactionList transactions={realTransactions} isLoading={isLoadingInbox} />
        <SuggestedRatesCard rates={suggestedRates} />
      </div>
    </div>
  )
}
