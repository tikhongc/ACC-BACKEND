/**
 * 文件预览工具函数
 * 用于处理文件预览URL映射和跳转
 */

// 文件预览URL映射 - 从url.md文件中的数据
const FILE_PREVIEW_MAPPING = {
  'TEST_CAD.pdf': 'https://jarvisbim.com/#/viewer?type=pdf&projectName=ACC%20Sync&projectId=68aed2c0abc9fbcf20918dd4&deviceType=desktop&name=TEST_CAD.pdf&fileId=63f57ef5ef43adf2fdc928dc',
  'School.rvt': 'https://jarvisbim.com/#/share_page/b21e1fe0-b2b7-11f0-ba10-fa163e43afe5?projectFileId=68b53689bfb0e78321627a32',
  'DWSS_training_manual_20250328.pdf': 'https://jarvisbim.com/#/viewer?type=pdf&projectName=ACC%20Sync&projectId=68aed2c0abc9fbcf20918dd4&deviceType=desktop&name=DWSS_training_manual_20250328.pdf&fileId=6808c9e92a154dd6c5ceb998',
  'Floor Plan Sample.dwg': 'https://jarvisbim.com/#/share_page/c7883ad2-b2b8-11f0-ba10-fa163e43afe5?projectFileId=68b536f8bfb0e73ba7627a4e',
  'ssss.mp4': 'https://jarvisbim.com/#/share_page/e9c588ec-b2b8-11f0-ba10-fa163e43afe5?projectFileId=68b536f7bfb0e74233627a48',
  '麦当劳结构模型.rvt': 'https://jarvisbim.com/#/share_page/22174839-b2b9-11f0-ba10-fa163e43afe5?projectFileId=68aed3ddabc9fb70a4918eb9',
  'Seven.rvt': 'https://jarvisbim.com/#/share_page/48855f64-b2b9-11f0-ba10-fa163e43afe5?projectFileId=68aed3d1abc9fb4fbe918eb1'
}

/**
 * 根据文件名获取预览URL
 * @param {string} fileName - 文件名
 * @returns {string|null} - 预览URL，如果没有匹配则返回null
 */
export function getPreviewUrl(fileName) {
  if (!fileName) return null
  
  // 直接匹配文件名
  if (FILE_PREVIEW_MAPPING[fileName]) {
    return FILE_PREVIEW_MAPPING[fileName]
  }
  
  // 如果没有直接匹配，尝试匹配不区分大小写
  const lowerFileName = fileName.toLowerCase()
  for (const [key, url] of Object.entries(FILE_PREVIEW_MAPPING)) {
    if (key.toLowerCase() === lowerFileName) {
      return url
    }
  }
  
  return null
}

/**
 * 检查文件是否支持预览
 * @param {string} fileName - 文件名
 * @returns {boolean} - 是否支持预览
 */
export function isPreviewSupported(fileName) {
  return getPreviewUrl(fileName) !== null
}

/**
 * 打开文件预览
 * @param {string} fileName - 文件名
 * @param {Object} options - 选项
 * @param {boolean} options.newTab - 是否在新标签页打开，默认为true
 * @returns {boolean} - 是否成功打开预览
 */
export function openFilePreview(fileName, options = {}) {
  const { newTab = true } = options
  const previewUrl = getPreviewUrl(fileName)
  
  if (!previewUrl) {
    console.warn(`No preview URL found for file: ${fileName}`)
    return false
  }
  
  try {
    if (newTab) {
      // 在新标签页中打开
      window.open(previewUrl, '_blank', 'noopener,noreferrer')
    } else {
      // 在当前页面打开
      window.location.href = previewUrl
    }
    
    console.log(`Opening preview for file: ${fileName}`)
    console.log(`Preview URL: ${previewUrl}`)
    return true
  } catch (error) {
    console.error(`Failed to open preview for file: ${fileName}`, error)
    return false
  }
}

/**
 * 获取所有支持预览的文件列表
 * @returns {string[]} - 支持预览的文件名列表
 */
export function getSupportedPreviewFiles() {
  return Object.keys(FILE_PREVIEW_MAPPING)
}

/**
 * 从文件节点中提取文件名
 * @param {Object} node - 文件节点对象
 * @returns {string|null} - 文件名
 */
export function extractFileName(node) {
  if (!node) return null
  
  // 尝试从不同的属性中获取文件名
  if (node.name) return node.name
  if (node.attributes?.name) return node.attributes.name
  if (node.attributes?.extension?.data?.sourceFileName) {
    return node.attributes.extension.data.sourceFileName
  }
  
  return null
}
