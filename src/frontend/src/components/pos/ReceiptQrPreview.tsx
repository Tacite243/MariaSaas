import React, { useEffect, useState } from 'react'

interface ReceiptQrPreviewProps {
  controlPayload: string
  reference: string
}

/** Aperçu QR post-encaissement (écran caisse) */
export const ReceiptQrPreview: React.FC<ReceiptQrPreviewProps> = ({
  controlPayload,
  reference
}) => {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await window.api.qr.generate(controlPayload, 160)
      if (res.success && res.data) setSrc(res.data)
    })()
  }, [controlPayload])

  if (!src) return null

  return (
    <div className="flex flex-col items-center gap-2 py-3 border-t border-slate-100 dark:border-slate-800 mt-3">
      <img src={src} alt="QR ticket" className="w-28 h-28 bg-white p-1 rounded-lg border" />
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        QR contrôle — {reference}
      </p>
    </div>
  )
}
