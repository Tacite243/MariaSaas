import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/app/store/store'
import {
  configureLan,
  fetchLanStatus,
  pairLanClient,
  startLanServer
} from '@renderer/app/store/slice/lanSlice'
import { LanMode } from '@shared/types/lan.types'

interface Props {
  onClose: () => void
}

export const LanConfigModal: React.FC<Props> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { status, pairingInfo } = useSelector((s: RootState) => s.lan)
  const [mode, setMode] = useState<LanMode>('STANDALONE')
  const [clientHost, setClientHost] = useState('')
  const [clientToken, setClientToken] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void dispatch(fetchLanStatus())
  }, [dispatch])

  useEffect(() => {
    if (status) {
      setMode(status.mode)
      setClientHost(status.clientHost ?? '')
    }
  }, [status])

  const handleSave = async () => {
    try {
      await dispatch(
        configureLan({
          lanMode: mode,
          lanClientHost: mode === 'CLIENT' ? clientHost : null,
          lanClientToken: mode === 'CLIENT' ? clientToken : null
        })
      ).unwrap()
      if (mode === 'SERVER') {
        const info = await dispatch(startLanServer()).unwrap()
        setMessage(`Serveur actif — IP: ${info.localIp}:${info.port}`)
      } else {
        setMessage('Configuration enregistrée')
      }
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  const handlePair = async () => {
    try {
      await dispatch(pairLanClient({ host: clientHost, token: clientToken })).unwrap()
      setMessage('Jumelage réussi — connexion à la caisse principale')
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border dark:border-slate-800 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black dark:text-white">Mode réseau LAN</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="space-y-3">
          {(['STANDALONE', 'SERVER', 'CLIENT'] as LanMode[]).map((m) => (
            <label key={m} className="flex items-center gap-3 p-3 rounded-xl border dark:border-slate-700 cursor-pointer">
              <input type="radio" name="lanMode" checked={mode === m} onChange={() => setMode(m)} />
              <span className="text-sm font-bold dark:text-white">
                {m === 'STANDALONE' && 'Poste autonome (SQLite local)'}
                {m === 'SERVER' && 'Caisse principale (Serveur LAN)'}
                {m === 'CLIENT' && 'Caisse secondaire (Client LAN)'}
              </span>
            </label>
          ))}
        </div>

        {mode === 'SERVER' && pairingInfo && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm">
            <p className="font-black text-emerald-700 dark:text-emerald-300">Token de jumelage :</p>
            <p className="font-mono text-xs break-all mt-1">{pairingInfo.token}</p>
            <p className="mt-2 text-xs">IP: {pairingInfo.localIp}:{pairingInfo.port}</p>
          </div>
        )}

        {mode === 'CLIENT' && (
          <div className="space-y-3">
            <input
              placeholder="IP caisse principale (ex: 192.168.1.50)"
              value={clientHost}
              onChange={(e) => setClientHost(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white"
            />
            <input
              placeholder="Token de jumelage"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white font-mono text-xs"
            />
            <button
              onClick={() => void handlePair()}
              className="w-full py-3 border rounded-xl font-black text-xs uppercase dark:text-white"
            >
              Tester connexion / Jumeler
            </button>
            {status && (
              <p className={`text-xs font-bold ${status.clientConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                {status.clientConnected ? 'Connecté au serveur LAN' : status.lastError ?? 'Non connecté'}
              </p>
            )}
          </div>
        )}

        {message && <p className="text-sm font-bold text-sky-600">{message}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold text-slate-500">
            Fermer
          </button>
          <button
            onClick={() => void handleSave()}
            className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-black text-xs uppercase"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
