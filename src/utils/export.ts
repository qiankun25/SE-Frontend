/**
 * 下载文件
 * @param blob 文件Blob对象
 * @param filename 文件名
 */
export const downloadFile = (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("下载文件失败:", error);
    return false;
  }
};

/**
 * 生成导出文件名
 * @param prefix 文件名前缀
 * @param format 文件格式
 */
export const generateFilename = (
  prefix: string,
  format: string = "xlsx"
): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, "");
  return `${prefix}_${timestamp}.${format}`;
};
