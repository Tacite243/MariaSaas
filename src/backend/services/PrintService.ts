import { BrowserWindow } from 'electron'
import { PrintReceiptInput, PrintSettingsInput } from '../../shared/schemas/pos.schema'
import { formatCdf, formatUsdCents } from '../../shared/utils/money'
import { qrCodeService } from './QrCodeService'
import { prisma } from '../lib/prisma'

let mainWindowRef: BrowserWindow | null = null

export const setMainWindow = (win: BrowserWindow) => {
  mainWindowRef = win
}

export class PrintService {
  async getPrinters() {
    if (!mainWindowRef) return []
    return mainWindowRef.webContents.getPrintersAsync()
  }

  async getSettings() {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: 'default' } })
    }
    return settings
  }

  async updateSettings(data: PrintSettingsInput) {
    return prisma.appSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data
    })
  }

  private buildReceiptHtml(
    data: PrintReceiptInput,
    width: '58' | '80',
    pharmacyName: string,
    qrDataUrl: string
  ): string {
    const w = width === '58' ? '58mm' : '80mm'
    const fontSize = width === '58' ? '11px' : '12px'
    const qrSize = width === '58' ? '90px' : '120px'

    const itemRows = data.items
      .map(
        (item) => `
      <tr>
        <td>${item.dci ? `${item.dci}<br/>` : ''}${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatUsdCents(item.unitPriceMinor)}</td>
        <td style="text-align:right">${formatUsdCents(item.totalMinor)}</td>
      </tr>`
      )
      .join('')

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: ${w} auto; margin: 2mm; }
  body { font-family: monospace; font-size: ${fontSize}; width: ${w}; margin: 0; padding: 4px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .footer { font-size: 9px; margin-top: 8px; }
  .qr { display: block; margin: 8px auto; width: ${qrSize}; height: ${qrSize}; }
</style></head><body>
  <div class="center bold">${pharmacyName}</div>
  <div class="center">Ticket N° ${data.reference}</div>
  <div class="center">${data.date}</div>
  <div class="center">Caissier: ${data.cashierName}</div>
  <hr/>
  <table>${itemRows}</table>
  <hr/>
  <div>Total USD: <span class="bold">${formatUsdCents(data.subTotalUsdCents)} $</span></div>
  <div>Total CDF: <span class="bold">${formatCdf(data.subTotalCdf)} FC</span></div>
  <div>Taux: 1 USD = ${data.exchangeRate} CDF</div>
  <div>Paiement: ${data.paymentMethod}</div>
  ${data.changeUsdCents !== undefined ? `<div>Monnaie USD: ${formatUsdCents(data.changeUsdCents)} $</div>` : ''}
  ${data.changeCdf !== undefined ? `<div>Monnaie CDF: ${formatCdf(data.changeCdf)} FC</div>` : ''}
  <hr/>
  <div class="footer center">
    <img class="qr" src="${qrDataUrl}" alt="QR contrôle" />
    Contrôle ticket<br/>
    Les médicaments vendus ne sont ni repris ni échangés.<br/>
    Conservez votre reçu.
  </div>
</body></html>`
  }

  async printReceipt(data: PrintReceiptInput) {
    if (!mainWindowRef) throw new Error('Fenêtre principale indisponible')

    const settings = await this.getSettings()
    const width = (settings.receiptWidth === '58' ? '58' : '80') as '58' | '80'
    const qrDataUrl = await qrCodeService.forReceipt(data.controlQrText, width)
    const html = this.buildReceiptHtml(data, width, settings.pharmacyName, qrDataUrl)

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    return new Promise<{ success: boolean }>((resolve, reject) => {
      printWin.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: settings.defaultPrinter || undefined
        },
        (success, failureReason) => {
          printWin.close()
          if (!success) reject(new Error(failureReason || 'Impression échouée'))
          else resolve({ success: true })
        }
      )
    })
  }
}

export const printService = new PrintService()
