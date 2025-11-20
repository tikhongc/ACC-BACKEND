/**
 * 实体缓存管理器
 * 统一管理用户、角色、公司的ID到名称映射关系
 * 支持用户ID、角色ID、公司ID的缓存和查询
 */

import { reactive } from 'vue'
import axios from 'axios'

// 缓存键名
const ENTITY_CACHE_KEY = 'acc_entity_cache'

/**
 * 实体缓存管理类
 */
class EntityCacheManager {
  constructor() {
    // 响应式数据存储
    this.data = reactive({
      // 项目级别的缓存 { projectId: { users: {}, roles: {}, companies: {} } }
      projectEntitiesMap: {},
      
      // 全局缓存（跨项目）
      globalEntitiesMap: {
        users: {},      // 用户ID -> 用户信息
        roles: {},      // 角色ID -> 角色信息  
        companies: {}   // 公司ID -> 公司信息
      },
      
      // 缓存时间戳
      cacheTimestamps: {},
      
      // 加载状态
      loading: {}
    })
    
    // 缓存过期时间（30分钟）
    this.cacheExpireTime = 30 * 60 * 1000
    
    // 加载本地缓存
    this.loadFromCache()
  }

  /**
   * 获取或加载项目实体数据
   * @param {string} projectId - 项目ID
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 实体映射对象
   */
  async getProjectEntities(projectId, forceRefresh = false) {
    if (!projectId) {
      console.error('❌ 项目ID为空')
      return { users: {}, roles: {}, companies: {} }
    }

    // 检查缓存
    if (!forceRefresh && this.isDataValid(projectId)) {
      console.log('🏢 使用缓存的实体数据')
      return this.data.projectEntitiesMap[projectId] || { users: {}, roles: {}, companies: {} }
    }

    // 加载新数据
    return await this.loadProjectEntities(projectId)
  }

  /**
   * 加载项目实体数据（用户、角色、公司）
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 实体映射对象
   */
  async loadProjectEntities(projectId, forceReload = false) {
    // 检查缓存是否有效
    if (!forceReload && this.isDataValid(projectId)) {
      const cached = this.data.projectEntitiesMap[projectId]
      console.log('✅ 使用缓存的实体数据:', {
        projectId,
        userCount: Object.keys(cached?.users || {}).length,
        roleCount: Object.keys(cached?.roles || {}).length,
        companyCount: Object.keys(cached?.companies || {}).length,
        cacheAge: Math.round((Date.now() - this.data.cacheTimestamps[projectId]) / 1000 / 60) + ' 分钟'
      })
      return cached
    }

    if (this.data.loading[projectId]) {
      console.log('⏳ 项目实体数据正在加载中...')
      
      // 等待加载完成
      let attempts = 0
      while (this.data.loading[projectId] && attempts < 30) { // 最多等待15秒
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }
      
      return this.data.projectEntitiesMap[projectId] || { users: {}, roles: {}, companies: {} }
    }

    try {
      console.log('🏢 开始加载项目实体数据:', projectId)
      this.data.loading[projectId] = true

      // 并行加载用户、角色、公司数据
      const [usersData, rolesData, companiesData] = await Promise.allSettled([
        this.loadUsers(projectId),
        this.loadRoles(projectId), 
        this.loadCompanies(projectId)
      ])

      // 调试：显示每个API的加载结果
      console.log('📊 实体数据加载结果:', {
        users: usersData.status === 'fulfilled' ? `成功 (${Object.keys(usersData.value).length}个)` : `失败: ${usersData.reason}`,
        roles: rolesData.status === 'fulfilled' ? `成功 (${Object.keys(rolesData.value).length}个)` : `失败: ${rolesData.reason}`,
        companies: companiesData.status === 'fulfilled' ? `成功 (${Object.keys(companiesData.value).length}个)` : `失败: ${companiesData.reason}`
      })

      const entities = {
        users: usersData.status === 'fulfilled' ? usersData.value : {},
        roles: rolesData.status === 'fulfilled' ? rolesData.value : {},
        companies: companiesData.status === 'fulfilled' ? companiesData.value : {}
      }

      // 缓存数据
      this.data.projectEntitiesMap[projectId] = entities
      this.data.cacheTimestamps[projectId] = Date.now()
      
      // 异步保存到本地缓存，不阻塞返回
      setTimeout(() => this.saveToCache(), 100)
      
      console.log(`✅ 项目实体数据加载成功:`, {
        users: Object.keys(entities.users).length,
        roles: Object.keys(entities.roles).length,
        companies: Object.keys(entities.companies).length
      })
      
      return entities

    } catch (error) {
      console.error('❌ 加载项目实体数据失败:', error)
      
      // 即使失败也要创建空的缓存结构
      const emptyEntities = { users: {}, roles: {}, companies: {} }
      this.data.projectEntitiesMap[projectId] = emptyEntities
      this.data.cacheTimestamps[projectId] = Date.now()
      
      return emptyEntities
    } finally {
      this.data.loading[projectId] = false
    }
  }

  /**
   * 加载用户数据
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 用户映射对象
   */
  async loadUsers(projectId) {
    try {
      console.log('👥 加载用户数据:', projectId)
      
      const response = await axios.get(`/api/users/project/${projectId}/users`, {
        params: {
          limit: 500,
          offset: 0,
          sort: 'name',
          fields: 'name,email,firstName,lastName,autodeskId,imageUrl,phone,jobTitle,companyName,status'
        },
        timeout: 30000
      })

      let userData = response.data
      if (response.data.status === 'success' && response.data.data) {
        userData = response.data.data
      }

      const usersMap = {}
      const users = userData.users || []
      
      console.log(`📊 开始处理 ${users.length} 个用户数据`)
      
      users.forEach((user, index) => {
        if (user.id) {
          const userInfo = {
            id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            autodeskId: user.autodeskId,
            imageUrl: user.imageUrl,
            phone: user.phone,
            jobTitle: user.jobTitle,
            companyName: user.companyName,
            status: user.status,
            displayName: this.getDisplayName(user),
            type: 'user'
          }
          
          // 🔑 关键修复：确保数字ID和字符串ID都能被正确映射
          const userId = user.id
          const userIdStr = String(userId)
          const userIdNum = Number(userId)
          
          // 添加到项目用户映射 - 使用原始ID
          usersMap[userId] = userInfo
          this.data.globalEntitiesMap.users[userId] = userInfo
          
          // 🔑 重要：如果ID是数字，同时添加字符串和数字形式的映射
          if (!isNaN(userIdNum) && userIdNum.toString() === userIdStr) {
            // 数字形式映射
            usersMap[userIdNum] = userInfo
            this.data.globalEntitiesMap.users[userIdNum] = userInfo
            
            // 字符串形式映射（如果不同的话）
            if (userIdStr !== userId) {
              usersMap[userIdStr] = userInfo
              this.data.globalEntitiesMap.users[userIdStr] = userInfo
            }
            
            console.log(`🔢 添加数字ID映射: ${userIdNum} (${typeof userIdNum}) → ${userInfo.displayName}`)
          }
          
          // 如果有autodeskId，也用autodeskId作为键添加映射
          if (user.autodeskId) {
            const autodeskId = user.autodeskId
            const autodeskIdStr = String(autodeskId)
            const autodeskIdNum = Number(autodeskId)
            
            usersMap[autodeskId] = userInfo
            this.data.globalEntitiesMap.users[autodeskId] = userInfo
            
            // 同样处理autodeskId的数字/字符串映射
            if (!isNaN(autodeskIdNum) && autodeskIdNum.toString() === autodeskIdStr) {
              usersMap[autodeskIdNum] = userInfo
              this.data.globalEntitiesMap.users[autodeskIdNum] = userInfo
              
              if (autodeskIdStr !== autodeskId) {
                usersMap[autodeskIdStr] = userInfo
                this.data.globalEntitiesMap.users[autodeskIdStr] = userInfo
              }
            }
            
            console.log(`🆔 添加Autodesk ID映射: ${autodeskId} → ${userInfo.displayName}`)
          }
          
          // 调试：显示前几个用户的映射情况
          if (index < 3) {
            console.log(`📝 用户映射示例 #${index + 1}:`, {
              原始ID: userId,
              类型: typeof userId,
              显示名: userInfo.displayName,
              autodeskId: user.autodeskId
            })
          }
        }
      })

      // 🔍 调试：显示缓存的所有用户ID（包括数字形式）
      const allUserIds = Object.keys(usersMap)
      const numericIds = allUserIds.filter(id => !isNaN(Number(id)) && Number(id).toString() === id)
      
      console.log(`✅ 用户数据加载成功: ${Object.keys(usersMap).length} 个映射条目`)
      console.log(`🔢 其中数字ID: ${numericIds.length} 个`, numericIds.slice(0, 10))
      
      
      return usersMap

    } catch (error) {
      console.error('❌ 加载用户数据失败:', error)
      return {}
    }
  }

  /**
   * 加载角色数据 - 使用项目用户API获取roleGroupId映射
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 角色映射对象
   */
  async loadRoles(projectId) {
    try {
      console.log('👔 加载角色数据 (使用项目用户API):', projectId)
      
      // 使用项目用户API获取完整的角色信息，包括roleGroupId
      const response = await axios.get(`/api/users/project/${projectId}/users`, {
        timeout: 30000,
        params: {
          fields: 'roleIds,roles'
        }
      })

      if (response.data.status !== 'success') {
        console.warn('⚠️ 项目用户API调用失败:', response.data.error)
        return await this.loadRolesFromProjects()
      }

      const rolesMap = {}
      const users = response.data.data?.users || []
      
      // 从所有用户的角色信息中提取角色映射
      users.forEach(user => {
        const roles = user.roles || []
        roles.forEach(role => {
          if (role.id && role.name && role.roleGroupId) {
            const roleInfo = {
              id: role.id, // UUID格式ID
              roleGroupId: role.roleGroupId, // 数字格式ID (这是issue中使用的)
              name: role.name,
              displayName: role.name,
              type: 'role',
              source: 'project_users_api'
            }
            
            // 使用UUID作为主键
            rolesMap[role.id] = roleInfo
            this.data.globalEntitiesMap.roles[role.id] = roleInfo
            
            // 使用角色名称作为键
            rolesMap[role.name] = roleInfo
            this.data.globalEntitiesMap.roles[role.name] = roleInfo
            
            // 🔑 关键：使用roleGroupId (数字ID) 作为键
            // 这是issue数据中assignedTo字段使用的ID格式
            rolesMap[role.roleGroupId] = roleInfo
            this.data.globalEntitiesMap.roles[role.roleGroupId] = roleInfo
            
            console.log('✅ 添加角色映射:', {
              uuid: role.id,
              roleGroupId: role.roleGroupId,
              name: role.name
            })
          }
        })
      })

      console.log(`✅ 角色数据加载成功: ${Object.keys(rolesMap).length} 个映射条目`)
      
      // 显示数字ID到角色名称的映射
      const numericMappings = {}
      Object.values(rolesMap).forEach(role => {
        if (role.roleGroupId && /^\d+$/.test(role.roleGroupId)) {
          numericMappings[role.roleGroupId] = role.name
        }
      })
      console.log('🔢 数字ID到角色名称映射:', numericMappings)
      
      return rolesMap

    } catch (error) {
      console.warn('⚠️ 项目用户API调用失败:', error.response?.status, error.message)
      
      // 尝试备用方法
      try {
        console.log('🔄 尝试备用角色获取方法...')
        return await this.loadRolesFromProjects()
      } catch (backupError) {
        console.warn('⚠️ 备用角色获取也失败:', backupError.message)
        return {}
      }
    }
  }

  /**
   * 从项目信息中获取角色数据（备用方法）
   * @returns {Promise<Object>} 角色映射对象
   */
  async loadRolesFromProjects() {
    try {
      console.log('📋 从项目信息中提取角色数据...')
      
      // 获取账户信息，其中包含项目数据
      const accountResponse = await axios.get('/api/auth/account-info', {
        timeout: 15000
      })
      
      if (accountResponse.data.status !== 'success') {
        return {}
      }
      
      const rolesMap = {}
      const projects = accountResponse.data.projects?.data || []
      
      // 从项目数据中提取角色信息
      projects.forEach(project => {
        // 检查项目属性中是否有角色相关信息
        if (project.attributes) {
          const attrs = project.attributes
          
          // 常见的角色相关字段
          const roleFields = ['role', 'userRole', 'projectRole', 'permission']
          
          roleFields.forEach(field => {
            if (attrs[field]) {
              const roleId = attrs[field]
              const roleName = this.formatRoleName(roleId)
              
              rolesMap[roleId] = {
                id: roleId,
                name: roleName,
                projectId: project.id,
                projectName: attrs.name || project.id,
                source: 'project_attributes',
                displayName: roleName,
                type: 'role'
              }
            }
          })
        }
      })
      
      // 如果没有找到角色，创建一些默认角色
      if (Object.keys(rolesMap).length === 0) {
        const defaultRoles = [
          { id: 'project_admin', name: '项目管理员' },
          { id: 'project_user', name: '项目用户' },
          { id: 'viewer', name: '查看者' },
          { id: 'contributor', name: '贡献者' }
        ]
        
        defaultRoles.forEach(role => {
          rolesMap[role.id] = {
            id: role.id,
            name: role.name,
            source: 'default',
            displayName: role.name,
            type: 'role'
          }
        })
        
        console.log('📋 使用默认角色列表')
      }
      
      console.log(`✅ 从项目信息获取角色成功: ${Object.keys(rolesMap).length} 个角色`)
      return rolesMap
      
    } catch (error) {
      console.warn('⚠️ 从项目信息获取角色失败:', error.message)
      return {}
    }
  }

  /**
   * 格式化角色名称
   * @param {string} roleId - 角色ID
   * @returns {string} 格式化的角色名称
   */
  formatRoleName(roleId) {
    if (!roleId) return '未知角色'
    
    // 常见角色ID到中文名称的映射
    const roleNameMap = {
      'project_admin': '项目管理员',
      'admin': '管理员',
      'project_user': '项目用户',
      'user': '用户',
      'viewer': '查看者',
      'contributor': '贡献者',
      'editor': '编辑者',
      'owner': '所有者',
      'member': '成员'
    }
    
    return roleNameMap[roleId] || `角色-${roleId}`
  }

  /**
   * 加载公司数据 - 使用账户级别API
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 公司映射对象
   */
  async loadCompanies(projectId) {
    try {
      console.log('🏢 加载公司数据 (使用账户API):', projectId)
      
      // 首先获取账户信息来获取账户ID
      const accountResponse = await axios.get('/api/auth/account-info', {
        timeout: 15000
      })
      
      if (accountResponse.data.status !== 'success' || !accountResponse.data.hub?.realAccountId) {
        console.warn('⚠️ 无法获取账户信息，跳过公司加载:', {
          status: accountResponse.data.status,
          hasHub: !!accountResponse.data.hub,
          realAccountId: accountResponse.data.hub?.realAccountId,
          responseData: accountResponse.data
        })
        return {}
      }
      
      const accountId = accountResponse.data.hub.realAccountId
      
      console.log('📋 使用账户API获取公司:', { accountId })
      
      const response = await axios.get(`/api/account/${accountId}/companies`, {
        timeout: 30000,
        params: {
          limit: 200,
          sort: 'name'
        }
      })

      if (response.data.status !== 'success') {
        console.warn('⚠️ 公司API调用失败:', {
          status: response.data.status,
          error: response.data.error,
          responseData: response.data
        })
        return {}
      }

      const companiesMap = {}
      const companies = response.data.data?.companies || []
      
      companies.forEach(company => {
        if (company.id) {
          const companyInfo = {
            id: company.id,
            name: company.name || `公司-${company.id}`,
            trade: company.trade,
            description: company.description,
            website: company.website,
            phone: company.phone,
            address: company.address,
            email: company.email,
            status: company.status,
            memberCount: company.memberCount || 0,
            displayName: company.name || `公司-${company.id}`,
            type: 'company'
          }
          
          // 添加到项目公司映射
          companiesMap[company.id] = companyInfo
          
          // 添加到全局公司映射
          this.data.globalEntitiesMap.companies[company.id] = companyInfo
        }
      })

      // 尝试从项目公司API获取真实的member_group_id数据
      await this.loadRealProjectCompanies(projectId, companiesMap)

      console.log(`✅ 公司数据加载成功: ${Object.keys(companiesMap).length} 个公司`)
      return companiesMap

    } catch (error) {
      console.error('❌ 公司API调用异常:', {
        status: error.response?.status,
        message: error.message,
        responseData: error.response?.data,
        stack: error.stack
      })
      
      // 如果API失败，返回空映射
      console.log('❌ 公司API调用失败，返回空映射')
      return {}
    }
  }

  // 已删除临时公司映射方法 - 只使用真实API数据

  /**
   * 从项目公司API获取真实的公司数据（包含member_group_id）
   * @param {string} projectId - 项目ID
   * @param {Object} companiesMap - 现有的公司映射对象
   */
  async loadRealProjectCompanies(projectId, companiesMap) {
    try {
      console.log('🏢 尝试从项目公司API获取真实数据:', projectId)
      
      const response = await axios.get(`/api/users/project/${projectId}/companies`, {
        timeout: 30000
      })

      if (response.data.status === 'success') {
        const realCompanies = response.data.data?.companies || []
        
        console.log(`📡 项目公司API返回 ${realCompanies.length} 个公司`)
        
        // 处理真实的公司数据
        realCompanies.forEach(company => {
          if (company.id && company.name) {
            const companyInfo = {
              id: company.id,
              member_group_id: company.member_group_id, // 🔑 真实的数字ID
              name: company.name,
              displayName: company.name,
              type: 'company',
              trade: company.trade,
              description: company.description,
              address: company.address,
              phone: company.phone,
              website: company.website,
              erp_id: company.erp_id,
              tax_id: company.tax_id,
              account_id: company.account_id,
              project_id: company.project_id,
              created_at: company.created_at,
              updated_at: company.updated_at,
              source: 'real_project_companies_api'
            }
            
            // 使用UUID作为主键
            companiesMap[company.id] = companyInfo
            this.data.globalEntitiesMap.companies[company.id] = companyInfo
            
            // 使用公司名称作为键
            companiesMap[company.name] = companyInfo
            this.data.globalEntitiesMap.companies[company.name] = companyInfo
            
            // 🔑 关键：使用member_group_id (数字ID) 作为键
            if (company.member_group_id) {
              companiesMap[company.member_group_id] = companyInfo
              this.data.globalEntitiesMap.companies[company.member_group_id] = companyInfo
              
              console.log('✅ 添加真实公司映射:', {
                uuid: company.id,
                member_group_id: company.member_group_id,
                name: company.name
              })
            } else {
              console.log('⚠️ 公司缺少member_group_id:', {
                uuid: company.id,
                name: company.name
              })
            }
          }
        })
        
        const companiesWithMemberGroupId = realCompanies.filter(c => c.member_group_id)
        console.log(`✅ 真实公司数据处理完成: ${companiesWithMemberGroupId.length}/${realCompanies.length} 个公司有member_group_id`)
        
        // 显示数字ID到公司名称的映射
        const numericMappings = {}
        companiesWithMemberGroupId.forEach(company => {
          if (company.member_group_id && /^\d+$/.test(company.member_group_id)) {
            numericMappings[company.member_group_id] = company.name
          }
        })
        console.log('🔢 真实数字ID到公司名称映射:', numericMappings)
        
        return true // 成功获取真实数据
      } else {
        console.warn('⚠️ 项目公司API调用失败:', response.data.error)
      }
    } catch (error) {
      console.warn('⚠️ 项目公司API调用异常:', error.message)
    }
    
    // 如果真实API失败，不添加任何写死的映射
    console.log('❌ 项目公司API不可用，跳过公司数字ID映射')
    return false // API不可用
  }

  // 已删除写死的公司映射增强方法 - 只使用真实API数据

  /**
   * 获取实体显示名称（通用方法）
   * @param {string} entityId - 实体ID
   * @param {string} entityType - 实体类型 ('user', 'role', 'company', 'auto')
   * @param {string} projectId - 项目ID（可选）
   * @returns {string} 显示名称
   */
  getEntityDisplayName(entityId, entityType = 'auto', projectId = null) {
    if (!entityId) return '未知实体'

    console.log('🔍 查找实体显示名称:', { entityId, entityType, projectId })

    // 如果指定了实体类型，直接查找
    if (entityType !== 'auto') {
      const entity = this.getEntityById(entityId, entityType, projectId)
      if (entity) {
        console.log('✅ 找到指定类型实体:', { entityId, entityType, displayName: entity.displayName, entity })
        return entity.displayName || entity.name || entityId
      }
      
      // 🔍 调试：显示缓存状态
      console.log('❌ 未找到指定类型实体，检查缓存状态:', {
        entityId,
        entityType,
        projectId,
        projectCache: projectId ? !!this.data.projectEntitiesMap[projectId] : 'N/A',
        globalCache: Object.keys(this.data.globalEntitiesMap[entityType + 's'] || {}).length,
        allGlobalKeys: Object.keys(this.data.globalEntitiesMap[entityType + 's'] || {})
      })
      
      return entityType === 'role' ? `角色-${entityId}` : 
             entityType === 'company' ? `公司-${entityId}` : 
             entityType === 'user' ? `用户-${entityId}` : entityId
    }

    // 自动检测实体类型
    const types = ['user', 'role', 'company']
    for (const type of types) {
      const entity = this.getEntityById(entityId, type, projectId)
      if (entity) {
        console.log('✅ 自动检测找到实体:', { entityId, type, displayName: entity.displayName })
        return entity.displayName || entity.name || entityId
      }
    }

    console.log('❌ 未找到任何匹配实体:', entityId)
    return entityId
  }

  /**
   * 获取实体类型的复数形式
   * @param {string} entityType - 实体类型 (user, role, company)
   * @returns {string} 复数形式
   */
  getEntityTypePlural(entityType) {
    const pluralMap = {
      'user': 'users',
      'role': 'roles', 
      'company': 'companies'
    }
    return pluralMap[entityType] || entityType + 's'
  }

  /**
   * 根据ID和类型获取实体信息
   * @param {string} entityId - 实体ID
   * @param {string} entityType - 实体类型 ('user', 'role', 'company')
   * @param {string} projectId - 项目ID（可选）
   * @returns {Object|null} 实体信息
   */
  getEntityById(entityId, entityType, projectId = null) {
    if (!entityId || !entityType) return null

    // 🔑 关键修复：尝试多种ID格式查找
    const searchIds = []
    
    // 添加原始ID
    if (entityId !== null && entityId !== undefined && entityId !== '') {
      searchIds.push(entityId)
    }
    
    // 添加字符串形式（如果不同）
    const entityIdStr = String(entityId)
    if (entityIdStr !== entityId && entityIdStr !== '' && !searchIds.includes(entityIdStr)) {
      searchIds.push(entityIdStr)
    }
    
    // 添加数字形式（仅当是有效数字时）
    const entityIdNum = Number(entityId)
    if (!isNaN(entityIdNum) && entityIdNum.toString() === entityIdStr && !searchIds.includes(entityIdNum)) {
      searchIds.push(entityIdNum)
    }

    // 🔧 修复：使用正确的复数形式
    const entityTypePlural = this.getEntityTypePlural(entityType)

    console.log(`🔍 查找实体 ${entityType}:`, {
      原始ID: entityId,
      搜索ID列表: searchIds,
      项目ID: projectId,
      实体类型复数: entityTypePlural
    })

    // 优先从项目缓存查找
    if (projectId && this.data.projectEntitiesMap[projectId]) {
      const projectEntities = this.data.projectEntitiesMap[projectId]
      const entitiesMap = projectEntities[entityTypePlural]
      
      if (entitiesMap) {
        for (const searchId of searchIds) {
          const entity = entitiesMap[searchId]
          if (entity) {
            console.log(`✅ 在项目缓存中找到 ${entityType}:`, {
              搜索ID: searchId,
              找到的实体: entity.displayName || entity.name
            })
            return entity
          }
        }
      }
    }

    // 从全局缓存查找
    const globalEntitiesMap = this.data.globalEntitiesMap[entityTypePlural]
    if (globalEntitiesMap) {
      for (const searchId of searchIds) {
        const entity = globalEntitiesMap[searchId]
        if (entity) {
          console.log(`✅ 在全局缓存中找到 ${entityType}:`, {
            搜索ID: searchId,
            找到的实体: entity.displayName || entity.name
          })
          return entity
        }
      }
    }

    // 🔍 详细调试信息
    const projectCacheKeys = projectId && this.data.projectEntitiesMap[projectId] ? 
      Object.keys(this.data.projectEntitiesMap[projectId][entityTypePlural] || {}) : []
    const globalCacheKeys = Object.keys(this.data.globalEntitiesMap[entityTypePlural] || {})
    
    console.log(`❌ 未找到 ${entityType} 实体:`, {
      原始ID: entityId,
      搜索的ID: searchIds,
      实体类型复数: entityTypePlural,
      项目缓存存在: !!(projectId && this.data.projectEntitiesMap[projectId]),
      项目缓存大小: projectCacheKeys.length,
      项目缓存示例ID: projectCacheKeys.slice(0, 10),
      全局缓存大小: globalCacheKeys.length,
      全局缓存示例ID: globalCacheKeys.slice(0, 10),
      是否包含目标ID: {
        项目缓存: searchIds.some(id => projectCacheKeys.includes(String(id))),
        全局缓存: searchIds.some(id => globalCacheKeys.includes(String(id)))
      }
    })

    return null
  }

  /**
   * 获取用户显示名称（兼容原有接口）
   * @param {string} userId - 用户ID
   * @param {string} projectId - 项目ID（可选）
   * @returns {string} 用户显示名称
   */
  getUserDisplayName(userId, projectId = null) {
    return this.getEntityDisplayName(userId, 'user', projectId)
  }

  /**
   * 获取角色显示名称
   * @param {string} roleId - 角色ID
   * @param {string} projectId - 项目ID（可选）
   * @returns {string} 角色显示名称
   */
  getRoleDisplayName(roleId, projectId = null) {
    return this.getEntityDisplayName(roleId, 'role', projectId)
  }

  /**
   * 获取公司显示名称
   * @param {string} companyId - 公司ID
   * @param {string} projectId - 项目ID（可选）
   * @returns {string} 公司显示名称
   */
  getCompanyDisplayName(companyId, projectId = null) {
    return this.getEntityDisplayName(companyId, 'company', projectId)
  }

  /**
   * 根据分配类型获取显示名称
   * @param {string} assignedTo - 分配对象ID
   * @param {string} assignedToType - 分配类型 ('user', 'role', 'company')
   * @param {string} projectId - 项目ID（可选）
   * @returns {string} 显示名称
   */
  getAssignedToDisplayName(assignedTo, assignedToType, projectId = null) {
    if (!assignedTo) return '未分配'
    
    console.log('🔍 EntityCache获取分配显示名称:', { assignedTo, assignedToType, projectId })
    
    let result
    switch (assignedToType) {
      case 'user':
        result = this.getUserDisplayName(assignedTo, projectId)
        console.log('👤 EntityCache用户结果:', { assignedTo, result })
        return result
      case 'role':
        result = this.getRoleDisplayName(assignedTo, projectId)
        console.log('👔 EntityCache角色结果:', { assignedTo, result })
        return result
      case 'company':
        result = this.getCompanyDisplayName(assignedTo, projectId)
        console.log('🏢 EntityCache公司结果:', { assignedTo, result })
        return result
      default:
        result = this.getEntityDisplayName(assignedTo, 'auto', projectId)
        console.log('❓ EntityCache自动检测结果:', { assignedTo, assignedToType, result })
        return result
    }
  }

  /**
   * 根据观察者类型获取显示名称（通用方法）
   * @param {string} watcherId - 观察者ID
   * @param {string} watcherType - 观察者类型 ('user', 'role', 'company')
   * @param {string} projectId - 项目ID（可选）
   * @returns {string} 显示名称
   */
  getWatcherDisplayName(watcherId, watcherType, projectId = null) {
    if (!watcherId) return '未知观察者'
    
    console.log('🔍 EntityCache获取观察者显示名称:', { watcherId, watcherType, projectId })
    
    // 观察者本质上和分配对象是一样的逻辑，直接复用
    return this.getAssignedToDisplayName(watcherId, watcherType, projectId)
  }

  /**
   * 通用实体显示名称获取方法（适用于任何带类型的实体）
   * @param {string} entityId - 实体ID
   * @param {string} entityType - 实体类型 ('user', 'role', 'company')
   * @param {string} projectId - 项目ID（可选）
   * @param {string} defaultPrefix - 默认前缀（如 '观察者', '分配给' 等）
   * @returns {string} 显示名称
   */
  getTypedEntityDisplayName(entityId, entityType, projectId = null, defaultPrefix = '实体') {
    if (!entityId) return `未知${defaultPrefix}`
    
    console.log(`🔍 EntityCache获取${defaultPrefix}显示名称:`, { entityId, entityType, projectId })
    
    // 统一使用分配显示名称的逻辑
    return this.getAssignedToDisplayName(entityId, entityType, projectId)
  }

  /**
   * 获取实体显示名称
   * @param {Object} entity - 实体对象
   * @returns {string} 显示名称
   */
  getDisplayName(entity) {
    if (!entity) return '未知实体'
    
    // 优先级：name > firstName + lastName > email > id
    if (entity.name && entity.name.trim()) {
      return entity.name.trim()
    }
    
    const fullName = `${entity.firstName || ''} ${entity.lastName || ''}`.trim()
    if (fullName) {
      return fullName
    }
    
    if (entity.email) {
      return entity.email
    }
    
    return entity.id || '未知实体'
  }

  /**
   * 检查缓存是否有效
   * @param {string} projectId - 项目ID
   * @returns {boolean} 是否有效
   */
  isDataValid(projectId) {
    const timestamp = this.data.cacheTimestamps[projectId]
    if (!timestamp) return false
    
    const now = Date.now()
    const isValid = (now - timestamp) < this.cacheExpireTime
    
    if (!isValid) {
      console.log(`⏰ 项目 ${projectId} 实体缓存已过期`)
    }
    
    return isValid && !!this.data.projectEntitiesMap[projectId]
  }

  /**
   * 清除项目缓存
   * @param {string} projectId - 项目ID
   */
  clearProjectCache(projectId) {
    if (projectId) {
      delete this.data.projectEntitiesMap[projectId]
      delete this.data.cacheTimestamps[projectId]
      delete this.data.loading[projectId]
      console.log('🗑️ 已清除项目实体缓存:', projectId)
    }
    this.saveToCache()
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    console.log('🗑️ 清除所有实体缓存')
    this.data.projectEntitiesMap = {}
    this.data.globalEntitiesMap = { users: {}, roles: {}, companies: {} }
    this.data.cacheTimestamps = {}
    this.data.loading = {}
    
    localStorage.removeItem(ENTITY_CACHE_KEY)
  }

  /**
   * 保存到本地缓存
   */
  saveToCache() {
    try {
      const cacheData = {
        projectEntitiesMap: this.data.projectEntitiesMap,
        globalEntitiesMap: this.data.globalEntitiesMap,
        cacheTimestamps: this.data.cacheTimestamps,
        saved_at: Date.now(),
        version: '1.1.0'
      }
      
      localStorage.setItem(ENTITY_CACHE_KEY, JSON.stringify(cacheData))
      
      // 保存缓存统计信息
      const stats = {
        lastSaved: new Date().toISOString(),
        projectCount: Object.keys(this.data.projectEntitiesMap).length,
        userCount: Object.keys(this.data.globalEntitiesMap.users).length,
        roleCount: Object.keys(this.data.globalEntitiesMap.roles).length,
        companyCount: Object.keys(this.data.globalEntitiesMap.companies).length
      }
      
      console.log('💾 实体缓存已保存:', stats)
    } catch (error) {
      console.error('❌ 保存实体缓存失败:', error)
    }
  }

  /**
   * 从本地缓存加载
   */
  loadFromCache() {
    try {
      const cachedData = localStorage.getItem(ENTITY_CACHE_KEY)
      if (!cachedData) {
        console.log('📦 没有找到本地缓存数据')
        return false
      }

      const parsed = JSON.parse(cachedData)
      
      // 检查缓存是否过期（4小时）
      const now = Date.now()
      const cacheAge = now - (parsed.saved_at || 0)
      const maxAge = 4 * 60 * 60 * 1000 // 4小时
      
      if (cacheAge > maxAge) {
        console.log(`⏰ 实体缓存已过期 (${Math.round(cacheAge / 1000 / 60 / 60)}小时)，清除缓存`)
        localStorage.removeItem(ENTITY_CACHE_KEY)
        return false
      }

      // 恢复数据，保持响应式
      if (parsed.projectEntitiesMap) {
        Object.assign(this.data.projectEntitiesMap, parsed.projectEntitiesMap)
      }
      if (parsed.globalEntitiesMap) {
        Object.assign(this.data.globalEntitiesMap.users, parsed.globalEntitiesMap.users || {})
        Object.assign(this.data.globalEntitiesMap.roles, parsed.globalEntitiesMap.roles || {})
        Object.assign(this.data.globalEntitiesMap.companies, parsed.globalEntitiesMap.companies || {})
      }
      if (parsed.cacheTimestamps) {
        Object.assign(this.data.cacheTimestamps, parsed.cacheTimestamps)
      }

      const stats = {
        cacheAge: Math.round(cacheAge / 1000 / 60) + ' 分钟',
        projectCount: Object.keys(this.data.projectEntitiesMap).length,
        userCount: Object.keys(this.data.globalEntitiesMap.users).length,
        roleCount: Object.keys(this.data.globalEntitiesMap.roles).length,
        companyCount: Object.keys(this.data.globalEntitiesMap.companies).length
      }

      console.log('📦 从本地缓存恢复实体数据:', stats)
      return true
    } catch (error) {
      console.error('❌ 加载实体缓存失败:', error)
      localStorage.removeItem(ENTITY_CACHE_KEY)
      return false
    }
  }

  /**
   * 获取缓存状态
   * @param {string} projectId - 项目ID
   * @returns {Object} 缓存状态信息
   */
  getCacheStatus(projectId) {
    if (!projectId) return null

    const entities = this.data.projectEntitiesMap[projectId]
    const isValid = this.isDataValid(projectId)
    const timestamp = this.data.cacheTimestamps[projectId]

    return {
      project_id: projectId,
      cache_status: {
        exists: !!entities,
        valid: isValid,
        user_count: entities?.users ? Object.keys(entities.users).length : 0,
        role_count: entities?.roles ? Object.keys(entities.roles).length : 0,
        company_count: entities?.companies ? Object.keys(entities.companies).length : 0,
        timestamp: timestamp,
        loading: !!this.data.loading[projectId]
      }
    }
  }

  /**
   * 调试方法：查找特定ID在缓存中的情况
   * @param {string|number} searchId - 要查找的ID
   * @param {string} projectId - 项目ID（可选）
   * @returns {Object} 查找结果
   */
  debugFindId(searchId, projectId = null) {
    const results = {
      searchId: searchId,
      searchIdType: typeof searchId,
      projectId: projectId,
      found: {
        users: {},
        roles: {},
        companies: {}
      },
      searchVariants: (() => {
        const variants = []
        
        // 添加原始ID
        if (searchId !== null && searchId !== undefined && searchId !== '') {
          variants.push(searchId)
        }
        
        // 添加字符串形式（如果不同）
        const searchIdStr = String(searchId)
        if (searchIdStr !== searchId && searchIdStr !== '' && !variants.includes(searchIdStr)) {
          variants.push(searchIdStr)
        }
        
        // 添加数字形式（仅当是有效数字时）
        const searchIdNum = Number(searchId)
        if (!isNaN(searchIdNum) && searchIdNum.toString() === searchIdStr && !variants.includes(searchIdNum)) {
          variants.push(searchIdNum)
        }
        
        return variants
      })()
    }

    // 搜索所有变体
    for (const variant of results.searchVariants) {
      // 在项目缓存中搜索
      if (projectId && this.data.projectEntitiesMap[projectId]) {
        const projectEntities = this.data.projectEntitiesMap[projectId]
        
        if (projectEntities.users[variant]) {
          results.found.users[`project_${variant}`] = projectEntities.users[variant]
        }
        if (projectEntities.roles[variant]) {
          results.found.roles[`project_${variant}`] = projectEntities.roles[variant]
        }
        if (projectEntities.companies[variant]) {
          results.found.companies[`project_${variant}`] = projectEntities.companies[variant]
        }
      }

      // 在全局缓存中搜索
      if (this.data.globalEntitiesMap.users[variant]) {
        results.found.users[`global_${variant}`] = this.data.globalEntitiesMap.users[variant]
      }
      if (this.data.globalEntitiesMap.roles[variant]) {
        results.found.roles[`global_${variant}`] = this.data.globalEntitiesMap.roles[variant]
      }
      if (this.data.globalEntitiesMap.companies[variant]) {
        results.found.companies[`global_${variant}`] = this.data.globalEntitiesMap.companies[variant]
      }
    }

    // 统计结果
    results.summary = {
      totalFound: Object.keys(results.found.users).length + 
                  Object.keys(results.found.roles).length + 
                  Object.keys(results.found.companies).length,
      userMatches: Object.keys(results.found.users).length,
      roleMatches: Object.keys(results.found.roles).length,
      companyMatches: Object.keys(results.found.companies).length
    }

    console.log(`🔍 调试查找ID ${searchId}:`, results)
    return results
  }

  /**
   * 调试方法：显示缓存概览
   * @param {string} projectId - 项目ID（可选）
   */
  debugCacheOverview(projectId = null) {
    const overview = {
      timestamp: new Date().toISOString(),
      projectId: projectId,
      global_cache: {
        users: Object.keys(this.data.globalEntitiesMap.users).length,
        roles: Object.keys(this.data.globalEntitiesMap.roles).length,
        companies: Object.keys(this.data.globalEntitiesMap.companies).length
      },
      project_cache: null
    }

    if (projectId && this.data.projectEntitiesMap[projectId]) {
      const projectEntities = this.data.projectEntitiesMap[projectId]
      overview.project_cache = {
        users: Object.keys(projectEntities.users || {}).length,
        roles: Object.keys(projectEntities.roles || {}).length,
        companies: Object.keys(projectEntities.companies || {}).length,
        cache_age: this.data.cacheTimestamps[projectId] ? 
          Math.round((Date.now() - this.data.cacheTimestamps[projectId]) / 1000 / 60) + ' 分钟' : 
          '未知'
      }

      // 显示一些示例ID
      const sampleUserIds = Object.keys(projectEntities.users || {}).slice(0, 5)
      const numericUserIds = sampleUserIds.filter(id => !isNaN(Number(id)))
      
      overview.sample_data = {
        sample_user_ids: sampleUserIds,
        numeric_user_ids: numericUserIds,
        sample_count: sampleUserIds.length
      }
    }

    console.log('📊 缓存概览:', overview)
    return overview
  }
}

// 创建单例实例
const entityCache = new EntityCacheManager()

// 导出实例和便捷方法
export default entityCache

export const {
  getProjectEntities,
  getUserDisplayName,
  getRoleDisplayName,
  getCompanyDisplayName,
  getAssignedToDisplayName,
  getWatcherDisplayName,
  getTypedEntityDisplayName,
  getEntityById,
  getEntityDisplayName,
  clearProjectCache,
  clearAllCache,
  getCacheStatus,
  debugFindId,
  debugCacheOverview
} = entityCache
