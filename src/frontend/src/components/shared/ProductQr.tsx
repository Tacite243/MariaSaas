import React, { useEffect, useState } from 'react'

interface ProductQrProps {
  code: string
  size?: number
  className?: string
  onClick?: () => void
}

/** QR produit chargé à la demande via IPC (Main process) */
export const ProductQr: React.FC<ProductQrProps> = ({
  code,
  size = 80,
  className = 'w-10 h-10',
  onClick
}) => {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await window.api.qr.generate(code, size)
        if (!cancelled && res.success && res.data) setSrc(res.data)
      } catch {
        // QR optionnel
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, size])

  if (!src) {
    return (
      <div
        className={`${className} bg-slate-100 dark:bg-slate-800 rounded-lg border dark:border-slate-700 animate-pulse`}
      />
    )
  }

  return (
    <div
      className={`${className} bg-white p-0.5 rounded-lg border dark:border-slate-700 flex-none cursor-pointer`}
      onClick={onClick}
      title={`Code: ${code}`}
    >
      <img src={src} alt={`QR ${code}`} className="w-full h-full object-contain" loading="lazy" />
    </div>
  )
}
