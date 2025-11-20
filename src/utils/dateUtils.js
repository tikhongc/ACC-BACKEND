/**
 * 日期时间工具函数
 * 统一处理时区转换为香港时间（UTC+8）
 */

/**
 * 格式化日期时间为香港时间
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(dateString, options = {}) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    
    // 默认格式化选项（香港时区）
    const defaultOptions = {
      timeZone: 'Asia/Hong_Kong', // 香港时区
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 使用24小时制
    }
    
    const formatOptions = { ...defaultOptions, ...options }
    
    return date.toLocaleString('zh-HK', formatOptions)
  } catch (error) {
    console.warn('日期格式化失败:', error)
    return dateString
  }
}

/**
 * 格式化查询时间，带相对时间间隔显示
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的查询时间字符串
 */
export function formatQueryTime(dateString, options = {}) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    
    // 香港时区格式化选项
    const hkOptions = {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      ...options
    }
    
    const formattedDate = date.toLocaleString('zh-HK', hkOptions)
    const relativeTime = getRelativeTimeHK(dateString)
    
    // 如果有相对时间描述，则组合显示
    if (relativeTime && relativeTime !== '') {
      return `${formattedDate} (${relativeTime})`
    }
    
    return formattedDate
  } catch (error) {
    console.warn('查询时间格式化失败:', error)
    return String(dateString)
  }
}

/**
 * 获取相对时间描述（香港时区）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 相对时间描述
 */
export function getRelativeTimeHK(dateString) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    
    // 转换为香港时间进行计算
    const hkOffset = 8 * 60 * 60 * 1000 // UTC+8
    const dateHK = new Date(date.getTime())
    const nowHK = new Date(now.getTime())
    
    const diffTime = nowHK.getTime() - dateHK.getTime()
    const diffSeconds = Math.floor(diffTime / 1000)
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (Math.abs(diffSeconds) < 30) {
      return '剛剛'
    } else if (Math.abs(diffSeconds) < 60) {
      return diffSeconds > 0 ? `${diffSeconds}秒前` : `${Math.abs(diffSeconds)}秒後`
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `${diffMinutes}分鐘前` : `${Math.abs(diffMinutes)}分鐘後`
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `${diffHours}小時前` : `${Math.abs(diffHours)}小時後`
    } else if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `${diffDays}天前` : `${Math.abs(diffDays)}天後`
    } else if (Math.abs(diffDays) < 30) {
      const weeks = Math.floor(Math.abs(diffDays) / 7)
      return diffDays > 0 ? `${weeks}週前` : `${weeks}週後`
    } else {
      const months = Math.floor(Math.abs(diffDays) / 30)
      return diffDays > 0 ? `${months}個月前` : `${months}個月後`
    }
  } catch (error) {
    console.warn('相對時間計算失敗:', error)
    return ''
  }
}

/**
 * 格式化日期（不包含时间）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateString) {
  return formatDateTime(dateString, {
    hour: undefined,
    minute: undefined,
    second: undefined
  })
}

/**
 * 格式化时间（不包含日期）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(dateString) {
  return formatDateTime(dateString, {
    year: undefined,
    month: undefined,
    day: undefined
  })
}

/**
 * 获取相对时间描述（如：2小时前、3天后等）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(dateString) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    
    // 转换为香港时间进行计算
    const hkOffset = 8 * 60 * 60 * 1000 // UTC+8
    const dateBeijing = new Date(date.getTime() + hkOffset)
    const nowBeijing = new Date(now.getTime() + hkOffset)
    
    const diffTime = nowBeijing.getTime() - dateBeijing.getTime()
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (Math.abs(diffMinutes) < 1) {
      return '刚刚'
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `${diffMinutes}分钟前` : `${Math.abs(diffMinutes)}分钟后`
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `${diffHours}小时前` : `${Math.abs(diffHours)}小时后`
    } else if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `${diffDays}天前` : `${Math.abs(diffDays)}天后`
    } else if (Math.abs(diffDays) < 30) {
      const weeks = Math.floor(Math.abs(diffDays) / 7)
      return diffDays > 0 ? `${weeks}周前` : `${weeks}周后`
    } else {
      const months = Math.floor(Math.abs(diffDays) / 30)
      return diffDays > 0 ? `${months}个月前` : `${months}个月后`
    }
  } catch (error) {
    console.warn('相对时间计算失败:', error)
    return ''
  }
}

/**
 * 格式化到期日期，带状态提示
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {Object} 包含格式化日期和状态的对象
 */
export function formatDueDate(dateString) {
  if (!dateString || dateString === 'N/A') {
    return { text: 'N/A', type: 'info', status: '' }
  }
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    
    // 转换为香港时间进行计算
    const hkOffset = 8 * 60 * 60 * 1000 // UTC+8
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // 格式化显示文本
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    let text, type, status
    
    if (daysDiff === 0) {
      text = `今天 ${hours}:${minutes}`
      type = 'warning'
      status = '今日到期'
    } else if (daysDiff === 1) {
      text = `明天 ${hours}:${minutes}`
      type = 'warning'
      status = '明日到期'
    } else if (daysDiff === -1) {
      text = `昨天 ${hours}:${minutes}`
      type = 'danger'
      status = '昨日过期'
    } else if (daysDiff > 1 && daysDiff <= 7) {
      text = `${daysDiff}天后 ${hours}:${minutes}`
      type = 'primary'
      status = `${daysDiff}天后`
    } else if (daysDiff < -1 && daysDiff >= -7) {
      text = `${Math.abs(daysDiff)}天前 ${hours}:${minutes}`
      type = 'danger'
      status = `${Math.abs(daysDiff)}天前过期`
    } else if (daysDiff > 7) {
      text = `${month}/${day} ${hours}:${minutes}`
      type = 'success'
      status = '时间充裕'
    } else {
      text = `${month}/${day} ${hours}:${minutes}`
      type = 'danger'
      status = '已过期'
    }
    
    return { text, type, status }
  } catch (error) {
    console.warn('到期日期格式化失败:', error)
    return { text: dateString, type: 'info', status: '' }
  }
}

/**
 * 检查日期是否为今天（香港时间）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {boolean} 是否为今天
 */
export function isToday(dateString) {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    const today = new Date()
    
    // 转换为香港时间进行比较
    const hkOffset = 8 * 60 * 60 * 1000
    const dateBeijing = new Date(date.getTime() + hkOffset)
    const todayBeijing = new Date(today.getTime() + hkOffset)
    
    return dateBeijing.toDateString() === todayBeijing.toDateString()
  } catch (error) {
    return false
  }
}

/**
 * 检查日期是否已过期（香港时间）
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {boolean} 是否已过期
 */
export function isOverdue(dateString) {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    
    // 转换为香港时间进行比较
    const hkOffset = 8 * 60 * 60 * 1000
    const dateBeijing = new Date(date.getTime() + hkOffset)
    const nowBeijing = new Date(now.getTime() + hkOffset)
    
    return dateBeijing < nowBeijing
  } catch (error) {
    return false
  }
}

// 默认导出所有函数
export default {
  formatDateTime,
  formatDate,
  formatTime,
  getRelativeTime,
  getRelativeTimeHK,
  formatQueryTime,
  formatDueDate,
  isToday,
  isOverdue
}
