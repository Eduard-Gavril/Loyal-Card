import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import * as XLSX from 'xlsx'

export async function exportExcel(workbook: XLSX.WorkBook, filename: string): Promise<void> {
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
  const uri = (FileSystem.cacheDirectory ?? '') + filename
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })
  await Sharing.shareAsync(uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Export Excel',
    UTI: 'com.microsoft.excel.xlsx',
  })
}

export function makeSheet<T extends Record<string, unknown>>(rows: T[], header?: string[]): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(rows)
  if (header) {
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' })
    XLSX.utils.sheet_add_json(ws, rows, { origin: 'A2', skipHeader: true })
  }
  return ws
}
