import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import { fetchBackupStatus } from '@renderer/app/store/slice/backupSlice'
import { Link } from 'react-router-dom'

export const BackupAlertBanner: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const status = useSelector((s: RootState) => s.backup.status)

  useEffect(() => {
    void dispatch(fetchBackupStatus())
  }, [dispatch])

  if (!status?.needsAlert) return null

  return (
    <div className="flex items-center justify-between gap-4 p-4 mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
        Sauvegarde recommandée — aucun backup depuis{' '}
        {status.hoursSinceLastBackup != null
          ? `${Math.floor(status.hoursSinceLastBackup)}h`
          : 'plus de 24h'}
      </p>
      <Link
        to="/settings-backup"
        className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase"
      >
        Sauvegarder
      </Link>
    </div>
  )
}
