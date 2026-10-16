import { ref } from 'vue'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function useExport() {
  const isExporting = ref(false)

  const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
    try {
      isExporting.value = true
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      XLSX.writeFile(wb, `${filename}.xlsx`)
      return true
    } catch (e) { console.error(e); return false } finally { isExporting.value = false }
  }

  const importFromExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
          const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] || []
          resolve({ data: json, headers, workbook })
        } catch (err) { reject(err) }
      }
      reader.onerror = reject
      reader.readAsBinaryString(file)
    })
  }

  const importFromExcelWithRaw = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
          const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
          resolve({ data: json, raw, sheet, headers: raw[0] || [] })
        } catch (err) { reject(err) }
      }
      reader.onerror = reject
      reader.readAsBinaryString(file)
    })
  }

  const exportToPDF = async (elementId, filename) => {
    try {
      isExporting.value = true
      const element = document.getElementById(elementId)
      if (!element) throw new Error('Element not found')
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${filename}.pdf`)
      return true
    } catch (e) { console.error(e); return false } finally { isExporting.value = false }
  }

  return { isExporting, exportToExcel, importFromExcel, importFromExcelWithRaw, exportToPDF }
}
