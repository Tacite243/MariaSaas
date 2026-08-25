import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import {
  createBackupNow,
  fetchBackupHistory,
  fetchBackupStatus,
  fetchRemovableDrives,
  setLastVerify,
  updateBackupSettings
} from '@renderer/app/store/slice/backupSlice'
import { LanConfigModal } from './LanConfigModal'
import { BackupRecordDTO } from '@shared/types/backup.types'

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

export const SettingsBackupPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { status, history, drives, isLoading, error } = useSelector((s: RootState) => s.backup)
  const user = useSelector((s: RootState) => s.auth.user)
  const [showLan, setShowLan] = useState(false)
  const [restorePath, setRestorePath] = useState('')
  const [adminEmail, setAdminEmail] = useState(user?.email ?? '')
  const [adminPassword, setAdminPassword] = useState('')
  const [exportPassword, setExportPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void dispatch(fetchBackupStatus())
    void dispatch(fetchBackupHistory())
    void dispatch(fetchRemovableDrives())
  }, [dispatch])

  const handleBackupLocal = async () => {
    try {
      await dispatch(createBackupNow()).unwrap()
      void dispatch(fetchBackupHistory())
      void dispatch(fetchBackupStatus())
      setMessage('Sauvegarde locale créée avec succès')
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  const handleBackupUsb = async (drivePath: string) => {
    try {
      await dispatch(createBackupNow({ drivePath })).unwrap()
      setMessage(`Sauvegarde copiée sur ${drivePath}`)
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  const handleExport = async () => {
    const folder = await window.api.backup.pickExportFolder()
    if (!folder.success || !folder.data) return
    const res = await window.api.backup.export({
      destinationPath: folder.data,
      password: exportPassword || undefined
    })
    if (res.success) {
      setMessage('Export .msbackup créé')
      void dispatch(fetchBackupHistory())
    } else {
      setMessage(res.error?.message ?? 'Export échoué')
    }
  }

  const handlePickRestore = async () => {
    const res = await window.api.backup.pickRestoreFile()
    if (res.success && res.data) {
      setRestorePath(res.data)
      const verify = await window.api.backup.verifyFile({ filePath: res.data })
      if (verify.success && verify.data) dispatch(setLastVerify(verify.data))
    }
  }

  const handleRestore = async () => {
    if (!restorePath || !adminEmail || !adminPassword) {
      setMessage('Chemin et identifiants admin requis')
      return
    }
    if (!window.confirm('ATTENTION : Cette action remplacera la base de données. Continuer ?')) return

    const res = await window.api.backup.restore({
      backupPath: restorePath,
      adminEmail,
      adminPassword
    })
    if (res.success) {
      setMessage('Restauration effectuée — redémarrez l\'application')
    } else {
      setMessage(res.error?.message ?? 'Restauration échouée')
    }
  }

  const handleRetentionChange = (count: number) => {
    void dispatch(updateBackupSettings({ backupRetentionCount: count }))
    void dispatch(fetchBackupStatus())
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black dark:text-white">Sauvegarde & Résilience</h1>
          <p className="text-sm text-slate-400 mt-1">Protection contre les coupures de courant et pertes de données</p>
        </div>
        <button
          onClick={() => setShowLan(true)}
          className="px-4 py-2 border rounded-xl font-black text-xs uppercase dark:text-white"
        >
          Mode LAN multi-postes
        </button>
      </div>

      {status?.needsAlert && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300 text-sm font-bold">
          Aucune sauvegarde depuis plus de 24h — effectuez un backup dès que possible.
        </div>
      )}

      {message && (
        <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl text-sm font-bold text-sky-700 dark:text-sky-300">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 p-6 space-y-4">
          <h2 className="font-black uppercase text-sm dark:text-white">Actions rapides</h2>
          <button
            disabled={isLoading}
            onClick={() => void handleBackupLocal()}
            className="w-full py-3 bg-sky-600 text-white rounded-xl font-black text-xs uppercase disabled:opacity-50"
          >
            Sauvegarder maintenant (PC)
          </button>

          {drives.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune clé USB détectée</p>
          ) : (
            drives.map((d) => (
              <button
                key={d.path}
                disabled={isLoading}
                onClick={() => void handleBackupUsb(d.path)}
                className="w-full py-3 border dark:border-slate-700 rounded-xl font-black text-xs uppercase dark:text-white disabled:opacity-50"
              >
                USB — {d.label} ({d.path})
              </button>
            ))
          )}

          <div className="pt-4 border-t dark:border-slate-800 space-y-2">
            <input
              type="password"
              placeholder="Mot de passe chiffrement (optionnel)"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white text-sm"
            />
            <button
              onClick={() => void handleExport()}
              className="w-full py-3 bg-slate-900 dark:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase"
            >
              Exporter .msbackup
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 p-6 space-y-4">
          <h2 className="font-black uppercase text-sm dark:text-white">Paramètres</h2>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Rétention (derniers N backups)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={status?.retentionCount ?? 30}
              onChange={(e) => handleRetentionChange(parseInt(e.target.value, 10))}
              className="w-full mt-1 px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm dark:text-white">
            <input
              type="checkbox"
              checked={status?.autoOnZReport ?? true}
              onChange={(e) => {
                void dispatch(updateBackupSettings({ backupAutoOnZReport: e.target.checked }))
                void dispatch(fetchBackupStatus())
              }}
            />
            Backup auto à chaque clôture Z
          </label>
          <p className="text-xs text-slate-400">
            Dernière sauvegarde :{' '}
            {status?.lastBackupAt
              ? new Date(status.lastBackupAt).toLocaleString()
              : 'Jamais'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 p-6">
        <h2 className="font-black uppercase text-sm dark:text-white mb-4">Historique</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-[10px] uppercase text-slate-400">
                <th className="text-left py-2">Fichier</th>
                <th className="text-left">Date</th>
                <th className="text-left">Taille</th>
                <th className="text-left">SHA-256</th>
                <th className="text-left">Dest.</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r: BackupRecordDTO) => (
                <tr key={r.id} className="border-t dark:border-slate-800">
                  <td className="py-2 dark:text-white font-mono text-xs">{r.fileName}</td>
                  <td className="dark:text-slate-300">{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{formatSize(r.sizeBytes)}</td>
                  <td className="font-mono text-[10px] text-slate-400">{r.sha256.slice(0, 16)}…</td>
                  <td>{r.destination}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-200 dark:border-red-900/30 p-6 space-y-4">
        <h2 className="font-black uppercase text-sm text-red-700 dark:text-red-400">Restauration d&apos;urgence</h2>
        <p className="text-xs text-red-600 dark:text-red-300">
          Cette opération remplace la base SQLite active. Réservée aux administrateurs.
        </p>
        <button
          onClick={() => void handlePickRestore()}
          className="px-4 py-2 border border-red-300 rounded-xl text-xs font-black uppercase text-red-700"
        >
          Choisir un fichier…
        </button>
        {restorePath && <p className="text-xs font-mono dark:text-white">{restorePath}</p>}
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="email"
            placeholder="Email admin"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white"
          />
          <input
            type="password"
            placeholder="Mot de passe admin"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="px-3 py-2 rounded-xl border dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          onClick={() => void handleRestore()}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase"
        >
          Restaurer (irréversible)
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {showLan && <LanConfigModal onClose={() => setShowLan(false)} />}
    </div>
  )
}
