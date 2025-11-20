export default {
  // 通用
  common: {
    confirm: '确认',
    cancel: 'cancel',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    filter: '筛选',
    refresh: '刷新',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
    yes: '是',
    no: '否',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    submit: '提交',
    reset: '重置',
    clear: '清空',
    select: '选择',
    selectAll: '全选',
    deselect: 'cancel选择',
    export: '导出',
    import: '导入',
    download: '下载',
    upload: '上传',
    copy: '复制',
    paste: '粘贴',
    cut: '剪切',
    undo: '撤销',
    redo: '重做',
    view: '查看',
    details: '详情',
    settings: '设置',
    help: '帮助',
    about: '关于',
    logout: '退出登录',
    login: '登录',
    register: '注册',
    profile: '个人资料',
    account: '账户',
    dashboard: '仪表板',
    home: '首页',
    menu: '菜单',
    more: '更多',
    less: '收起',
    etc: '等',
    expand: '展开',
    collapse: '折叠',
    fullscreen: '全屏',
    minimize: '最小化',
    maximize: '最大化',
    language: '语言',
    theme: '主题',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    mode: '模式',
    open: '打开',
    examples: '示例',
    title: '标题',
    items: '项',
    unknown: '未知',
    notSet: '未设置',
    retry: '重试',
    enabled: '已启用',
    disabled: '已禁用',
    action: '操作',
    operations: '操作',
    fileName: '文件名',
    fileType: '文件类型',
    fileSize: '文件大小',
    uploader: '上传者',
    uploadTime: '上传时间',
    actions: '操作'
  },

  // 导航菜单
  nav: {
    home: '首页',
    accountInfo: '账户信息',
    projectInfo: '项目信息',
    formsData: '表单数据',
    formsTemplates: '表单模板',
    dataConnectorSync: '数据连接器同步',
    approvalWorkflows: '审批工作流',
    reviews: '审核数据',
    issuesData: '议题数据',
    systemStatus: '系统状态'
  },

  // 首页
  home: {
    title: 'ACC 数据同步后台',
    description: 'Autodesk Construction Cloud 数据同步管理平台',
    formsApi: 'Forms API',
    formsApiDesc: '表单数据管理',
    coreFeatures: '核心功能',
    projectFormsData: '项目表单数据',
    formsTemplateManagement: '表单模板管理',
    dataExport: '数据导出',
    formsJson: '表单JSON',
    templateJson: '模板JSON',
    dataConnectorApi: 'Data Connector API',
    dataConnectorDesc: '数据连接器管理',
    syncManagement: '同步管理',
    dataConnectorSync: '数据连接器同步',
    reviewWorkflowApi: 'Review Workflow API',
    reviewWorkflowDesc: '审批工作流管理',
    workflowManagement: '工作流管理',
    approvalWorkflows: '审批工作流',
    reviewsApi: 'Reviews API',
    reviewsApiDesc: '审核数据管理',
    reviewManagement: '审核管理',
    reviewsData: '审核数据',
    authApi: 'Auth API',
    authApiDesc: '认证与授权管理',
    authManagement: '认证管理',
    accountInfo: '账户信息',
    projectInfo: '项目信息',
    systemStatus: '系统状态',
    reviewsJson: '评审JSON',
    workflowJson: '工作流JSON',
    rfisApi: 'RFIs API',
    rfisApiDesc: 'RFI 數據管理',
    rfiManagement: 'RFI 管理',
    rfisDataAndStatistics: 'RFIs 數據與統計分析',
    dataStatisticsExport: '數據導出',
    rfisJson: 'RFIs JSON',
    statisticsJson: '統計分析 JSON',
    issuesApi: 'Issues API',
    issuesApiDesc: '問題與缺陷管理',
    issuesManagement: 'Issues 管理',
    issuesData: 'Issues 數據',
    autospecsPackagesApi: 'Autospecs + Packages API',
    autospecsPackagesApiDesc: '規範書送審記錄與文件包管理',
    autospecsPackagesManagement: 'Autospecs + Packages 管理',
    autospecsPackagesData: 'Autospecs + Packages 數據',
    autospecsJson: 'Autospecs JSON',
    packagesJson: 'Packages JSON',
    submittalApi: 'Submittal API',
    submittalApiDesc: '送審項目管理與審核流程',
    submittalManagementSystem: '送審管理系統',
    enterSubmittalManagement: '進入 Submittal 管理',
    fileDownloadManagement: '文件下载管理',
    downloadConfiguration: '下载配置',
    downloadConfig: '下载配置',
    configureDownloadTasks: '配置下载任务',
    viewDownloadTasks: '查看下载任务',
    quickDownload: '快速下载',
    projectFileDownload: '项目文件下载',
    systemManagement: '系统管理',
    systemFunctions: '系统功能',
    databaseSyncApi: '数据库同步API',
    databaseSyncDesc: '文件数据库同步管理',
    fileSyncFeatures: '文件同步功能',
    smartSync: '智能同步',
    fullSync: '全量同步',
    incrementalSync: '增量同步',
    selectSyncMethod: '选择同步方式',
    syncMethodTitle: '同步方式选择',
    syncMethodDescription: '项目 "{projectName}" 已经同步过，请选择同步方式：',
    fullSyncDescription: '完整同步所有文件和文件夹数据，适用于首次同步或需要完整更新时',
    incrementalSyncDescription: '仅同步自上次同步以来发生变化的数据，速度更快',
    dataQueryFeatures: '数据查询功能',
    syncStatus: '同步状态',
    databaseHealth: '数据库健康检查',
    projectManagement: '项目管理',
    projectBrowse: '项目浏览',
    fileBrowser: '文件浏览器',
    userManagement: '用户管理',
    dataDownload: '数据下载',
    downloadFilesJson: '下载文件资料JSON',
    downloadUsersJson: '下载用户资料JSON',
    apiResponse: 'API响应',
    clearResponse: '清除',
    systemRunning: '系统运行正常',
    systemCheckFailed: '系统检查失败',
    callingApi: '正在调用 {endpoint}...',
    apiCallSuccess: 'API调用成功',
    apiCallFailed: 'API调用失败: {error}',
    downloading: '正在下载 {endpoint}...',
    downloadSuccess: '文件下载成功',
    downloadFailed: '下载失败: {error}',
    projectSelected: '已选择项目: {name}',
    noProjectSelected: '未选择项目',
    preparingDownloadConfig: '正在准备下载配置页面 (项目: {name})...',
    redirectingToDownloadConfig: '正在跳转到下载配置页面...',
    redirectFailed: '跳转失败: {error}',
    callingApiWithProject: '正在调用 {endpoint} (项目: {name})...',
    downloadingWithProject: '正在下载 {endpoint} (项目: {name})...',
    fileDownloadSuccessWithName: '文件下载成功: {filename}',
    openBackupCDE: '打开CDE备份平台',
    selectOpenMethod: '请选择打开CDE备份平台的方式',
    openMethodTitle: '打开方式',
    openInCurrentPage: '当前页面打开',
    openInNewTab: '新标签页打开',
    openingBackupCDE: '正在新标签页打开CDE备份平台...',
    endpoint: '端点',
    status: '状态',
    responseTime: '响应时间',
    project: '项目',
    errorEndpoint: '错误端点',
    errorStatus: '错误状态',
    errorMessage: '错误信息',
    time: '时间',
    networkError: 'Network Error',
    notAvailable: 'N/A',
    unknown: '未知'
  },

  // 项目选择器
  projectSelector: {
    title: '选择项目',
    refreshProjects: '刷新项目',
    loading: '正在获取项目列表...',
    error: '获取项目失败',
    retry: '重试',
    totalProjects: '总项目数',
    activeProjects: '活跃项目',
    cacheTime: '缓存时间',
    searchPlaceholder: '搜索项目名称...',
    statusFilter: '状态筛选',
    allStatus: '全部状态',
    active: '活跃',
    inactive: '非活跃',
    projectName: '项目名称',
    projectId: '项目ID',
    status: '状态',
    permissions: '权限范围',
    basicAccess: '基础访问',
    standardAccess: '标准项目访问权限',
    selectedCount: '已选择 {count} 个项目',
    multipleSelectTip: '可选择多个项目',
    singleSelectTip: '请选择一个项目',
    confirmSelection: '确认选择 ({count})',
    selectAtLeastOne: '请选择至少一个项目',
    projectType: '项目类型',
    projectTypeLabel: '项目类型: {type}',
    suspended: '暂停',
    archived: '已归档',
    unknown: '未知',
    fetchingProjects: '项目列表正在获取中，跳过重复请求',
    loadFromCache: '从 account-info 缓存加载项目列表: {count} 个项目',
    loadCacheFailed: '加载缓存项目列表失败',
    startFetchingProjects: '开始获取项目列表（使用 account-info API）...',
    fetchSuccess: '项目列表获取成功: {count} 个项目',
    fetchFailed: '获取项目列表失败',
    fetchError: '获取项目列表失败: {error}'
  },

  // 状态标签
  status: {
    title: '状态',
    active: '活跃',
    inactive: '非活跃',
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已cancel',
    expired: '已过期',
    warning: '警告',
    error: '错误',
    success: '成功',
    info: '信息',
    unknown: '未知',
    online: '在线',
    offline: '离线',
    connected: '已连接',
    disconnected: '已断开',
    syncing: '同步中',
    synced: '已同步',
    archived: '已归档'
  },

  // 认证相关
  auth: {
    login: '登录',
    logout: '退出登录',
    loginSuccess: '登录成功',
    logoutSuccess: '退出成功',
    authRequired: '需要登录',
    authFailed: '认证失败',
    tokenExpired: 'Token已过期',
    refreshing: '正在刷新认证...',
    refreshSuccess: '认证刷新成功',
    refreshFailed: '认证刷新失败',
    unauthorized: '未授权访问',
    forbidden: '访问被禁止'
  },

  // 表单相关
  form: {
    required: '此字段为必填项',
    invalid: '格式不正确',
    tooShort: '内容过短',
    tooLong: '内容过长',
    emailInvalid: '邮箱格式不正确',
    phoneInvalid: '手机号格式不正确',
    urlInvalid: 'URL格式不正确',
    numberInvalid: '请输入有效数字',
    dateInvalid: '日期格式不正确',
    timeInvalid: '时间格式不正确',
    passwordWeak: '密码强度太弱',
    passwordMismatch: '密码不匹配',
    fileTooBig: '文件过大',
    fileTypeInvalid: '文件类型不支持',
    uploadFailed: '上传失败',
    uploadSuccess: '上传成功'
  },

  // 数据表格
  table: {
    noData: '暂无数据',
    loading: '数据加载中...',
    total: '共 {total} 条',
    page: '第 {current} 页，共 {total} 页',
    itemsPerPage: '每页显示',
    items: '条',
    sortAsc: '升序',
    sortDesc: '降序',
    filter: '筛选',
    export: '导出',
    refresh: '刷新数据',
    selectAll: '全选',
    deselectAll: 'cancel全选',
    selectedItems: '已选择 {count} 项',
    actions: '操作'
  },

  // 消息提示
  message: {
    title: '消息',
    saveSuccess: '保存成功',
    saveFailed: '保存失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    updateSuccess: '更新成功',
    updateFailed: '更新失败',
    createSuccess: '创建成功',
    createFailed: '创建失败',
    loadSuccess: '加载成功',
    loadFailed: '加载失败',
    networkError: '网络连接错误',
    serverError: '服务器错误',
    unknownError: '未知错误',
    operationSuccess: '操作成功',
    operationFailed: '操作失败',
    confirmDelete: '确认删除此项？',
    confirmAction: '确认执行此操作？',
    unsavedChanges: '有未保存的更改，确认离开？'
  },

  // Token状态
  tokenStatus: {
    valid: 'Token有效',
    expired: 'Token已过期',
    refreshing: '正在刷新Token',
    refreshed: 'Token已刷新',
    invalid: 'Token无效',
    error: 'Token错误'
  },

  // 系统状态
  systemStatus: {
    title: '系统状态',
    healthy: '系统正常',
    warning: '系统警告',
    error: '系统错误',
    maintenance: '维护中',
    checking: '检查中...',
    lastCheck: '最后检查时间',
    nextCheck: '下次检查时间',
    uptime: '运行时间',
    version: '系统版本',
    environment: '运行环境'
  },

  // 语言切换
  languageSwitcher: {
    title: '语言切换',
    current: '当前语言',
    switchTo: '切换到',
    chinese: '中文',
    english: 'English',
    switchSuccess: '语言切换成功',
    switchFailed: '语言切换失败'
  },

  // 全局监控
  monitoring: {
    title: '全局监控',
    overview: '概览',
    details: '详情',
    metrics: '指标',
    alerts: '告警',
    logs: '日志',
    performance: '性能',
    availability: '可用性',
    latency: '延迟',
    throughput: '吞吐量',
    errorRate: '错误率',
    lastUpdate: '最后更新',
    autoRefresh: '自动刷新',
    refreshInterval: '刷新间隔',
    realtime: '实时',
    historical: '历史'
  },

  // 数据连接器
  dataConnector: {
    title: '数据连接器',
    sync: '同步',
    syncAll: '全量同步',
    syncIncremental: '增量同步',
    syncStatus: '同步状态',
    lastSync: '最后同步时间',
    nextSync: '下次同步时间',
    syncSuccess: '同步成功',
    syncFailed: '同步失败',
    syncInProgress: '同步进行中',
    connection: '连接',
    connectionStatus: '连接状态',
    testConnection: '测试连接',
    connectionSuccess: '连接成功',
    connectionFailed: '连接失败',
    configuration: '配置',
    settings: '设置',
    advanced: '高级设置'
  },

  // 面包屑导航
  breadcrumb: {
    home: '首页',
    systemManagement: '系统管理',
    accountAndProject: '账户与项目',
    formsApi: 'Forms API',
    projectFormsData: '项目表单数据',
    formsTemplates: '表单模板',
    apiTest: 'API测试',
    dataConnectorApi: 'Data Connector API',
    dataSync: '数据同步',
    reviewsApi: 'Reviews API',
    projectReviewsData: '项目评审数据',
    approvalWorkflows: '审批工作流',
    systemStatus: '系统状态',
    authSuccess: '认证成功',
    unknownPage: '未知页面'
  },

  // Forms 表单
  forms: {
    title: '项目表单数据中心',
    description: '查看和管理 Autodesk Construction Cloud 项目中的所有表单数据',
    realTimeData: '实时数据',
    loading: '正在获取表单数据',
    loadingText: '请稍候，正在从服务器获取最新的表单数据...',
    error: '获取表单数据失败',
    successTitle: '数据获取成功！',
    successDescription: '成功获取 {count} 个表单数据',
    lastUpdated: '最后更新时间: {time}',
    queryTitle: '表单数据查询',
    queryDescription: '获取 isBIM JARVIS 2025 Dev 项目的所有表单数据',
    apiEndpoint: 'API端点',
    resultCount: '结果数量',
    formUnit: '个表单',
    tableTitle: '表单详细信息',
    tableDescription: '展开每一行查看表单的详细内容和工作记录',
    formDetails: '表单详情 - {name}',
    formDetailsTitle: '表单详情',
    basicInfo: 'basicInfo',
    formId: '表单 ID',
    formName: '表单名称',
    number: '序号',
    tableName: '表单名称',
    formStatus: '状态',
    formDate: '表单日期',
    createTime: '创建时间',
    updateTime: '更新时间',
    creator: '创建者',
    updater: '更新者',
    workRecords: '工作记录',
    operations: '操作',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    worklog: '日志: {count}',
    materials: '材料: {count}',
    equipment: '设备: {count}',
    worklogRecords: '工作日志记录',
    materialsRecords: '材料记录',
    equipmentRecords: '设备记录',
    zeroItems: '0条',
    rawData: '原始数据',
    formRawData: 'Form Raw Data',
    viewDetails: '查看详情',
    exportJson: '导出 JSON',
    exportData: '导出数据',
    refreshData: '刷新数据',
    returnToList: '返回首页',
    refresh: '刷新数据',
    cancel: 'cancel',
    noData: '暂无数据',
    copy: '复制',
    collapse: '收起',
    expandJson: '展开 JSON',
    
    // 表单详情对话框
    dialog: {
      close: '关闭',
      exportFormData: '导出表单数据'
    },
    
    // 工作流时间线
    workflowTimeline: '工作流时间线',
    formCreated: '表单创建',
    formUpdated: '表单更新',
    currentStatus: '当前状态',
    workflowInfo: '工作流信息',
    lastUpdateTime: '最后更新时间',
    
    // 权限和审批信息
    permissionsAndApprovalInfo: '权限和审批信息',
    assignee: '指派给',
    reviewer: '审核者',
    approver: '审批者',
    signatureStatus: '签名状态',
    signed: '已签名',
    unsigned: '未签名',
    permissionDetails: '权限详情',
    unassigned: '未分配',
    notSet: '未设置',
    
    // 工作记录统计
    workRecordStatistics: '工作记录统计',
    worklogEntries: '工作日志条目',
    materialEntries: '材料记录条目',
    equipmentEntries: '设备记录条目',
    
    // 折叠面板标题
    worklogRecordsCount: '工作日志记录 ({count})',
    materialRecordsCount: '材料记录 ({count})',
    equipmentRecordsCount: '设备记录 ({count})',
    otherFormFields: '其他表单字段',
    
    // 查询字段
    worklogRecords: '工作日志',
    materialRecords: '材料记录',
    equipmentRecords: '设备记录',
    worklogCount: '{count}条',
    materialCount: '{count}条',
    equipmentCount: '{count}条',
    
    // 按钮和操作
    downloadPdf: '下载PDF',
    exportFormData: '导出表单数据',
    exportSuccess: 'JSON数据导出成功',
    exportError: '导出失败: {message}',
    loadingCancelled: '加载已cancel',
    
    // 错误信息
    errors: {
      noProjectSelected: '未选择项目，无法获取表单数据',
      requestTimeout: '请求超时，请检查网络连接或稍后重试',
      noAccessToken: '未找到 Access Token，请先进行认证',
      insufficientPermissions: '权限不足，请检查账户权限设置',
      apiNotFound: 'API 端点不存在，请检查服务器配置',
      serverError: '服务器内部错误，请稍后重试或联系管理员',
      fetchError: '获取表单数据时发生错误: {message}'
    },
    
    // 表格列
    columns: {
      trade: '工种',
      headcount: '人数',
      workHours: '工时',
      description: '描述',
      materialName: '材料名称',
      quantity: '数量',
      unit: '单位',
      equipmentName: '设备名称',
      usageHours: '使用小时',
      operator: '操作员'
    },
    
    // 错误建议
    errorSuggestions: {
      checkNetwork: '检查网络连接是否正常',
      confirmAuth: '确认已完成 Autodesk 认证',
      verifyPermissions: '验证项目权限设置',
      contactAdmin: '联系管理员检查 API 配置'
    },
    
    // 错误按钮
    errorButtons: {
      reauth: '重新认证',
      retry: '重试'
    },
    
    // 消息提示
    messages: {
      noProjectSelected: '未选择项目，无法获取表单数据',
      loadingStart: '开始获取表单数据...',
      loadingProject: '项目',
      apiResponse: 'API响应',
      dataLoadSuccess: '表单数据获取成功',
      responseNotJson: '响应不是JSON格式，可能需要重新认证',
      needReauth: '需要重新认证',
      loadFailed: '获取表单数据失败',
      requestTimeout: '请求超时，请检查网络连接或稍后重试',
      noAccessToken: '未找到 Access Token，请先进行认证',
      insufficientPermissions: '权限不足，请检查账户权限设置',
      apiNotFound: 'API 端点不存在，请检查服务器配置',
      serverError: '服务器内部错误，请稍后重试或联系管理员',
      loadingComplete: '表单数据获取完成，loading状态',
      exportJsonSuccess: 'JSON数据导出成功',
      exportFailed: '导出失败',
      loadingCancelled: '加载已cancel',
      userCancelledLoading: '用户cancel了加载操作',
      downloadingPdf: '正在下载 PDF...',
      pdfLinkOpened: 'PDF 链接已打开',
      pdfDownloadFailed: '下载 PDF 失败',
      formDataExportSuccess: '表单数据导出成功',
      exportFormDataFailed: '导出表单数据失败',
      projectSelected: '已选择项目: {name}',
      entityCacheInitStart: '🏢 FormsData: 开始初始化实体缓存...',
      entityCacheInitSuccess: '✅ FormsData: 实体缓存初始化完成',
      entityCacheInitFailed: '❌ FormsData: 实体缓存初始化失败',
      getCreatorDisplayName: '🔍 FormsData获取创建者显示名称',
      creatorMappingResult: '📝 FormsData创建者映射结果',
      originalId: '原始ID',
      mappingResult: '映射结果',
      mappingSuccess: '是否成功'
    },
    
    // 查询字段
    queryFields: {
      worklogLabel: '工作日志',
      worklogValue: '{count}条',
      materialsLabel: '材料记录',
      materialsValue: '{count}条',
      equipmentLabel: '设备记录',
      equipmentValue: '{count}条',
      pdfAvailableLabel: 'PDF可用',
      pdfAvailableValue: '{count}个'
    },

    // 参照关系
    references: {
      loadSuccess: '成功加载 {count} 个参照关系',
      loadFailed: '参照关系加载失败',
      downloadSuccess: '参照文档 "{name}" 下载成功',
      downloadFailed: '参照文档下载失败'
    }
  },

  // 表单详情
  formDetail: {
    tabs: {
      basic: 'basicInfo',
      workRecords: '工作记录',
      references: '参照关系',
      weather: '天气信息',
      pdfAndSignature: 'PDF与签名',
      rawData: '原始数据'
    },
    basic: {
      title: '表单basicInfo',
      formId: '表单ID',
      formNum: '表单编号',
      projectId: '项目ID',
      formDate: '表单日期',
      attributes: '基本属性',
      status: '状态',
      creator: '创建者',
      createTime: '创建时间',
      updateTime: '更新时间',
      assignee: '指派给',
      assigneeType: '指派类型',
      location: '位置信息',
      locationId: '位置ID',
      template: '表单模板',
      templateId: '模板ID',
      templateName: '模板名称',
      templateType: '模板类型',
      templateStatus: '模板状态',
      notes: '备注信息',
      description: '描述',
      notes: '备注'
    },
    workRecords: {
      statistics: '工作记录统计',
      worklogEntries: '工作日志条目',
      materialEntries: '材料记录条目',
      equipmentEntries: '设备记录条目',
      worklogRecordsCount: '工作日志记录 ({count})',
      materialRecordsCount: '材料记录 ({count})',
      equipmentRecordsCount: '设备记录 ({count})',
      customFields: '自定义字段',
      trade: '工种',
      headcount: '人数',
      hours: '工时',
      description: '描述',
      item: '项目',
      quantity: '数量',
      unit: '单位',
      fieldName: '字段名称',
      fieldValue: '字段值',
      fieldType: '字段类型'
    },
    weather: {
      title: '天气信息',
      summary: '天气概况',
      provider: '数据提供商',
      temperatureRange: '温度范围',
      humidity: '湿度',
      windSpeed: '风速',
      windGust: '阵风',
      precipitation: '降水量',
      windBearing: '风向',
      hourlyWeather: '每小时天气',
      hour: '时间',
      temperature: '温度'
    },
    pdf: {
      title: 'PDF信息',
      url: 'PDF地址',
      viewPdf: '查看PDF',
      pdfValues: 'PDF字段值',
      fieldName: '字段名称',
      fieldValue: '字段值'
    },
    signature: {
      title: '签名信息',
      lastSubmitter: '最后提交者',
      signatureStatus: '签名状态',
      signed: '已签名',
      preview: '签名预览',
      unknown: '未知'
    },
    rawData: {
      title: '原始数据',
      description: '表单的完整JSON数据，包含所有字段和属性信息'
    }
  },

  // Forms Templates 表单模板
  formsTemplates: {
    title: '表单模板管理',
    description: '查看和管理项目中的表单模板，支持分页、筛选和工作流分析',
    templateManagement: '模板管理',
    loading: '正在获取模板数据',
    loadingText: '请稍候，正在从服务器获取最新的表单模板数据...',
    error: '获取模板数据失败',
    successTitle: '数据获取成功！',
    successDescription: '成功获取 {count} 个表单模板',
    queryTime: '查询时间: {time}',
    queryInfo: '查询信息',
    queryControl: '查询控制',
    perPage: '每页显示:',
    sortBy: '排序:',
    newestFirst: '最新优先',
    oldestFirst: '最旧优先',
    dateFilter: '更新时间筛选:',
    startTime: '开始时间',
    endTime: '结束时间',
    applyFilter: '应用筛选',
    reset: '重置',
    templateList: '📋 表单模板列表',
    templateListDescription: '项目中的所有表单模板，包含工作流和权限信息',
    templateUnit: '个模板',
    templateName: '模板名称',
    templateId: '模板 ID',
    templateStatus: '模板状态',
    updatedAt: '更新时间',
    workflow: '工作流',
    hasWorkflow: '已配置',
    noWorkflow: '未配置',
    viewTemplate: '查看模板',
    viewWorkflow: '查看工作流',
    exportJson: '导出 JSON',
    
    // 模板详情对话框
    dialog: {
      templateDetails: '📋 模板详情 - {name}',
      templateDetailsTitle: '模板详情',
      close: '关闭',
      exportTemplateData: '导出模板数据'
    },
    
    // basicInfo
    basicInfo: {
      title: '📝 basicInfo',
      templateName: '模板名称',
      status: '状态',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      createdBy: '创建者',
      templateId: '模板 ID'
    },
    
    // 原始数据
    rawData: {
      title: '🔍 原始数据',
      completeTemplateData: '完整模板数据'
    },
    
    // 更新信息
    updateInfo: {
      updateTime: '更新时间',
      timeAgo: '时间前',
      daysAgo: '{days}天前',
      hoursAgo: '{hours}小时前',
      minutesAgo: '{minutes}分钟前',
      justNow: '刚刚'
    },
    
    // 工作流信息
    workflowInfo: {
      hasWorkflow: '有工作流',
      noWorkflow: '无工作流',
      workflowAvailable: '可用',
      workflowUnavailable: '不可用',
      unknown: 'N/A'
    },
    
    // 分页控制
    pagination: {
      currentPage: '当前页码',
      totalRecords: '总记录数',
      containsWorkflow: '包含工作流',
      workflowCount: '{count}个'
    },
    
    // 查询操作
    queryActions: {
      refreshQuery: '刷新查询',
      resetParams: '重置参数',
      copyApi: '复制API',
      apiEndpointCopied: 'API端点已复制到剪贴板',
      copyFailed: '复制失败'
    },
    
    // 错误建议
    errorSuggestions: {
      checkNetwork: '检查网络连接是否正常',
      confirmAuth: '确认已完成 Autodesk 认证',
      verifyPermissions: '验证项目权限设置',
      contactAdmin: '联系管理员检查 API 配置'
    },
    
    // 错误按钮
    errorButtons: {
      reauth: '重新认证',
      retry: '重试'
    },
    
    // 消息提示
    messages: {
      loadingStart: '开始获取模板数据...',
      apiResponse: 'API响应',
      dataLoadSuccess: '模板数据获取成功',
      responseNotJson: '响应不是JSON格式，可能需要重新认证',
      needReauth: '需要重新认证',
      loadFailed: '获取模板数据失败',
      requestTimeout: '请求超时，请检查网络连接或稍后重试',
      noAccessToken: '未找到 Access Token，请先进行认证',
      insufficientPermissions: '权限不足，请检查账户权限设置',
      apiNotFound: 'API 端点不存在，请检查服务器配置',
      serverError: '服务器内部错误，请稍后重试或联系管理员',
      loadingComplete: '模板数据获取完成，loading状态',
      templateDataExportSuccess: '模板数据导出成功',
      exportTemplateDataFailed: '导出模板数据失败',
      exportFailed: '导出失败',
      dataExportSuccess: '数据导出成功',
      loadingCancelled: '加载已cancel',
      userCancelledLoading: '用户cancel了加载操作',
      entityCacheInitStart: '🏢 FormsTemplates: 开始初始化实体缓存...',
      entityCacheInitSuccess: '✅ FormsTemplates: 实体缓存初始化完成',
      entityCacheInitFailed: '❌ FormsTemplates: 实体缓存初始化失败',
      getCreatorDisplayName: '🔍 FormsTemplates获取创建者显示名称',
      creatorMappingResult: '📝 FormsTemplates创建者映射结果',
      originalId: '原始ID',
      mappingResult: '映射结果',
      mappingSuccess: '是否成功',
      projectInfoFromUrl: '从 URL 获取项目信息',
      projectInfoFromLocalStorage: '从 localStorage 获取项目信息',
      getProjectInfoFailed: '获取保存的项目信息失败',
      projectInfoNotFound: '未找到项目信息'
    },
    
    // 查询描述
    queryDescription: {
      getTemplateList: '获取表单模板列表',
      filteredByUpdateTime: '，按更新时间筛选',
      perPageItems: '，每页{limit}条',
      sortNewestFirst: '，最新优先排序',
      sortOldestFirst: '，最旧优先排序'
    }
  },

  // 状态标签
  statusTag: {
    success: '成功',
    completed: '已完成',
    active: '活跃',
    approved: '已审批',
    submitted: '已提交',
    available: '可用',
    ready: '就绪',
    running: '运行中',
    warning: '警告',
    pending: '待处理',
    waiting: '等待中',
    draft: '草稿',
    reviewing: '审核中',
    processing: '处理中',
    error: '错误',
    failed: '失败',
    rejected: '已拒绝',
    cancelled: '已cancel',
    expired: '已过期',
    inactive: '非活跃',
    unavailable: '不可用',
    info: '信息',
    unknown: '未知',
    default: '默认',
    archived: '已归档',
    open: '开放',
    closed: '已关闭',
    void: '无效'
  },

  // 文件浏览器
  fileBrowser: {
    title: '文件浏览器',
    description: '浏览和管理项目文件',
    
    // 项目信息
    projectInfo: {
      projectId: '项目ID',
      forceRefresh: '强制刷新',
      downloadFileData: '下载文件数据',
      downloadAllFiles: '下载全部文件',
      userManagement: '用户管理',
      changeProject: '切换项目'
    },

    // 统计信息
    statistics: {
      folders: '文件夹',
      files: '文件',
      totalSize: '总大小',
      projectUsers: '项目用户'
    },

    // 文件树
    fileTree: {
      title: '文件结构',
      multiSelectMode: '多选模式',
      singleSelectMode: '单选模式',
      showPermissions: '显示权限',
      hidePermissions: '隐藏权限',
      detailedView: '详细信息',
      simpleView: '简单视图',
      traversalDepth: '遍历深度',
      traversalDepthTooltip: '设置文件树遍历的最大深度，影响数据加载范围'
    },

    // 批量操作
    batchActions: {
      selectedFiles: '已选择 {count} 个文件',
      totalSize: '总大小: {size}',
      batchDownload: '批量下载',
      clearSelection: '清空选择',
      batchDownloadConfig: '批量下载配置',
      selectedFilesList: '选中的文件 ({count} 个)',
      downloadOptions: '下载选项',
      downloadPath: '下载目录',
      concurrentDownloads: '并发下载数',
      retryCount: '重试次数',
      timeoutSeconds: '超时时间(秒)',
      overwriteExisting: '覆盖已存在文件',
      createFolders: '创建文件夹结构',
      skipErrors: '跳过错误继续下载',
      startBatchDownload: '开始批量下载',
      remove: '移除'
    },

    // 文件夹节点
    folderNode: {
      details: '详情',
      permissions: '权限',
      preview: '预览',
      previewTooltip: '预览此文件（功能开发中）',
      customAttributes: '自定义属性',
      downloadFolder: '下载文件夹',
      downloadFolderTooltip: '下载此文件夹及其所有子文件',
      downloading: '下载中...',
      download: '下载',
      notSupported: '不支持',
      downloadFileTooltip: '点击下载此文件',
      fileTypeNotSupported: '此文件类型暂不支持下载',
      expand: '展开',
      collapse: '收起',
      items: '项',
      expandable: '可展开',
      loadingChildren: '正在加载子文件夹...',
      emptyFolder: '此文件夹为空',
      // 错误消息
      errors: {
        cannotGetProjectId: '无法获取项目ID',
        lazyLoadFailed: '懒加载子节点失败',
        loadPermissionsFailed: '加载权限失败',
        loadFailed: '加载失败',
        cannotGetProjectIdWarning: '无法获取项目ID'
      }
    },

    // 加载状态
    loading: {
      dataSyncing: '数据同步中',
      initializing: '正在初始化...',
      initializingDataStore: '正在初始化数据存储...',
      checkingCache: '检查本地缓存...',
      syncingFileData: '正在同步文件数据，这可能需要30-60秒...',
      processingFileTree: '正在处理文件树结构...',
      loadingUserData: '正在加载用户数据...',
      generatingStats: '正在生成统计数据...',
      dataLoadComplete: '数据加载完成！',
      loadingCancelled: '加载已cancel',
      forceRefreshing: '正在强制刷新数据...',
      progressiveLoading: '正在使用渐进式加载...',
      fastModeActive: '快速模式已激活，基础结构加载完成',
      fullDataLoading: '正在后台加载完整数据...',
      reloadingWithDepth: '正在重新加载数据，遍历深度: {depth}'
    },

    // 消息提示
    messages: {
      dataLoadSuccess: '文件数据加载成功 - 找到 {count} 个顶级文件夹',
      dataLoadFailed: '加载文件数据失败: {error}',
      dataRefreshComplete: '数据刷新完成',
      dataRefreshFailed: '数据刷新失败: {error}',
      dataReloadComplete: '数据重新加载完成',
      dataReloadFailed: '重新加载数据失败: {error}',
      fileDownloadSuccess: '文件下载成功',
      fileDownloadFailed: '下载失败: {error}',
      folderDownloadSuccess: '文件夹 "{name}" 下载任务已创建 ({count} 个文件)',
      folderDownloadFailed: '下载文件夹失败: {error}',
      batchDownloadSuccess: '批量下载任务已创建: {taskId}',
      batchDownloadFailed: '批量下载失败: {error}',
      allFilesDownloadSuccess: '全部文件下载任务已创建: {taskId}',
      allFilesDownloadFailed: '下载全部文件失败: {error}',
      noFilesToDownload: '当前项目中没有可下载的文件',
      confirmDownloadAllFiles: '确定要下载项目中的所有 {count} 个文件吗？总大小约为 {size}',
      confirmDownloadFolder: '确定要下载文件夹 "{name}" 中的所有 {count} 个文件吗？总大小约为 {size}',
      downloadCancelled: '已cancel下载',
      selectFilesFirst: '请先选择要下载的文件',
      selectProjectFirst: '请先选择项目',
      redirectingToUserManagement: '正在跳转到用户管理页面...',
      gettingAllFiles: '正在获取项目中的所有文件，请稍候...',
      gettingFolderFiles: '正在获取文件夹 "{name}" 中的所有文件，请稍候...'
    },

    // 确认对话框
    confirmDialog: {
      downloadAllFilesTitle: '确认下载全部文件',
      downloadFolderTitle: '确认下载文件夹',
      confirmDownload: '确定下载',
      cancel: 'cancel'
    },

    // 调试信息
    debug: {
      title: '调试信息',
      fileDataLoaded: '已加载',
      fileDataNotLoaded: '未加载',
      topFoldersCount: 'top_folders数量',
      statisticsInfo: '统计信息',
      folders: '文件夹',
      files: '文件',
      rawDataStructure: '原始数据结构'
    },

    // 面包屑导航
    breadcrumb: {
      home: '首页',
      projectManagement: '项目管理',
      userManagement: '用户管理',
      fileBrowser: '文件浏览器'
    },

    // 权限详情
    permissionDrawer: {
      title: '权限详情'
    },

    // 下载配置
    downloadConfig: {
      defaultPath: '默认: ACC_BACKUP/assets'
    },

    // 详情抽屉
    detailDrawer: {
      title: '详情',
      defaultTitle: '节点详情',
      noNodeSelected: '未选择节点'
    }
  },

  // 节点详情面板
  nodeDetail: {
    title: '节点详情',
    
    // basicInfo
    basicInfo: {
      folder: '文件夹',
      file: '文件',
      identityInfo: '标识信息',
      nodeId: '节点ID',
      parentId: '父级ID',
      copy: '复制'
    },

    // 文件夹信息
    folderInfo: {
      title: '文件夹信息',
      items: '项',
      objects: '对象',
      createTime: '创建时间',
      modifyTime: '修改时间',
      creator: '创建者',
      modifier: '修改者',
      childCount: '子项数量',
      objectCount: '对象数量',
      customAttributeDefinitions: '自定义属性定义',
      customAttributeTooltip: '此文件夹配置的自定义属性定义，用于该文件夹内的文档',
      noCustomAttributes: '此文件夹没有配置自定义属性定义',
      customAttributesNotLoaded: '点击加载按钮查看自定义属性信息'
    },

    // 文件信息
    fileInfo: {
      title: '文件信息',
      versionHistory: '版本历史',
      relatedWorkflows: '关联工作流',
      relatedIssues: '关联的Issues',
      refresh: '刷新',
      noRelatedIssues: '此文件暂无关联的Issues',
      foundRelatedIssues: '找到 {count} 个关联的Issues',
      viewDetails: '查看详情',
      openInNewTab: '在新标签页中打开Issue详情'
    },

    // 审批状态
    reviewStatus: {
      title: '审批状态',
      approved: 'approved',
      completed: '已完成',
      rejected: '已拒绝',
      cancelled: '已cancel',
      pending: '待审阅',
      reviewing: '审阅中',
      approvedDesc: '该文件已通过所有审阅流程，可以正式使用',
      completedDesc: '该文件的审阅流程已完成',
      rejectedDesc: '该文件在审阅过程中被拒绝，需要修改后重新提交',
      cancelledDesc: '该文件的审阅流程已被cancel',
      pendingDesc: '该文件正在等待审阅人员进行审阅',
      reviewingDesc: '该文件正在审阅过程中'
    },

    // 议题状态
    issueStatus: {
      draft: '草稿',
      open: '开放',
      pending: '待处理',
      inProgress: '进行中',
      inReview: '审核中',
      closed: '已关闭',
      resolved: '已解决',
      rejected: '已拒绝',
      assignedTo: '指派给',
      created: '创建',
      unassigned: '未指派'
    },

    // 关联类型
    relationType: {
      linkedDocument: '关联文档',
      pushpin: '图钉标记',
      attachment: '附件',
      other: '其他关联'
    },

    // 扩展信息
    extensionInfo: {
      title: '扩展信息',
      tooltip: '扩展信息包含文件/文件夹的类型定义、版本信息、支持的操作和命名标准等元数据',
      type: '类型',
      version: '版本',
      schema: 'Schema',
      viewSchemaDefinition: '查看Schema定义',
      extensionData: '扩展数据',
      visibleTypes: '可见类型',
      allowedTypes: '允许类型',
      supportedActions: '支持操作',
      processState: '处理状态',
      extractionState: '提取状态',
      sourceFileName: '源文件名',
      versionLabel: '版本标签',
      viewFullExtensionInfo: '查看完整扩展信息'
    },

    // 完整属性
    fullAttributes: {
      title: '完整属性'
    },

    // 操作按钮
    actions: {
      downloadNodeData: '下载节点数据',
      viewInACC: '在ACC中查看',
      copyInfo: '复制信息',
      loadCustomAttributes: '加载自定义属性',
      refresh: '刷新',
      nodeDataDownloadSuccess: '节点数据下载成功',
      accLinkNotFound: '未找到ACC查看链接',
      copySuccess: '已复制到剪贴板',
      copyFailed: '复制失败'
    },

    // JSON查看器
    jsonViewer: {
      folderMetadata: '文件夹元数据JSON',
      fileMetadata: '文件元数据JSON',
      description: '完整的节点元数据JSON格式，用于调试和分析'
    },

    // 提示信息
    hints: {
      clickToLoadCustomAttributes: '点击加载自定义属性详情'
    },

    // 错误信息
    errors: {
      loadCustomAttributesFailed: '加载自定义属性失败'
    },

    // 消息提示
    messages: {
      projectIdNotFound: '无法获取项目ID',
      versionUrnNotFound: '未找到文件版本URN',
      issuesFound: '找到 {count} 个关联的Issues',
      noRelatedIssues: '此文件暂无关联的Issues',
      getIssuesFailed: '获取关联Issues失败',
      openIssueSuccess: '在新标签页打开议题详情: #{displayId}',
      openIssueFailed: '打开新标签页失败'
    },

    // 议题状态
    issueStatus: {
      draft: '草稿',
      open: '开放',
      pending: '待处理',
      in_progress: '进行中',
      in_review: '审核中',
      closed: '已关闭',
      resolved: '已解决',
      rejected: '已拒绝',
      unknown: '未知',
      unassigned: '未指派'
    },

    // 关联类型
    relationType: {
      linked_document: '关联文档',
      pushpin: '图钉标记',
      attachment: '附件',
      other: '其他关联'
    }
  },

  // 权限详情抽屉
  permissionDetail: {
    title: '权限详情',
    // 节点类型
    nodeType: {
      folder: '文件夹',
      file: '文件'
    },
    
    // 加载状态
    loading: {
      fetchingPermissions: '正在获取权限信息...'
    },

    // 错误状态
    error: {
      fetchFailed: '权限信息获取失败'
    },

    // 权限统计
    statistics: {
      title: '权限统计',
      users: '用户',
      roles: '角色',
      companies: '公司'
    },

    // 用户权限
    users: {
      title: '用户权限 ({count})',
      searchPlaceholder: '搜索用户...',
      permissionActions: '权限操作',
      viewUserDetail: '查看用户详情',
      copyUserInfo: '复制用户信息'
    },

    // 角色权限
    roles: {
      title: '角色权限 ({count})',
      usersWithRole: '拥有此角色的用户 ({count})',
      noUsersWithRole: '暂无用户拥有此角色'
    },

    // 公司权限
    companies: {
      title: '公司权限 ({count})',
      usersInCompany: '此公司的用户 ({count})',
      noUsersInCompany: '暂无此公司的用户'
    },

    // 权限级别
    permissionLevels: {
      level1: '查看',
      level2: '查看/下载',
      level3: '查看/下载/标记',
      level4: '查看/下载/标记/上传',
      level5: '完全编辑',
      level6: '完全控制'
    },

    // 权限操作
    permissionActions: {
      view: '查看',
      download: '下载',
      collaborate: '协作',
      publishMarkup: '标记',
      publish: '上传',
      edit: '编辑',
      control: '控制'
    },

    // 用户状态
    userStatus: {
      active: '活跃',
      pending: '待激活',
      inactive: '非活跃',
      disabled: '禁用'
    },

    // 操作按钮
    actions: {
      retry: '重试',
      exportPermissions: '导出权限数据',
      refreshPermissions: '刷新权限'
    },

    // 消息提示
    messages: {
      fetchUsersFailed: '获取项目用户数据失败',
      viewUserDetail: '查看用户详情: {name}',
      copySuccess: '已复制到剪贴板',
      copyFailed: '复制失败',
      noDataToExport: '没有权限数据可导出',
      exportSuccess: '权限数据导出成功'
    },

    // 无权限数据
    noPermissions: '暂无权限信息'
  },

  // 评审管理
  reviews: {
    // 页面标题和描述
    title: '项目评审管理',
    description: '查看和管理 Autodesk Construction Cloud 项目中的所有评审数据',
    tag: '评审数据',

    // 加载状态
    loading: {
      title: '正在获取评审数据',
      text: '请稍候，正在从服务器获取最新的评审数据...'
    },

    // 错误状态
    error: {
      title: '获取评审数据失败',
      suggestions: [
        '检查网络连接是否正常',
        '确认项目权限是否足够',
        '尝试刷新页面重新加载'
      ]
    },

    // 成功状态
    success: {
      title: '数据获取成功！',
      description: '成功获取 {count} 个项目评审',
      lastUpdated: '最后更新时间: {time}'
    },

    // 查询信息
    queryInfo: {
      title: '项目评审查询',
      description: '获取 isBIM JARVIS 2025 Dev 项目的所有评审数据',
      resultUnit: '个评审'
    },

    // 统计信息
    statistics: {
      totalReviews: '总评审数',
      activeReviews: '进行中',
      completedReviews: '已完成',
      overdueReviews: '已逾期',
      pendingReviews: '待处理'
    },

    // 表格列标题
    table: {
      title: '📋 项目评审列表',
      description: '点击查看详情按钮查看评审的详细信息和参与者',
      name: '评审名称',
      status: '状态',
      dueDate: '截止日期',
      assignee: '指派人',
      progress: '进度',
      actions: '操作',
      sequenceId: '序列ID',
      workflow: '工作流',
      createdDate: '创建日期',
      lastModified: '最后修改',
      createdBy: '创建者',
      nextAction: '下一步操作',
      dueTime: '到期时间',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      archived: '归档状态'
    },

    // 操作按钮
    actions: {
      refresh: '刷新数据',
      export: '导出数据',
      settings: '配置',
      viewDetail: '查看详情',
      editReview: '编辑评审',
      deleteReview: '删除评审',
      assignReviewer: '分配审查员',
      reauth: '重新认证'
    },

    // 状态
    status: {
      draft: '草稿',
      active: '进行中',
      completed: '已完成',
      cancelled: '已cancel',
      overdue: '已逾期',
      pending: '待处理',
      inReview: '审查中',
      approved: 'approved',
      rejected: '已拒绝',
      claimed: '已认领',
      people: '人',
      roles: '个角色',
      companies: '家公司',
      candidateUsers: '👤 候选用户:',
      candidateRoles: '🏷️ 候选角色:',
      candidateCompanies: '🏢 候选公司:',
      noCandidates: '无候选人',
      finishedStatus: '已完成',
      noDeadline: '无到期时间',
      yesterdayOverdue: '昨日过期',
      overdue: '已过期',
      aboutToExpire: '即将到期',
      expiresToday: '今日到期',
      expiresTomorrow: '明日到期',
      expiresDayAfterTomorrow: '后天到期',
      sufficientTime: '充足时间',
      ampleTime: '时间充裕',
      archived: '已归档',
      closed: '已关闭',
      voided: '已作废',
      failed: '已失效',
      rejected: '已拒绝'
    },

    // 消息提示
    messages: {
      loadSuccess: '评审数据加载成功',
      loadFailed: '评审数据加载失败',
      exportSuccess: '评审数据导出成功',
      exportFailed: '评审数据导出失败',
      deleteSuccess: '评审删除成功',
      deleteFailed: '评审删除失败',
      updateSuccess: '评审更新成功',
      updateFailed: '评审更新失败',
      noDataToExport: '没有数据可导出',
      confirmDelete: '确定要删除这个评审吗？',
      projectRequired: '请先选择一个项目',
      loadCancelled: '已cancel数据获取',
      settingsInDevelopment: '配置功能开发中',
      searchInDevelopment: '搜索功能开发中',
      filterInDevelopment: '筛选功能开发中',
      cannotGetRowData: '无法获取行数据',
      cannotGetReviewDetail: '无法获取评审详情数据',
      viewingReview: '正在查看评审: {name}',
      operation: '操作: {action}',
      operationFailed: '操作失败，请重试'
    },

    // 对话框
    dialog: {
      reviewDetail: '评审详情',
      close: '关闭',
      confirm: '确认',
      cancel: 'cancel'
    },

    // 空状态
    empty: {
      noReviews: '暂无评审数据',
      noResults: '没有找到匹配的评审'
    }
  },

  // 评审详情
  reviewDetail: {
    // basicInfo
    basicInfo: {
      title: 'basicInfo',
      name: '评审名称',
      id: '评审ID',
      sequenceId: '序列ID',
      status: '状态',
      dueDate: '截止日期',
      createdDate: '创建日期',
      lastModified: '最后修改',
      assignee: '指派人',
      reviewer: '审查员',
      description: '描述',
      archived: '已归档'
    },

    // 工作流信息
    workflow: {
      title: '工作流信息',
      name: '工作流名称',
      version: '版本',
      steps: '步骤',
      currentStep: '当前步骤',
      progress: '进度',
      chart: '工作流图表',
      history: '历史记录',
      id: '工作流ID',
      currentStepId: '当前步骤ID',
      stepDueDate: '步骤到期时间'
    },

    // 文件版本
    versions: {
      title: '相关文件版本',
      fileName: '文件名',
      version: '版本',
      uploadDate: '上传日期',
      size: '大小',
      status: '状态',
      actions: '操作',
      viewFile: '查看文件',
      downloadFile: '下载文件',
      noVersions: '暂无相关文件版本'
    },

    // 参与者信息
    participants: {
      title: '参与者信息',
      creator: '创建者',
      archiver: '归档者',
      nextActionBy: '下一步操作者',
      currentReviewStatus: '当前审阅状态',
      primaryReviewers: '主要审阅者（必须完成）',
      optionalReviewers: '可选审阅者（候选）',
      candidateUsers: '候选用户',
      candidateRoles: '候选角色',
      candidateCompanies: '候选公司',
      claimedUsers: '已认领用户',
      candidates: '候选者',
      users: '用户',
      roles: '角色',
      companies: '公司'
    },

    // 时间线信息
    timeline: {
      title: '时间线',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      finishedAt: '完成时间',
      archivedAt: '归档时间'
    },

    // Tab标签页
    tabs: {
      workflowChart: '📊 工作流图表',
      fileVersions: '📄 评审文件',
      workflowDetails: '🔄 详细信息'
    },

    // 文件版本
    fileVersions: {
      title: '文件版本列表',
      loading: '正在加载文件版本数据...',
      loadButton: '加载文件版本',
      retryLoad: '重试加载',
      viewReview: '查看评审',
      fileName: '文件名',
      fileType: '文件类型',
      version: '版本',
      finalReviewStatus: '最终审阅状态',
      relatedReview: '相关评审',
      totalFiles: '共 {count} 个文件',
      duplicatesRemoved: '已去重 {count} 个',
      notCompleted: '未完成',
      fileVersionDetail: '文件版本详情 - {name}'
    },

    // 工作流信息
    workflowInfo: {
      title: '工作流进度',
      workflowName: '工作流',
      loading: '正在加载工作流数据...',
      loadButton: '加载关联工作流',
      retryLoad: '重试加载',
      noWorkflow: '此评审未关联工作流',
      workflowSteps: '工作流步骤',
      approvalOptions: '审批选项',
      fileCopy: '文件复制',
      attachedAttributes: '附加属性',
      enabled: '启用',
      disabled: '禁用',
      yes: '有',
      no: '无',
      viewWorkflowProgressData: '📊 查看工作流进度JSON数据',
      viewReviewerAnalysisData: '🎯 查看审阅者分析JSON数据',
      workflowProgressRawData: '工作流进度原始数据',
      reviewerAnalysisData: '审阅者分析数据'
    },

    // 工作流步骤
    workflowSteps: {
      stepTypes: {
        INITIATOR: '发起者',
        REVIEWER: '审核者', 
        APPROVER: '批准者',
        OBSERVER: '观察者'
      },
      stepStatus: {
        completed: '已完成',
        current: '进行中',
        pending: '待处理',
        unknown: '未知',
        approved: 'approved',
        rejected: '已拒绝'
      },
      // 额外的工作流术语
      workflowTerms: {
        allowInitiatorToEdit: '允许发起者编辑',
        minimumReviewers: '最少需要 {count} 个审阅者',
        reviewerAnalysis: '审阅者分析',
        potentialReviewers: '潜在审阅者: {count}',
        multiReviewer: '多审阅者',
        groupReviewAnalysis: '组审阅分析',
        assignmentMode: '分配模式',
        singleUser: '单用户',
        multipleUsers: '多用户'
      },
      assigneeTypes: {
        singleUser: '指定审阅者',
        multipleUsers: '候选审阅者',
        assignee: '负责人',
        reviewers: '审阅者'
      },
      timing: {
        completedAt: '完成于 {time}',
        dueAt: '截止: {time}',
        approximately: '约 {time}',
        notCompleted: '未完成',
        timeUnknown: '时间未知'
      },
      duration: '{days}天期限',
      candidateCount: {
        roles: '{count} 角色',
        companies: '{count} 公司'
      }
    },

    // 审阅模式
    reviewModes: {
      primary_only: '仅主要审阅者',
      optional_only: '仅候选审阅者',
      mixed: '混合模式',
      none: '无审阅者'
    },

    // 原始数据
    rawData: {
      title: '原始数据',
      reviewDataTitle: '🔍 查看评审原始数据',
      reviewDataLabel: '评审原始数据',
      workflowDataTitle: '🔄 查看工作流原始数据',
      workflowDataLabel: '工作流原始数据',
      workflowProgressTitle: '📊 查看工作流进度JSON数据',
      workflowProgressLabel: '工作流进度原始数据',
      reviewerAnalysisTitle: '🎯 查看审阅者分析JSON数据',
      reviewerAnalysisLabel: '审阅者分析数据'
    },

    // 消息提示
    messages: {
      workflowLoadSuccess: '工作流数据加载成功',
      workflowLoadFailed: '加载工作流失败',
      fileVersionLoadSuccess: '文件版本数据加载成功',
      fileVersionLoadSuccessWithDuplicates: '文件版本数据加载成功，已去重 {count} 个重复文件',
      fileVersionLoadFailed: '加载文件版本失败',
      missingReviewId: '缺少评审ID',
      missingWorkflowId: '缺少评审ID或工作流ID',
      missingProjectInfo: '缺少项目信息，无法加载工作流数据',
      missingProjectInfoForVersions: '缺少项目信息，无法加载文件版本数据'
    },

    // 评论和反馈
    comments: {
      title: '评论和反馈',
      addComment: '添加评论',
      noComments: '暂无评论',
      author: '作者',
      date: '日期',
      reply: '回复'
    },

    // 标签页
    tabs: {
      overview: '概览',
      workflow: '工作流',
      versions: '文件版本',
      comments: '评论',
      history: '历史记录',
      rawData: '原始数据'
    },

    // 加载状态
    loading: {
      workflow: '正在加载工作流数据...',
      versions: '正在加载文件版本...',
      comments: '正在加载评论...'
    },

    // 错误状态
    error: {
      loadWorkflow: '加载工作流数据失败',
      loadVersions: '加载文件版本失败',
      loadComments: '加载评论失败'
    }
  },

  // 评审进度历史
  reviewProgressHistory: {
    loading: '正在加载评审进度历史...',
    retryLoad: '重试加载',
    timelineTitle: '进度时间线',
    stepsCount: '{count} 个步骤',
    refresh: '刷新',
    noData: '暂无进度数据',
    loadFailed: '加载进度历史失败',
    missingReviewId: '缺少评审ID',
    missingProjectInfo: '缺少项目信息，无法加载进度历史',
    
    // 状态文本
    status: {
      returned: '已返回',
      submitted: '已提交',
      inProgress: '进行中',
      pending: '待认领',
      notStarted: '未开始',
      returnedTo: '已返回到{stepName}',
      returnedToPrevious: '已返回到上一步骤',
      submittedTo: '已提交到{stepName}',
      completed: '已完成审阅流程',
      unknown: '未知',
      currentStep: '当前在{stepName}步骤',
      defaultStep: '{stepName}步骤',
      
      // 状态映射
      PENDING: '待处理',
      CLAIMED: '已认领',
      SUBMITTED: '已提交',
      APPROVED: 'approved',
      REJECTED: '已拒绝'
    },
    
    // 步骤类型
    stepTypes: {
      INITIATOR: '发起者',
      REVIEWER: '审核者',
      APPROVER: '批准者',
      OBSERVER: '观察者'
    },
    
    // 界面文本
    ui: {
      multiReview: '多人审核',
      returned: '返回',
      expand: '展开',
      collapse: '收起',
      executor: '执行者',
      unknownUser: '未知用户',
      operator: '操作者',
      unknown: '未知',
      notes: '备注',
      viewRawData: '查看进度历史原始数据',
      noProgressHistory: '暂无进度历史记录',
      refreshing: '正在刷新进度历史...',
      
      // 统计信息
      displayedRecords: '显示记录',
      originalRecords: '原始记录',
      completedSteps: '完成步骤',
      returnOperations: '返回操作',
      pendingSteps: '待处理',
      filtered: '已过滤',
      
      // 描述文本
      dataDescription: '时间线显示有意义的工作流操作记录。已过滤掉操作cancel产生的无效VOID记录，仅保留工作流返回操作的VOID记录（如"已发送回初始审阅"）。',
      explanation: '说明：',
      rawDataTitle: '评审进度历史原始数据',
      
      // 时间相关
      deadline: '截止',
      daysDeadline: '{days}天期限',
      
      // 分配类型
      assignmentTypes: {
        direct_assignment: '直接分配',
        role_based: '基于角色',
        company_based: '基于公司',
        mixed_assignment: '混合分配',
        no_assignment: '无分配',
        unknown: '未知类型'
      },
      
      // 候选者类型
      candidateTypes: {
        specifiedUser: '指定用户',
        roleAssignment: '角色分配',
        companyAssignment: '公司分配'
      },
      
      // 最终状态
      finalStatus: {
        APPROVED: 'approved',
        REJECTED: '已拒绝'
      },
      
      // 返回操作
      returnOperations: {
        sentBackTo: '已发送回{stepName}',
        sentBackToPrevious: '已发送回上一步骤'
      },
      
      // 步骤名称翻译映射（基本类型，数字会自动保留）
      stepNameMapping: {
        '发起者': 'Initiator',
        '初始审阅': 'Initial Review',
        '最终审阅': 'Final Review'
      }
    }
  },

  // 审批工作流
  approvalWorkflows: {
    // 页面标题和描述
    title: '审批工作流管理',
    description: '查看和管理项目中的所有审批工作流',
    tag: '工作流',

    // 统计信息
    statistics: {
      totalWorkflows: '总工作流数',
      activeWorkflows: '活跃工作流',
      completedWorkflows: '已完成',
      templates: '模板数量'
    },

    // 表格列标题
    table: {
      name: '工作流名称',
      type: '类型',
      status: '状态',
      steps: '步骤数',
      createdBy: '创建者',
      createdDate: '创建日期',
      lastUsed: '最后使用',
      actions: '操作'
    },

    // 工作流类型
    types: {
      review: '评审工作流',
      approval: '审批工作流',
      custom: '自定义工作流',
      template: '模板工作流'
    },

    // 操作按钮
    actions: {
      create: '创建工作流',
      edit: '编辑',
      delete: '删除',
      duplicate: '复制',
      activate: '激活',
      deactivate: '停用',
      viewDetails: '查看详情',
      exportTemplate: '导出模板',
      refresh: '刷新数据',
      export: '导出数据',
      settings: '配置'
    },

    // 消息提示
    messages: {
      createSuccess: '工作流创建成功',
      createFailed: '工作流创建失败',
      updateSuccess: '工作流更新成功',
      updateFailed: '工作流更新失败',
      deleteSuccess: '工作流删除成功',
      deleteFailed: '工作流删除失败',
      activateSuccess: '工作流激活成功',
      deactivateSuccess: '工作流已停用',
      confirmDelete: '确定要删除这个工作流吗？'
    },

    // 空状态
    empty: {
      noWorkflows: '暂无工作流',
      noTemplates: '暂无模板'
    },

    // 加载状态
    loading: {
      title: '正在获取工作流数据',
      text: '请稍候，正在从服务器获取最新的审批工作流数据...'
    },

    // 错误状态
    error: {
      title: '获取工作流数据失败'
    },

    // 成功状态
    success: {
      title: '数据获取成功！',
      description: '成功获取 {count} 个审批工作流',
      lastUpdated: '最后更新时间: {time}'
    }
  },

  // 查询信息卡片
  queryInfo: {
    defaultTitle: '查询信息',
    apiEndpoint: 'API端点',
    queryDescription: '查询描述',
    queryParams: '查询参数',
    resultCount: '结果数量',
    responseTime: '响应时间',
    queryTime: '查询时间',
    defaultUnit: '条记录'
  },

  // 议题管理
  issues: {
    // 页面标题和描述
    title: '项目议题管理',
    description: '查看和管理 Autodesk Construction Cloud 项目中的所有议题数据',
    tag: '议题数据',

    // 加载状态
    loading: {
      title: '正在获取议题数据',
      text: '请稍候，正在从服务器获取最新的议题数据...'
    },

    // 错误状态
    error: {
      title: '获取议题数据失败',
      suggestions: [
        '检查网络连接是否正常',
        '确认已完成 Autodesk 账户认证',
        '验证项目访问权限',
        '检查 Issues API 服务状态'
      ]
    },

    // 成功状态
    success: {
      title: '数据获取成功！',
      description: '成功获取 {count} 个项目议题',
      lastUpdated: '最后更新时间: {time}'
    },

    // 查询信息
    queryInfo: {
      title: '🔍 项目议题查询',
      description: '获取项目的所有议题数据，包括状态、分配人、留言和附件信息',
      resultUnit: '个议题'
    },

    // 统计信息
    statistics: {
      totalIssues: '总议题数',
      openIssues: '开放议题',
      inProgress: '进行中',
      closed: '已关闭',
      recentActivity: '7天新增'
    },

    // 表格列标题
    table: {
      issueId: '议题ID',
      title: '议题标题',
      status: '状态',
      type: '类型',
      rootCause: '根本原因',
      assignedTo: '分配人',
      createdBy: '创建者',
      dueDate: '到期时间',
      startDate: '开始时间',
      linkedDocuments: '关联文档',
      comments: '留言',
      attachments: '附件',
      watchers: '观察者',
      updatedAt: '更新时间',
      tableTitle: '🎯 项目议题列表',
      tableDescription: '点击查看详情按钮查看议题的详细信息、留言和附件'
    },

    // 操作按钮
    actions: {
      refresh: '刷新数据',
      sync: '增量同步',
      export: '导出数据',
      settings: '配置',
      search: '搜索',
      filter: '筛选',
      viewDetails: '查看详情',
      detailPage: '详情页面'
    },

    // 状态
    status: {
      draft: '草稿',
      open: '开放',
      pending: '待处理',
      inProgress: '进行中',
      inReview: '审核中',
      closed: '已关闭',
      resolved: '已解决',
      rejected: '已拒绝',
      unassigned: '未分配',
      uncategorized: '未分类',
      notSet: '未设置',
      noDueDate: '无到期时间',
      rolePrefix: '角色-',
      companyPrefix: '公司-'
    },

    // 优先级
    priority: {
      high: '高',
      medium: '中',
      low: '低',
      critical: '紧急'
    },

    // 分配类型
    assignedToType: {
      user: '用户',
      role: '角色',
      company: '公司'
    },

    // 到期状态
    dueStatus: {
      overdue: '已过期',
      dueToday: '今日到期',
      dueTomorrow: '明日到期',
      dueSoon: '即将到期',
      sufficient: '充足时间',
      ample: '时间充裕',
      overdueYesterday: '昨日过期',
      overdueDaysAgo: '{days}天前过期',
      dayAfterTomorrow: '后天到期',
      daysLater: '{days}天后',
      sufficientTime: '充足时间',
      ampleTime: '时间充裕'
    },

    // 消息提示
    messages: {
      loadSuccess: '议题数据加载成功',
      loadFailed: '议题数据加载失败',
      syncSuccess: '增量同步完成，更新了 {count} 个议题',
      syncFailed: '增量同步失败',
      exportSuccess: '议题数据导出成功',
      exportFailed: '议题数据导出失败',
      noDataToExport: '没有数据可导出',
      projectRequired: '请先选择一个项目',
      cancelLoading: '已cancel数据获取',
      viewingIssue: '正在查看议题: #{displayId} {title}',
      navigatingToDetail: '正在跳转到议题详情页面: #{displayId}'
    },

    // 元数据面板
    metadata: {
      title: '📊 议题配置和元数据',
      loading: '正在加载元数据...',
      error: '元数据加载失败',
      issueTypes: '议题类型',
      subtypes: '子类型',
      customAttributes: '自定义属性',
      rootCauses: '根本原因',
      userPermissions: '用户权限',
      noIssueTypes: '暂无议题类型',
      noCustomAttributes: '暂无自定义属性',
      noRootCauses: '暂无根本原因类别',
      noUserPermissions: '暂无用户权限信息',
      specificCauses: '具体原因',
      optionsTitle: '可选值',
      enabled: '启用',
      disabled: '禁用',
      yes: '是',
      no: '否',
      userId: '用户ID',
      projectAdmin: '项目管理员',
      permissionLevel: '权限级别',
      allowedActions: '允许的操作',
      exportSuccess: '数据导出成功',
      exportFailed: '导出失败',
      // 数据类型
      dataTypes: {
        list: '下拉列表',
        text: '文本',
        paragraph: '段落',
        numeric: '数字'
      },
      // 权限类型
      permissions: {
        create: '创建',
        read: '读取',
        write: '写入',
        delete: '删除'
      }
    },

    // 标记面板
    markups: {
      title: '✏️ 图纸标记 (Markups)',
      loadButton: '加载图纸标记',
      loading: '正在加载标记...',
      error: '标记加载失败',
      noContainer: '无法加载标记数据',
      containerRequired: '需要容器ID才能加载图纸标记。请在项目配置中设置容器ID。',
      containerHelp: '容器ID通常与项目ID相同，格式为项目ID（不含 "b." 前缀）'
    },

    // 同步信息
    syncInfo: {
      title: '🔄 同步信息',
      syncTime: '同步时间',
      lastSyncTime: '上次同步',
      syncType: '同步方式',
      dataSource: '数据来源',
      fullSync: '完整同步'
    },

    // 原始数据
    rawData: {
      title: '🔍 原始 API 数据',
      description: 'Autodesk Construction Cloud Issues API 原始响应'
    },

    // 空状态
    empty: {
      noIssues: '暂无议题数据',
      noResults: '没有找到匹配的议题'
    }
  },

  // 议题详情
  issueDetail: {
    // 页面标题
    title: '议题详情',
    backToList: '返回列表',
    loading: '加载中',
    loadFailed: '加载失败',
    loadFailedMessage: '无法加载 Issue 详情',
    retry: '重试',

    // 章节
    sections: {
      basicInfo: '基本资讯',
      peopleAndRoles: '人员与角色',
      keyDates: '关键日期',
      description: '描述',
      attributes: '属性',
      customAttributes: '自定义属性',
      linkedDocuments: '关联文档',
      positionLocationInfo: '位置信息',
      officialResponse: '官方回复',
      snapshotInfo: '快照信息',
      permissions: '权限信息',
      detailInfo: '详细信息',
      locationInfo: '位置信息',
      documentPlacements: '文档位置',
      comments: '留言',
      attachments: '附件',
      rawData: '原始数据'
    },

    // 字段
    fields: {
      issueId: '议题ID',
      systemId: '系统ID',
      type: '类型',
      issueType: '议题类型',
      locationId: '位置ID',
      locationDescription: '位置描述',
      assignedTo: '分配给',
      createdBy: '创建者',
      updatedBy: '更新者',
      closedBy: '关闭者',
      createdAt: '创建时间',
      updatedAt: '最后更新',
      startDate: '开始日期',
      dueDate: '到期日期',
      closedAt: '关闭时间',
      status: '状态',
      priority: '优先级',
      assignedToType: '分配类型',
      watchers: '观察者',
      rootCauseId: '根本原因',
      published: '发布状态',
      deleted: '已删除'
    },

    // JSON 查看器
    jsonViewer: {
      issueData: {
        title: 'Issue 基本数据',
        description: '当前 Issue 项目的完整 API 响应数据'
      },
      commentsData: {
        title: '留言数据',
        description: '该 Issue 项目的所有留言信息'
      },
      attachmentsData: {
        title: '附件数据',
        description: '该 Issue 项目的所有附件信息'
      },
      apiCallsInfo: {
        title: 'API 调用信息',
        description: '本页面使用的 API 端点和调用状态'
      }
    },

    // 状态摘要
    statusSummary: {
      status: '状态',
      assignedTo: '分配给',
      dueDate: '到期日期',
      publishStatus: '发布状态',
      published: '已发布',
      draft: '草稿',
      commentCount: '留言数',
      attachmentCount: '附件数'
    },

    // 标签页
    tabs: {
      details: '详细资讯',
      comments: '留言',
      attachments: '附件',
      references: '参照',
      apiData: 'API 数据'
    },

    // 附件
    attachments: {
      noAttachments: '暂无附件',
      noAttachmentsForIssue: '此议题暂无附件',
      totalAttachments: '共 {count} 个附件',
      totalSize: '总大小',
      exportList: '导出列表',
      unknownFile: '未知文件',
      fileName: '文件名',
      fileSize: '文件大小',
      fileType: '文件类型',
      uploader: '上传者',
      uploadTime: '上传时间',
      preview: '预览',
      copyInfo: '复制信息',
      urn: 'URN',
      attachmentId: '附件ID',
      previewTitle: '预览: {name}',
      unsupportedPreview: '此文件类型不支持预览',
      downloadFile: '下载文件',
      missingIds: '需要项目ID和议题ID',
      loadSuccess: '成功加载 {count} 个附件',
      loadFailed: '加载附件失败',
      noDownloadLink: '此附件没有可用的下载链接',
      downloadInDevelopment: '下载功能开发中',
      downloadStarted: '开始下载: {name}',
      downloadFailed: '下载失败',
      imagePreviewInDevelopment: '图片预览功能开发中',
      textPreviewInDevelopment: '文本预览功能开发中',
      previewFailed: '预览失败',
      copySuccess: '附件信息已复制到剪贴板',
      noAttachmentsToExport: '没有附件可导出',
      exportSuccess: '附件列表导出成功',
      exportFailed: '附件列表导出失败',
      unknownUser: '未知用户',
      unknownTime: '未知时间',
      attachmentTypes: {
        photo: '照片',
        document: '文档',
        video: '视频',
        audio: '音频',
        file: '文件'
      }
    },

    // 参照
    references: {
      loading: '正在获取参照数据...',
      totalReferences: '总参照数',
      documentReferences: '文档参照',
      fileReferences: '文件参照',
      otherReferences: '其他参照',
      filterPlaceholder: '筛选参照类型',
      allReferences: '全部参照',
      searchPlaceholder: '搜索参照名称...',
      exportReferences: '导出参照',
      refreshReferences: '刷新参照',
      debugInfo: '调试信息 - 参照原始数据',
      apiResponse: '参照API原始响应',
      debugDescription: '用于调试参照数据结构和内容',
      jsonTitle: '参照数据JSON',
      jsonDescription: '当前{entityType}的参照列表JSON数据，包含所有参照关系和元数据',
      noReferences: '暂无参照数据',
      noReferencesFound: '未找到参照',
      loadSuccess: '成功获取 {count} 个参照',
      loadFailed: '获取参照失败',
      downloadSuccess: '成功下载: {documentName}',
      downloadFailed: '下载失败: {error}',
      downloadPreparing: '正在准备下载...',
      downloadStarted: '开始下载: {name}',
      referenceUnavailable: '参照链接不可用',
      reloadReferences: '重新加载',
      
      // 视图模式
      viewModes: {
        list: '列表',
        grid: '网格',
        category: '分类'
      },
      
      // 关系类型
      relationshipTypes: {
        xrefs: '外部参照',
        includes: '包含文件',
        dependencies: '依赖关系',
        auxiliary: '辅助关系',
        derived: '派生关系'
      },
      
      // 实体分类
      entityCategories: {
        document: '文档类',
        media: '媒体类',
        workflow: '工作流程类',
        management: '管理类',
        other: '其他'
      },
      
      // 目标类型
      targetTypes: {
        document: '文档',
        file: '文件',
        document_package: '文档包',
        drawing: '图纸',
        photo: '照片',
        image: '图片',
        submittal: '提交资料',
        issue: '问题',
        rfi: 'RFI',
        correspondence: '函件',
        schedule_activity: '明细表活动',
        specification: '规范',
        asset: '资产',
        form: '表单'
      },
      
      // 操作按钮
      actions: {
        download: '下载',
        view: '查看',
        details: '详情',
        viewInACC: '在ACC中查看',
        close: '关闭'
      },
      
      // 详情对话框
      detailDialog: {
        title: '参照详情 - {name}',
        basicInfo: 'basicInfo',
        referenceId: '参照ID',
        targetType: '目标类型',
        targetName: '目标名称',
        fileType: '文件类型',
        fileSize: '文件大小',
        createdTime: '创建时间',
        rawData: '原始参照数据',
        rawDataTitle: '原始参照数据',
        rawDataDesc: '完整的参照关系数据结构',
        unknown: '未知'
      },
      
      // 筛选选项
      filterOptions: {
        all: '全部参照',
        byRelationType: '按关系类型',
        byEntityCategory: '按实体分类',
        byTargetType: '按目标类型'
      }
    },

    // 操作按钮
    actions: {
      refresh: '刷新',
      export: '导出',
      exportSuccess: '议题数据导出成功',
      exportFailed: '导出失败',
      refreshAttachments: '刷新附件',
      refreshComments: '刷新留言'
    },

    // 消息提示
    messages: {
      refreshInDevelopment: '刷新功能开发中',
      exportSuccess: '数据导出成功',
      exportFailed: '导出失败',
      commentsRefreshed: '留言已刷新',
      attachmentsRefreshed: '附件已刷新'
    },

    // 错误状态
    error: {
      title: '加载失败',
      loadFailed: '无法加载 Issue 详情'
    },

    // basicInfo
    basicInfo: {
      title: '基本资讯',
      issueId: '议题ID',
      systemId: '系统ID',
      issueType: '议题类型',
      locationId: '位置ID',
      locationDetails: '位置描述'
    },

    // 人员与角色
    peopleAndRoles: {
      title: '人员与角色',
      assignedTo: '分配给',
      createdBy: '创建者',
      updatedBy: '更新者',
      closedBy: '关闭者'
    },

    // 关键日期
    keyDates: {
      title: '关键日期',
      createdAt: '创建时间',
      updatedAt: '最后更新',
      startDate: '开始日期',
      dueDate: '到期日期',
      closedAt: '关闭时间'
    },

    // 状态摘要
    statusSummary: {
      status: '状态',
      assignedTo: '分配给',
      dueDate: '到期日期',
      publishStatus: '发布状态',
      published: '已发布',
      draft: '草稿',
      commentCount: '留言数',
      attachmentCount: '附件数'
    },

    // 描述
    description: {
      title: '描述'
    },

    // 自定义属性
    customAttributes: {
      title: '自定义属性',
      notSet: '未设置'
    },

    // 关联文档
    linkedDocuments: {
      title: '关联文档',
      enhanced: '已增强',
      fileSize: '文件大小',
      version: '版本',
      createTime: '创建时间',
      modifyTime: '修改时间',
      modifiedTime: '修改时间',
      mimeType: 'MIME类型',
      locationInfo: '位置信息',
      technicalInfo: '技术信息',
      urn: 'URN',
      storageUrn: '存储URN',
      documentType: '文档类型',
      copy: '复制',
      copySuccess: '已复制到剪贴板',
      copyFailed: '复制失败',
      coordinatePosition: '坐标位置',
      viewInfo: '视图信息',
      threeDView: '3D视图',
      twoDView: '2D视图',
      page: '第{page}页',
      viewDetails: '查看详情',
      documentDetails: '文档详情',
      basicInfo: 'basicInfo',
      metadata: '元数据',
      viewableInfo: '视图信息',
      positionInfo: '位置信息'
    },

    // 观察者
    watchers: {
      title: '观察者',
      watcherObjects: '观察者对象',
      watchersList: '观察者列表'
    },

    // 官方回复
    officialResponse: {
      title: '官方回复',
      respondedBy: '回复者',
      respondedAt: '回复时间',
      noResponse: '暂无官方回复'
    },

    // 快照信息
    snapshot: {
      title: '快照信息',
      explanation: '什么是快照信息？',
      explanationText: '快照信息记录了议题创建时的文档状态，包含当时的视图截图和标记信息。快照URN是唯一标识符，用于访问和显示该快照内容。',
      snapshotUrn: '快照URN',
      downloadSnapshot: '下载快照',
      previewSnapshot: '预览快照',
      containsMarkups: '包含标记',
      yes: '是',
      no: '否',
      downloading: '下载中...',
      downloadSuccess: '快照下载已开始',
      downloadFailed: '下载失败',
      previewFailed: '预览失败',
      noUrn: '快照URN不存在'
    },

    // 权限信息
    permissions: {
      title: '权限信息',
      allowedActions: '允许的操作',
      allowedStatuses: '允许的状态',
      editableAttributes: '可编辑属性'
    },

    // 标签页
    tabs: {
      details: '详细资讯',
      comments: '留言',
      attachments: '附件',
      references: '参照',
      apiData: 'API 数据'
    },

    // 留言
    comments: {
      loading: '加载留言中...',
      refresh: '刷新留言',
      refreshed: '留言已刷新',
      noComments: '暂无留言',
      noCommentsForIssue: '此议题暂无留言',
      totalComments: '共 {count} 条留言',
      missingIds: '需要项目ID和议题ID',
      loadSuccess: '成功加载 {count} 条留言',
      loadFailed: '加载留言失败',
      exportSuccess: '留言列表导出成功',
      exportFailed: '留言列表导出失败',
      copySuccess: '留言信息已复制到剪贴板',
      copyFailed: '复制失败',
      unknownUser: '未知用户',
      unknownTime: '未知时间'
    },

    // 附件
    attachments: {
      loading: '加载附件中...',
      refresh: '刷新附件',
      refreshed: '附件已刷新',
      noAttachments: '暂无附件',
      noAttachmentsForIssue: '此议题暂无附件',
      totalAttachments: '共 {count} 个附件',
      totalSize: '总大小',
      exportList: '导出列表',
      unknownFile: '未知文件',
      fileName: '文件名',
      fileSize: '文件大小',
      fileType: '文件类型',
      uploader: '上传者',
      uploadTime: '上传时间',
      preview: '预览',
      copyInfo: '复制信息',
      urn: 'URN',
      attachmentId: '附件ID',
      previewTitle: '预览: {name}',
      unsupportedPreview: '此文件类型不支持预览',
      downloadFile: '下载文件',
      missingIds: '需要项目ID和议题ID',
      loadSuccess: '成功加载 {count} 个附件',
      loadFailed: '加载附件失败',
      noDownloadLink: '此附件没有可用的下载链接',
      downloadInDevelopment: '下载功能开发中',
      downloadStarted: '开始下载: {name}',
      downloadFailed: '下载失败',
      imagePreviewInDevelopment: '图片预览功能开发中',
      textPreviewInDevelopment: '文本预览功能开发中',
      previewFailed: '预览失败',
      copySuccess: '附件信息已复制到剪贴板',
      noAttachmentsToExport: '没有附件可导出',
      exportSuccess: '附件列表导出成功',
      exportFailed: '附件列表导出失败',
      unknownUser: '未知用户',
      unknownTime: '未知时间',
      attachmentTypes: {
        photo: '照片',
        document: '文档',
        video: '视频',
        audio: '音频',
        file: '文件'
      }
    },

    // API数据
    apiData: {
      issueBasicData: 'Issue 基本数据',
      issueBasicDataDesc: '当前 Issue 项目的完整 API 响应数据',
      commentsData: '留言数据',
      commentsDataDesc: '该 Issue 项目的所有留言信息',
      attachmentsData: '附件数据',
      attachmentsDataDesc: '该 Issue 项目的所有附件信息',
      apiCallInfo: 'API 调用信息',
      apiCallInfoDesc: '本页面使用的 API 端点和调用状态'
    },

    // 操作按钮
    actions: {
      refresh: '刷新',
      export: '导出',
      exportSuccess: '议题数据导出成功',
      exportFailed: '导出失败'
    },

    // 文档类型
    documentTypes: {
      pdf: 'PDF文档',
      dwg: 'AutoCAD图纸',
      dxf: 'DXF图纸',
      rvt: 'Revit模型',
      ifc: 'IFC模型',
      nwd: 'Navisworks文档',
      nwc: 'Navisworks缓存',
      jpg: 'JPEG图片',
      jpeg: 'JPEG图片',
      png: 'PNG图片',
      gif: 'GIF图片',
      doc: 'Word文档',
      docx: 'Word文档',
      xls: 'Excel表格',
      xlsx: 'Excel表格',
      ppt: 'PowerPoint演示',
      pptx: 'PowerPoint演示',
      unknown: '未知类型'
    },

    // 权限操作
    permissionActions: {
      addComment: '添加留言',
      addAttachment: '添加附件',
      delete: '删除',
      upsertPin: '更新标记',
      removeAttachment: '移除附件',
      unlinkPin: 'cancel链接标记',
      clearAssignee: '清除分配',
      assignAll: '分配全部',
      edit: '编辑',
      view: '查看',
      close: '关闭',
      reopen: '重新打开'
    },

    // 属性名称
    attributeNames: {
      title: '标题',
      description: '描述',
      issueTypeId: '议题类型',
      issueSubtypeId: '议题子类型',
      status: '状态',
      assignedTo: '分配给',
      assignedToType: '分配类型',
      dueDate: '到期日期',
      locationId: '位置ID',
      locationDetails: '位置详情',
      linkedDocuments: '关联文档',
      links: '链接',
      ownerId: '所有者',
      rootCauseId: '根本原因',
      officialResponse: '官方回复',
      customAttributes: '自定义属性',
      snapshotUrn: '快照URN',
      placements: '位置信息',
      startDate: '开始日期',
      published: '发布状态',
      watchers: '观察者',
      watcherObjects: '观察者对象',
      gpsCoordinates: 'GPS坐标'
    }
  },

  // RFIs 信息请求管理
  rfis: {
    title: 'RFI 管理',
    description: '查看和管理 Autodesk Construction Cloud 项目中的所有 RFI 数据',
    tag: 'RFI 数据',
    
    // 页面操作
    actions: {
      refresh: '刷新数据',
      sync: '同步数据',
      export: '导出 JSON',
      settings: '设置',
      toggleRaw: '切换原始数据',
      toggleConfig: '切换配置',
      showRaw: '显示原始数据',
      hideRaw: '隐藏原始数据',
      showConfig: '显示配置',
      hideConfig: '隐藏配置'
    },

    // 加载状态
    loading: {
      title: '正在获取 RFI 数据',
      text: '请稍候，正在从服务器获取最新的 RFI 数据...',
      statistics: '正在获取统计数据',
      statisticsText: '请稍候，正在分析项目 RFI 数据...'
    },

    // 错误状态
    error: {
      title: '获取 RFI 数据失败',
      statisticsTitle: '获取统计数据失败'
    },

    // 成功状态
    success: {
      title: '数据获取成功！',
      description: '成功获取 {count} 个项目 RFI',
      lastUpdated: '最后更新时间: {time}'
    },

    // 查询信息
    queryInfo: {
      title: '项目 RFI 查询',
      description: '获取项目的所有 RFI 数据，包括状态、分配人、留言和附件信息',
      resultUnit: '个 RFI'
    },

    // 搜索和筛选
    search: {
      placeholder: '搜索 RFI 标题、编号、问题内容...',
      expandFilters: '展开筛选',
      collapseFilters: '收起筛选',
      applyFilters: '应用筛选',
      resetFilters: '重置',
      allStatuses: '全部状态',
      allPriorities: '全部优先级',
      allDisciplines: '全部领域',
      allCategories: '全部类别'
    },

    // 快速筛选标签
    quickFilters: {
      all: '全部',
      draft: '草稿',
      answered: '已回答',
      highPriority: '高优先级',
      withAttachments: '有附件',
      overdue: '已逾期'
    },

    // 状态
    statuses: {
      draft: '草稿',
      open: '开启',
      answered: '已回答',
      answeredRev1: '已回答 (修订1)',
      answeredRev2: '已回答 (修订2)',
      closed: '已关闭',
      void: '作废',
      rejected: '已拒绝'
    },

    // 优先级
    priorities: {
      high: '高',
      medium: '中',
      low: '低',
      normal: '普通'
    },

    // 工作流类型
    workflowTypes: {
      us: '单审阅者',
      emea: '多审阅者',
      eu: '多审阅者'
    },

    // 影响评估
    impact: {
      cost: '成本',
      schedule: '时程',
      both: '双重影响',
      none: '无影响',
      high: '高影响',
      medium: '中影响',
      low: '低影响'
    },

    // 表格列
    table: {
      columns: {
        title: 'RFI 标题',
        status: '状态',
        priority: '优先级',
        impact: '影响评估',
        discipline: '专业领域',
        category: '类别',
        createdAt: '创建时间',
        dueDate: '到期时间',
        response: '回复状态',
        workflowType: '工作流类型'
      },
      actions: {
        exportSelected: '导出选中',
        viewDetail: '查看'
      }
    },

    // 表格操作
    tableActions: {
      exportSelected: '导出选中',
      viewDetail: '查看'
    },

    // 统计数据
    stats: {
      totalRfis: '总 RFI 数',
      openRfis: '进行中',
      closedRfis: '已关闭',
      overdueRfis: '已逾期',
      completionRate: '完成率',
      responseRate: '回复率'
    },

    // 消息提示
    messages: {
      loadSuccess: '成功获取 {count} 个 RFI',
      loadFailed: '获取 RFI 数据失败',
      searchSuccess: '找到 {total} 个符合条件的 RFI，显示 {display} 个',
      exportSuccess: 'RFI 数据导出成功: {fileName}',
      exportSelectedSuccess: '已导出 {count} 个选中的 RFI: {fileName}',
      exportFailed: '导出失败: {error}',
      exporting: '正在导出 RFI 数据...',
      selectForExport: '请先选择要导出的 RFI',
      noProjectSelected: '未选择项目，请返回首页选择项目',
      refreshSuccess: '数据刷新完成',
      refreshFailed: '刷新数据失败',
      statisticsLoadSuccess: '统计数据载入成功',
      statisticsLoadFailed: '获取统计数据失败',
      statisticsItemClicked: '点击了 {category}，数量: {count}',
      statisticsExportSuccess: '统计数据导出成功'
    }
  },

  // RFI 统计分析
  rfisStatistics: {
    title: 'RFI 统计分析',
    description: '查看和分析 Autodesk Construction Cloud 项目中的 RFI 统计数据和趋势',
    tag: '统计分析',

    // 页面操作
    actions: {
      refresh: '刷新统计',
      export: '导出统计',
      toggleRaw: '切换原始数据',
      toggleConfig: '切换配置'
    },

    // 概览统计
    overview: {
      totalRfis: '总 RFI 数',
      openRfis: '进行中',
      closedRfis: '已关闭',
      answeredRfis: '已回答',
      overdueRfis: '已逾期',
      completionRate: '完成率'
    },

    // 分布统计
    distribution: {
      status: '状态分布',
      priority: '优先级分布',
      discipline: '专业领域分布',
      category: '类别分布'
    },

    // 分析类型
    analysis: {
      impact: '影响分析',
      response: '回复分析',
      attachment: '附件分析',
      efficiency: '效率指标'
    },

    // 效率指标
    efficiency: {
      completionRate: '完成率',
      overdueRate: '逾期率',
      attachmentRate: '附件率',
      responseRate: '回复率'
    },

    // 查询信息
    queryInfo: {
      title: 'RFI 统计查询',
      description: '获取项目 RFI 的统计分析数据',
      resultUnit: '个 RFI'
    }
  },

  // RFI 详情
  rfiDetail: {
    // 标签页
    tabs: {
      basic: 'basicInfo',
      attachments: '附件',
      references: '参照',
      comments: '评论',
      rawData: '原始数据'
    },

    // basicInfo部分
    sections: {
      basicInfo: 'RFIbasicInfo',
      questionDetail: '问题详情',
      categoriesAndAttributes: '分类和属性',
      impactAssessment: '影响评估',
      peopleAndTime: '人员和时间信息',
      locationAndAssociation: '位置和关联信息',
      statusAndProgress: '状态和进度',
      attachmentsAndComments: '附件和评论'
    },

    // 字段标签
    fields: {
      rfiId: 'RFI ID',
      customIdentifier: '自定义编号',
      referenceNumber: '参考编号',
      displayNumber: '显示编号',
      title: '标题',
      description: '描述',
      question: '问题内容',
      suggestedAnswer: '建议答案',
      officialResponse: '官方回复',
      discipline: '专业领域',
      category: '类别',
      workflowType: '工作流类型',
      customAttributes: '自定义属性',
      costImpact: '成本影响',
      scheduleImpact: '时程影响',
      overallImpact: '整体影响等级',
      locationDescription: '位置描述',
      linkedDocument: '关联文件',
      structuredLocations: '结构化位置'
    },

    // 人员角色
    roles: {
      creator: '创建人',
      manager: '管理人',
      constructionManager: '施工经理',
      assignedTo: '指派给',
      reviewers: '审核人员',
      architects: 'Architect',
      coReviewers: '协同审核',
      watchers: '关注人员'
    },

    // 时间节点
    timeline: {
      createdAt: '创建时间',
      startDate: '开始日期',
      dueDate: '到期日期',
      updatedAt: '更新时间',
      respondedAt: '回复时间',
      closedAt: '关闭时间',
      overdue: '已逾期'
    },

    // 状态详情
    statusSummary: {
      currentStatus: '当前状态',
      previousStatus: '前一状态',
      answerStatus: '回答状态',
      answered: '已回答',
      notAnswered: '未回答',
      closeStatus: '关闭状态',
      closed: '已关闭',
      inProgress: '进行中',
      timeStatus: '时效状态',
      overdue: '已逾期',
      normal: '正常',
      documentStatus: '文档状态',
      draft: '草稿',
      formal: '正式'
    },

    // 附件相关
    attachments: {
      title: '附件列表',
      loading: '加载附件',
      loadAttachments: '加载附件',
      loaded: '已加载',
      totalAttachments: '总附件',
      rfiResponse: 'RFI 回复',
      officialResponse: '官方回复',
      otherFiles: '其他文件',
      all: '全部',
      other: '其他',
      noAttachments: '暂无附件',
      noFilteredAttachments: '没有符合筛选条件的附件',
      showAllAttachments: '显示全部附件',
      download: '下载',
      downloading: '下载中',
      downloadSuccess: '开始下载 {fileName}',
      downloadFailed: '下载失败: {error}',
      fileType: '文件类型',
      fileSize: '文件大小',
      category: '类别',
      createdTime: '创建时间',
      creator: '创建者'
    },

    // 评论相关
    comments: {
      title: '评论列表',
      loading: '加载评论',
      loadComments: '加载评论',
      loaded: '已加载',
      noComments: '暂无评论',
      emptyContent: '空内容',
      emptyContentDesc: '此评论没有文字内容，可能只包含附件或为系统生成的回复。',
      formalResponse: '正式回复',
      draftResponse: '草稿回复',
      draft: '草稿',
      attachmentsCount: '{count} 个附件'
    },


    // 操作按钮
    actions: {
      showRawData: '显示原始数据',
      hideRawData: '隐藏原始数据',
      showConfig: '显示配置信息',
      hideConfig: '隐藏配置信息',
      exportRfi: '导出 RFI 数据',
      exportFull: '导出完整数据 (含配置)'
    },

    // 消息提示
    messages: {
      exportSuccess: 'RFI 数据导出成功: {fileName}',
      exportFullSuccess: '完整 RFI 数据导出成功: {fileName}',
      exportFailed: '导出失败: {error}',
      attachmentsLoadSuccess: '成功获取 {count} 个附件',
      attachmentsLoadFailed: '获取附件失败',
      commentsLoadSuccess: '成功获取 {count} 个评论',
      commentsLoadFailed: '获取评论失败',
      noComments: '此 RFI 没有评论'
    }
  },

  // RFI 工作流进度
  rfiWorkflow: {
    title: 'RFI 工作流进度',
    
    // 工作流步骤
    steps: {
      draft: '草稿',
      submitted: '已提交',
      inProgress: '进行中',
      managerReview: '管理者审阅',
      reviewerReview: '审阅者审阅',
      initialAnswer: '初步回答',
      managerConfirm: '管理者确认',
      answered: '已回答',
      closed: '已关闭',
      created: '创建',
      processing: '处理中',
      completed: '已完成'
    },

    // 步骤描述
    stepDescriptions: {
      draft: 'RFI 创建但未提交',
      submitted: 'RFI 已提交等待审阅',
      inProgress: '正在审阅和处理',
      managerReview: '管理者正在审阅',
      reviewerReview: '审阅者正在审阅',
      initialAnswer: '已提供初步回复',
      managerConfirm: '管理者确认回复',
      answered: '已提供回复',
      closed: 'RFI 已完成并关闭',
      created: 'RFI 已创建',
      processing: '正在处理',
      completed: 'RFI 已完成'
    },

    // 状态历史
    history: {
      title: '状态变更历史',
      hide: '隐藏历史',
      show: '显示状态历史',
      createRfi: '创建 RFI',
      statusChange: '状态变更',
      provideResponse: '提供回复',
      closeRfi: '关闭 RFI',
      initialCreation: '初始创建',
      statusUpdate: '从 {from} 变更为 {to}',
      officialResponseProvided: '已提供官方回复',
      responseStatusUpdate: '回复状态更新',
      rfiClosed: 'RFI 已关闭'
    },

    // 当前状态详情
    currentStatus: {
      title: '当前状态详情',
      currentStatus: '当前状态',
      previousStatus: '前一状态',
      currentAssignee: '当前负责人',
      dueDate: '到期时间',
      overdue: '已逾期'
    },

    // 工作流参与者
    participants: {
      title: '工作流参与者',
      creator: '创建者',
      manager: '管理者',
      reviewers: '审阅者',
      responder: '回复者'
    },

    // 操作
    actions: {
      showHistory: '显示状态历史',
      hideHistory: '隐藏状态历史',
      exportWorkflow: '导出工作流数据'
    },

    // 消息提示
    messages: {
      exportSuccess: '工作流数据导出成功: {fileName}',
      exportFailed: '导出失败: {error}'
    }
  },

  // 账户管理
  account: {
    // 账户信息
    accountInfo: {
      title: '账户信息',
      description: '查看和管理 Autodesk Construction Cloud 账户信息和项目',
      loading: '正在获取账户信息',
      loadingText: '请稍候，正在从服务器获取最新的账户信息...',
      error: '获取账户信息失败',
      errorMessage: '获取账户信息时发生错误: {message}',
      success: '账户信息获取成功！',
      successDescription: '用户: {name}',
      successDetails: 'Hub: {hub} | 项目: {count}',
      
      // 统计信息
      stats: {
        totalProjects: '项目总数',
        activeProjects: '活跃项目',
        adminProjects: '管理员权限',
        accountAge: '账户年龄',
        daysUnit: '天'
      },
      
      // 标签页
      tabs: {
        personal: '个人信息',
        security: '安全设置',
        projects: '项目信息',
        members: '成员列表',
        companies: '公司列表',
        roles: '角色列表'
      },
      
      // 用户资料
      userProfile: {
        userId: '用户ID',
        userName: '用户名',
        email: '邮箱',
        fullName: '姓名',
        firstName: '名',
        lastName: '姓',
        language: '语言',
        country: '国家/地区',
        createdDate: '创建时间',
        lastLogin: '最后登录',
        company: '公司',
        jobTitle: '职位',
        industry: '行业',
        aboutMe: '个人简介',
        contactEmail: '联系邮箱',
        phoneNumber: '电话号码',
        address: '地址'
      },
      
      // 安全设置
      security: {
        title: '安全设置',
        twoFactor: '双因子认证',
        backupCode: '备份代码',
        ldapIntegration: 'LDAP集成',
        marketingSubscription: '营销订阅',
        enabled: '已启用',
        disabled: '已禁用',
        configured: '已配置',
        notConfigured: '未配置',
        subscribed: '已订阅',
        notSubscribed: '未订阅'
      },
      
      // Hub信息
      hub: {
        hubId: 'Hub ID',
        hubName: 'Hub 名称',
        realAccountId: '真实 Account ID'
      },
      
      // 项目信息
      projects: {
        table: {
          projectId: '项目ID',
          projectName: '项目名称',
          permissions: '权限',
          status: '状态',
          projectType: '项目类型',
          actions: '操作'
        },
        details: {
          fullProjectId: '完整项目ID',
          jobNumber: '工作编号',
          projectType: '项目类型',
          startDate: '开始日期',
          endDate: '结束日期',
          permissionLevel: '权限级别',
          permissionDescription: '权限描述',
          currency: '货币',
          timezone: '时区',
          language: '语言'
        },
        actions: {
          details: '详情',
          collapse: '收起'
        },
        defaultPermission: '默认权限',
        defaultPermissionDescription: '默认权限描述',
        noData: '暂无项目数据'
      },
      
      // 项目状态
      projectStatus: {
        active: '活跃',
        inactive: '非活跃',
        archived: '已归档',
        suspended: '已暂停',
        unknown: '未知'
      },
      
      // 语言
      languages: {
        en: '英语',
        zh: '中文',
        zhCN: '简体中文',
        zhTW: '繁体中文',
        ja: '日语',
        ko: '韩语',
        fr: '法语',
        de: '德语',
        es: '西班牙语'
      },
      
      // 国家
      countries: {
        HK: '香港',
        CN: '中国',
        US: '美国',
        GB: '英国',
        JP: '日本',
        KR: '韩国',
        SG: '新加坡',
        AU: '澳大利亚',
        CA: '加拿大',
        DE: '德国',
        FR: '法国',
        unknown: '未知'
      },
      
      // 电话类型
      phoneTypes: {
        mobile: '手机',
        office: '办公电话',
        home: '家庭电话',
        fax: '传真',
        other: '其他'
      },
      
      // 字段
      fields: {
        notSet: '未设置'
      },
      
      // 操作
      actions: {
        backToHome: '返回首页',
        refreshData: '刷新数据',
        reauth: '重新认证',
        retry: '重试'
      },
      
      // 错误信息
      errors: {
        timeout: '请求超时',
        noToken: '未找到访问令牌',
        networkError: '网络连接错误',
        needReauth: '需要重新认证',
        missingAccountId: '缺少账户ID',
        suggestions: {
          checkNetwork: '检查网络连接是否正常',
          confirmAuth: '确认已完成 Autodesk 认证',
          verifyToken: '验证 Token 是否有效',
          contactAdmin: '联系管理员检查 API 配置'
        }
      },
      
      // 调试信息
      debug: {
        rawUserData: '原始用户数据',
        rawProjectData: '原始项目数据'
      },
      
      // 用户资料
      userProfile: '用户资料',
      basicInfo: 'basicInfo',
      professionalInfo: 'professionalInfo',
      contactInfo: 'contactInfo',
      securitySettings: '安全设置',
      projectInfo: '项目信息',
      
      // 标签和徽章
      badges: {
        emailVerified: 'emailVerified',
        twoFactorAuth: '双因子认证',
        verified: 'Verified'
      },
      
      // 通用文本
      common: {
        notSet: '暂无',
        noData: '暂无',
        statistics: '统计卡片',
        projectListTitle: '项目列表'
      },
      
      // 安全建议
      securityAdvice: {
        title: '安全建议',
        enable2fa: '建议启用双因子认证以提高账户安全性',
        setupBackup: '设置备份代码以防止无法访问双因子认证设备',
        strongPassword: '定期更新密码并使用强密码'
      },
      
      // 统计信息
      totalProjects: '项目总数',
      activeProjects: '活跃项目',
      adminProjects: '管理员权限',
      accountAge: '账户年龄',
      
      // 用户字段
      userId: '用户ID',
      userName: '用户名',
      email: '邮箱',
      fullName: '姓名',
      firstName: '名',
      lastName: '姓',
      language: '语言',
      country: '国家/地区',
      createdDate: '创建时间',
      lastLogin: '最后登录',
      emailVerified: 'emailVerified',
      twoFactorAuth: '双因子认证',
      
      // professionalInfo
      company: '公司',
      jobTitle: '职位',
      industry: '行业',
      aboutMe: '个人简介',
      
      // contactInfo
      contactEmail: '联系邮箱',
      phoneNumber: '电话号码',
      address: '地址',
      phoneTypes: {
        mobile: '手机',
        office: '办公电话',
        home: '家庭电话',
        fax: '传真',
        other: '其他'
      },
      
      // 安全设置
      backupCode: '备份代码',
      ldapIntegration: 'LDAP集成',
      marketingSubscription: '营销订阅',
      securityTips: '安全建议',
      
      // Hub信息
      hubInfo: 'Hub 信息',
      hubId: 'Hub ID',
      hubName: 'Hub 名称',
      realAccountId: '真实 Account ID',
      
      // 项目列表
      projectList: '项目列表',
      projectId: '项目ID',
      projectName: '项目名称',
      projectType: '项目类型',
      permissionScope: '权限范围',
      permissionLevel: '权限级别',
      permissionDescription: '权限描述',
      
      // 操作
      refreshData: '刷新数据',
      viewForms: '查看表单数据',
      returnHome: '返回首页',
      
      // 标签页
      personalInfo: '个人信息',
      security: '安全设置',
      projects: '项目信息',
      members: '成员列表',
      companies: '公司列表',
      roles: '角色列表',
      
      // 错误建议
      errorSuggestions: [
        '检查网络连接是否正常',
        '确认已完成 Autodesk 认证',
        '验证 Token 是否有效',
        '联系管理员检查 API 配置'
      ],
      
      // 错误操作
      reauth: '重新认证',
      retry: '重试'
    },
    
    // 用户详情面板
    userDetail: {
      // 标识信息
      identityInfo: '标识信息',
      userId: '用户ID:',
      autodeskId: 'Autodesk ID:',
      
      // basicInfo
      basicInfo: 'basicInfo',
      fullName: '姓名:',
      email: '邮箱:',
      phone: '电话:',
      extension: '分机:',
      jobTitle: '职位:',
      industry: '行业:',
      aboutMe: '简介:',
      joinedDate: '加入时间:',
      
      // 公司信息
      companyInfo: '公司信息',
      companyName: '公司名称:',
      companyId: '公司ID:',
      
      // 地址信息
      addressInfo: '地址信息',
      address1: '地址1:',
      address2: '地址2:',
      
      // 产品权限
      productPermissions: '产品权限',
      
      // 操作按钮
      actions: {
        downloadUserData: '下载用户数据',
        copyUserInfo: '复制用户信息'
      }
    },
    
    // 账户成员
    members: {
      title: '账户成员',
      loading: '正在获取成员列表',
      loadingText: '请稍候，正在从服务器获取账户成员信息...',
      error: '获取成员列表失败',
      
      // 统计信息
      stats: {
        totalMembers: '总成员数'
      },
      
      // 筛选
      filters: {
        searchPlaceholder: '搜索成员姓名、邮箱、公司...'
      },
      
      // 通用文本
      common: {
        notSet: '未设置',
        noJobTitle: '未设置职位',
        unknown: '未知',
        verified: 'Verified'
      },
      
      // 操作按钮
      actions: {
        refreshData: '刷新数据',
        exportData: '导出数据',
        retry: '重试'
      },
      
      // 错误消息
      errors: {
        missingAccountId: '缺少账户ID',
        fetchFailed: '获取账户成员列表失败'
      },
      
      // 表格
      table: {
        title: '账户成员列表 ({count} 个成员)',
        companyInfo: '公司信息',
        email: '邮箱',
        accountPermissions: '账户权限',
        countryRegion: '国家/地区',
        member: '成员',
        email: '邮箱',
        company: '公司信息',
        jobTitle: '职位',
        defaultRole: '预设角色',
        accessLevel: '账户权限',
        country: '国家/地区',
        status: '状态',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        noData: '暂无成员数据'
      },
      
      // 用户详情
      userDetail: {
        title: '用户详情 - {name}',
        userId: '用户ID',
        defaultRole: '预设角色',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        lastSignIn: '最后登录',
        aboutMe: '个人简介'
      },
      
      // 角色显示名称
      roleDisplayNames: {
        accountAdmin: '账户管理员',
        projectAdmin: '项目管理员',
        member: '成员',
        viewer: '查看者',
        executive: '执行者',
        unknown: '未知角色'
      },
      
      // 操作
      actions: {
        refreshData: '刷新数据',
        exportData: '导出数据',
        viewDetails: '查看详情',
        retry: '重试',
        close: '关闭'
      },
      
      // 消息
      messages: {
        fetchSuccess: '成功获取 {count} 个账户成员',
        exportSuccess: '成员数据导出成功',
        exportError: '导出失败'
      }
    },
    
    // 账户公司
    companies: {
      title: '账户公司',
      loading: '正在获取公司列表',
      loadingText: '请稍候，正在从服务器获取账户公司信息...',
      error: '获取公司列表失败',
      
      // 统计信息
      stats: {
        totalCompanies: '总公司数',
        activeCompanies: '活跃公司'
      },
      
      // 筛选
      filters: {
        searchPlaceholder: '搜索公司名称...',
        filterByTrade: '筛选行业',
        filterByStatus: '筛选状态'
      },
      
      // 状态
      status: {
        active: '活跃',
        inactive: '非活跃',
        suspended: '已暂停'
      },
      
      // 表格
      table: {
        title: '账户公司列表 ({count} 个公司)',
        company: '公司',
        industry: '行业',
        status: '状态',
        userCount: '用户数',
        projectCount: '项目数',
        erpId: 'ERP ID',
        taxId: '税务ID',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        actions: '操作',
        noData: '暂无公司数据'
      },
      
      // 公司详情
      companyDetail: {
        title: '公司详情 - {name}',
        companyId: '公司ID',
        accountId: '账户ID',
        erpId: 'ERP ID',
        taxId: '税务ID',
        website: '网站',
        industry: '行业',
        userCount: '用户数',
        projectCount: '项目数',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        description: '公司描述'
      },
      
      // 字段
      fields: {
        notSet: '未设置'
      },
      
      // 操作
      actions: {
        refreshData: '刷新数据',
        exportData: '导出数据',
        viewDetail: '查看详情',
        retry: '重试'
      },
      
      // 消息
      messages: {
        fetchSuccess: '成功获取 {count} 个公司',
        exportSuccess: '公司数据导出成功',
        exportError: '导出失败'
      }
    },
    
    // 账户角色
    roles: {
      title: '账户角色',
      loading: '正在获取角色信息',
      loadingText: '请稍候，正在从服务器获取账户角色信息...',
      error: '获取角色信息失败',
      
      // 统计信息
      stats: {
        roleTypes: '角色类型',
        roleAssignments: '角色分配',
        usersWithRoles: '有角色用户'
      },
      
      // 筛选
      filters: {
        searchPlaceholder: '搜索角色名称...',
        sortBy: '排序方式',
        sortByRoleName: '按角色名称',
        sortByUserCount: '按用户数量',
        sortByProjectCount: '按项目数量',
        sortByAssignmentCount: '按分配数量'
      },
      
      // 操作
      actions: {
        refreshData: '刷新数据',
        exportData: '导出数据',
        retry: '重试',
        collapse: '收起',
        showAllProjects: '显示全部 {count} 个项目',
        showAllAssignments: '显示全部 {count} 个分配'
      },
      
      // 空状态
      emptyStates: {
        noUsersForRole: '暂无用户拥有此角色'
      },
      
      // 消息
      messages: {
        fetchSuccess: '成功获取 {count} 个角色类型',
        exportSuccess: '角色数据导出成功',
        exportError: '导出失败'
      }
    }
  },

  // Submittal 送审管理
  submittal: {
    // 页面标题和描述
    title: 'Submittal 送审管理',
    description: '送审项目列表详细信息、附件管理与审核流程追踪',
    
    // 主页面
    masterView: {
      title: 'Submittal 送审管理',
      description: '送审项目列表详细信息、附件管理与审核流程追踪',
      noSubmittals: '暂无Submittal',
      noSubmittalsDesc: '该项目中没有送审项目',
      loadingSubmittals: '加载中'
    },

    // 详情页面
    detailView: {
      title: 'Submittal 详情',
      backToList: '返回列表',
      loading: '加载中',
      loadingDetail: '加载详情...',
      loadFailed: '加载失败',
      loadFailedDesc: '无法加载 Submittal 详情',
      itemTitle: 'Submittal: {title}',
      
      // 页签
      tabs: {
        details: '详细资讯',
        attachments: '附件',
        workflow: '送审工作流程',
        references: '参照',
        activityLog: '活动日志',
        apiData: 'API 数据'
      }
    },

    // 状态
    status: {
      required: 'Required必需',
      open: 'Open开放', 
      closed: 'Closed关闭',
      void: 'Void作废',
      empty: 'Empty空',
      draft: 'Draft草稿'
    },

    // 阶段
    state: {
      draft: 'Draft草稿',
      'sbc-1': '等待提交',
      'mgr-1': '已提交', 
      'rev': '审核中',
      'mgr-2': '已审核',
      'sbc-2': '已关闭',
      'void': '已作废'
    },

    // 优先级
    priority: {
      high: 'High高',
      normal: 'Normal正常',
      low: 'Low低'
    },

    // 过滤器
    filters: {
      allStatus: '所有状态',
      allStates: '所有阶段', 
      allPriorities: '所有优先级',
      clearFilters: '清除过滤',
      searchPlaceholder: '搜索标题、编号、规格...'
    },

    // 表格列
    columns: {
      title: 'Submittal 标题',
      identifier: '标识符',
      status: '状态',
      priority: '优先级',
      specInfo: '规格信息',
      type: 'Submittal类型',
      ballInCourt: '负责人',
      pendingAction: '待处理操作',
      dueDate: '到期日',
      createdAt: '创建时间',
      updatedAt: '更新时间'
    },

    // 详细信息部分
    sections: {
      basicInfo: 'basicInfo',
      specInfo: '规格信息',
      keyDates: '关键日期',
      reviewProcess: '审核流程',
      attachments: '附件',
      responseInfo: '响应信息',
      assignees: '负责人',
      metadata: '时间戳'
    },

    // 字段标签
    fields: {
      title: '标题',
      description: '描述',
      status: '状态',
      state: '阶段',
      priority: '优先级',
      revision: '修订版本',
      projectNumber: '项目编号',
      type: '类型',
      specSection: '规格章节',
      specNumber: '规格编号',
      specTitle: '规格标题',
      subsection: '子章节',
      submittalPackage: '所属送审包',
      manager: '管理者',
      subcontractor: '负责承包商',
      creator: '建立者',
      watchers: '观察者',
      lastUpdater: '最后更新者',
      currentResponsible: '目前负责人',
      createdDate: '建立日期',
      lastUpdated: '最后更新',
      expectedSubmissionDate: '预计提交日',
      actualSubmissionDate: '实际送审日',
      reviewCompletedDate: '完成审核日',
      finalPublishDate: '最终发布日',
      dueDate: '截止日期',
      requiredSubmissionDate: '要求提交日期',
      requiredApprovalDate: '要求批准日期',
      requiredOnSiteDate: '要求现场日期',
      publishDate: '发布日期',
      responseComment: '响应评论',
      responseAuthor: '响应作者',
      responseTime: '响应时间',
      finalResponse: '最终响应'
    },

    // 用户类型
    userTypes: {
      user: '用户',
      company: '公司',
      role: '角色'
    },

    // 到期状态
    dueStatus: {
      overdue: '已过期',
      dueSoon: '即将到期',
      normal: '正常'
    },

    // 日期标签
    dateLabels: {
      manager: '(管理员)',
      submitter: '(提交者)',
      approval: '(审批)',
      required: '(要求)',
      onSite: '(现场)'
    },

    // 负责人角色
    assigneeRoles: {
      current: '当前负责',
      manager: '管理员',
      completed: '已完成',
      watcher: '观察者'
    },

    // Ball in Court 类型
    ballInCourtTypes: {
      manager: '管理员',
      subcontractor: '负责承包商',
      reviewer: '审核员'
    },

    // 操作按钮
    actions: {
      viewDetail: '查看详情',
      refresh: '刷新',
      export: '导出',
      search: '搜索',
      filter: '筛选',
      retry: '重试'
    },

    // 审核流程
    reviewProcess: {
      noRevisions: '暂无审核历史',
      noSteps: '此版本暂无审核步骤',
      stepNumber: '步骤 {number}',
      revision: 'Revision {number}',
      latest: '最新',
      finalResponse: '最终回复: {response}',
      responseDays: '响应天数: {days} 天',
      startTime: '开始时间: {time}',
      completedTime: '完成时间: {time}',
      taskList: '任务列表',
      assignedTo: '分配给',
      required: '必需',
      reply: '回复',
      started: '开始: {time}',
      completed: '完成: {time}',
      dueDate: '截止: {date}',
      
      // 步骤状态
      stepStatus: {
        'not-started': '未开始',
        'in-progress': '进行中',
        'completed': '已完成'
      },
      
      // 任务状态  
      taskStatus: {
        'not-started': '未开始',
        'in-progress': '进行中', 
        'completed': '已完成'
      }
    },

    // 附件
    attachments: {
      title: '附件',
      count: '({count})',
      loading: '加载附件中...',
      noAttachments: '暂无附件'
    },


    // 活动日志
    activityLog: {
      title: '活动日志',
      count: '({count} 个事件)',
      loading: '加载活动日志中...'
    },

    // 操作
    actions: {
      retry: '重试'
    },

    // API数据
    apiData: {
      title: 'API 数据',
      basicData: 'Submittal 基本数据',
      basicDataDesc: '当前 Submittal 项目的完整 API 响应数据',
      attachmentsData: '附件数据',
      attachmentsDataDesc: '该 Submittal 项目的所有附件信息',
      revisionsData: '审核历史数据',
      revisionsDataDesc: '该 Submittal 项目的完整审核流程和历史记录',
      stepsData: '审核步骤 API 数据',
      stepsDataDesc: '该 Submittal 项目的审核步骤信息',
      templatesData: '审核模板 API 数据',
      templatesDataDesc: '该项目配置的审核模板信息',
      apiCallInfo: 'API 调用信息',
      apiCallInfoDesc: '本页面使用的 API 端点和调用状态'
    },

    // 调试信息
    debug: {
      title: '调试信息',
      workflowDataStatus: '工作流数据状态：',
      revisionsApi: 'Revisions API',
      stepsApi: 'Steps API', 
      templatesApi: 'Templates API',
      records: '条记录',
      analysisResult: '分析结果：',
      noTemplatesConfigured: '该项目未配置审核模板 - 这可能是 Steps API 返回空数据的主要原因',
      templatesConfigured: '项目已配置 {count} 个审核模板',
      enteredReviewProcess: '该项目已进入审核流程 ({time})',
      notEnteredReviewProcess: '该项目可能尚未进入审核流程',
      projectCompleted: '项目已完成 (状态: {state}) - 步骤数据可能仅在活跃审核期间可用',
      apiCallPaths: 'API 调用路径：'
    },

    // 统计信息
    stats: {
      total: '总计',
      required: '必需',
      open: '开放',
      closed: '关闭',
      void: '作废',
      draft: '草稿',
      inReview: '审核中'
    },

        // 工作流程
        workflow: {
          title: '送审工作流程',
          loading: '加载工作流程中...',
          noWorkflow: '无工作流程数据',
          noWorkflowDesc: '此送审项目没有配置或可用的工作流程步骤。',
          debugInfo: '调试信息',
          currentState: '当前状态',
          currentStatus: '当前状态',
          sentToReview: '已送审',
          templatesAvailable: '可用模板',
          statistics: '工作流程统计',
          
          // 阶段
          phases: {
            'not-started': '未开始',
            'submitted': '已提交',
            'sent-for-review': '已送审',
            'in-review': '审核中',
            'completed': '已完成'
          },
          
          // 步骤
          steps: {
            submitted: '已提交',
            submittedDesc: '送审项目已由承包商提交',
            sentForReview: '已送审',
            sentForReviewDesc: '送审项目已进入审核流程',
            reviewStep: '审核步骤 {number}',
            reviewStepDesc: '审批流程中的审核步骤',
            completed: '已完成',
            completedDesc: '送审工作流程已完成'
          },
          
          // 进度
          completed: '已完成',
          totalSteps: '总步骤数',
          completedSteps: '已完成步骤',
          totalTasks: '总任务数',
          completedTasks: '已完成任务',
          
          // 详情
          step: '步骤',
          stepTitle: '步骤 {number}',
          dueDate: '截止日期',
          responseTime: '响应时间',
          started: '已开始',
          submittedBy: '提交人',
          submittedAt: '提交时间',
          sentBy: '发送人',
          sentAt: '发送时间',
          completedAt: '完成时间',
          finalResponse: '最终响应',
          
          // 任务
          tasks: '任务',
          required: '必需',
          response: '响应',
          responseType: '响应类型',
          comment: '评论',
          respondedBy: '响应人',
          respondedAt: '响应时间',
          
          // 任务状态
          taskStatus: {
            'not-started': '未开始',
            'in-progress': '进行中',
            completed: '已完成'
          },
          
          // 模板
          availableTemplates: '可用模板'
        },

    // 消息提示
    messages: {
      loadSuccess: '加载成功',
      loadFailed: '加载 Submittal 失败: {error}',
      noProject: '未选择项目',
      missingParams: '缺少必要参数',
      exportSuccess: '导出成功',
      refreshSuccess: '刷新成功'
    }
  }
}
