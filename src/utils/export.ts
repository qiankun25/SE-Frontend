import * as XLSX from 'xlsx'

/**
 * 导出数据到Excel文件
 * @param data 要导出的数据数组
 * @param headers 表头数组
 * @param fileName 文件名
 */
export const exportToExcel = (data: any[], headers: string[], fileName: string) => {
    try {
        // 创建工作簿
        const wb = XLSX.utils.book_new()
        
        // 准备数据
        const exportData = data.map(item => {
            const row: Record<string, any> = {}
            headers.forEach((header, index) => {
                row[header] = item[header]
            })
            return row
        })

        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(exportData)

        // 设置列宽
        const colWidths = headers.map(header => ({
            wch: Math.max(header.length * 2, 10) // 根据内容设置列宽
        }))
        ws['!cols'] = colWidths

        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

        // 生成文件名
        const fullFileName = `${fileName}_${new Date().toLocaleDateString()}.xlsx`

        // 导出文件
        XLSX.writeFile(wb, fullFileName)

        return true
    } catch (error) {
        console.error('导出Excel失败:', error)
        return false
    }
}