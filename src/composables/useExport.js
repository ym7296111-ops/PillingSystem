import { ref } from 'vue'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatCurrency, formatDate } from '@/utils/helpers'

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
    } catch (e) {
      console.error(e)
      return false
    } finally {
      isExporting.value = false
    }
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
          const json = XLSX.utils.sheet_to_json(sheet)
          resolve(json)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsBinaryString(file)
    })
  }

  const exportInvoiceToPDF = async (elementId, filename) => {
    try {
      isExporting.value = true
      const element = document.getElementById(elementId)
      if (!element) throw new Error('Element not found')
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${filename}.pdf`)
      return true
    } catch (e) {
      console.error(e)
      return false
    } finally {
      isExporting.value = false
    }
  }

  const generateInvoicePDF = (bill, subscriber, companyInfo) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text(companyInfo.companyName || 'شركة الخدمات العامة', pageWidth / 2, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`العنوان: ${companyInfo.companyAddress || ''}`, pageWidth - 15, 30, { align: 'right' })
      doc.text(`هاتف: ${companyInfo.companyPhone || ''}`, pageWidth - 15, 36, { align: 'right' })
      
      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('فاتورة', pageWidth / 2, 50, { align: 'center' })
      
      // Bill Info
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      let y = 65
      doc.text(`رقم الفاتورة: ${bill.billNumber}`, pageWidth - 15, y, { align: 'right' })
      y += 7
      doc.text(`تاريخ الاصدار: ${formatDate(bill.issueDate)}`, pageWidth - 15, y, { align: 'right' })
      y += 7
      doc.text(`تاريخ الاستحقاق: ${formatDate(bill.dueDate)}`, pageWidth - 15, y, { align: 'right' })
      y += 7
      doc.text(`حالة الفاتورة: ${bill.status}`, pageWidth - 15, y, { align: 'right' })
      
      // Subscriber Info
      y += 15
      doc.setFont('helvetica', 'bold')
      doc.text('بيانات المشترك:', pageWidth - 15, y, { align: 'right' })
      y += 7
      doc.setFont('helvetica', 'normal')
      doc.text(`الاسم: ${subscriber?.name || ''}`, pageWidth - 15, y, { align: 'right' })
      y += 7
      doc.text(`الهاتف: ${subscriber?.phone || ''}`, pageWidth - 15, y, { align: 'right' })
      y += 7
      doc.text(`العنوان: ${subscriber?.address || ''}`, pageWidth - 15, y, { align: 'right' })
      
      // Amounts
      y += 15
      doc.setFont('helvetica', 'bold')
      doc.text('تفاصيل المبلغ:', pageWidth - 15, y, { align: 'right' })
      y += 10
      doc.setFont('helvetica', 'normal')
      
      // Table
      const tableData = [
        ['الوصف', 'المبلغ'],
        [bill.description || 'فاتورة خدمات', formatCurrency(bill.amount, companyInfo.currency || 'ج.م')],
        ['الخصم', formatCurrency(bill.discount || 0, companyInfo.currency || 'ج.م')],
        ['الضريبة', formatCurrency(bill.tax || 0, companyInfo.currency || 'ج.م')],
        ['الاجمالي', formatCurrency(bill.totalAmount, companyInfo.currency || 'ج.م')]
      ]
      
      tableData.forEach((row, idx) => {
        if (idx === 0) {
          doc.setFont('helvetica', 'bold')
          doc.setFillColor(240, 240, 240)
          doc.rect(15, y - 5, pageWidth - 30, 8, 'F')
        } else {
          doc.setFont('helvetica', 'normal')
        }
        doc.text(row[0], pageWidth - 20, y)
        doc.text(row[1], 20, y)
        y += 8
      })
      
      // Footer
      y += 20
      doc.setFontSize(10)
      doc.text('شكراً لتعاملكم معنا', pageWidth / 2, y, { align: 'center' })
      
      doc.save(`${bill.billNumber}.pdf`)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  return {
    isExporting,
    exportToExcel,
    importFromExcel,
    exportInvoiceToPDF,
    generateInvoicePDF
  }
}
