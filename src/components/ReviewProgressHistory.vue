<template>
  <div class="review-progress-history">
    <!-- 加载状态 -->
    <div v-if="loading" class="progress-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ t('reviewProgressHistory.loading') }}</span>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="progress-error">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
        show-icon />
      <el-button 
        type="primary" 
        size="small" 
        @click="loadProgressHistory"
        style="margin-top: 8px;">
        {{ t('reviewProgressHistory.retryLoad') }}
      </el-button>
    </div>
    
    <!-- 进度历史内容 -->
    <div v-else-if="progressData" class="progress-content">
      
      
      <!-- 进度时间线 -->
      <div class="progress-timeline">
        <div class="timeline-header">
          <h4>{{ t('reviewProgressHistory.timelineTitle') }}</h4>
          <div class="timeline-actions">
          <div class="timeline-stats">
            <span class="stats-item">{{ t('reviewProgressHistory.stepsCount', { count: filteredProgressData.length }) }}</span>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              :loading="loading"
              @click="refreshProgressHistory"
              class="refresh-btn">
              <el-icon><Refresh /></el-icon>
              {{ t('reviewProgressHistory.refresh') }}
            </el-button>
          </div>
        </div>
        
        <div class="timeline-container">
          <div 
            v-for="(progress, index) in filteredProgressData" 
            :key="`${progress.step_id}-${index}`"
            :class="['timeline-item', getProgressStatusClass(progress), { 
              'returned-step': isReturnedStep(progress, index),
              'void-step': isVoidStep(progress)
            }]">
            
            <!-- 时间线节点 -->
            <div class="timeline-node">
              <div class="timeline-dot">
                <div class="dot-inner">
                  <!-- 根据状态显示不同图标 -->
                  <el-icon v-if="progress.status === 'VOID'" class="status-icon void"><ArrowLeft /></el-icon>
                  <el-icon v-else-if="progress.status === 'SUBMITTED'" class="status-icon submitted"><Check /></el-icon>
                  <el-icon v-else-if="progress.status === 'CLAIMED'" class="status-icon claimed"><User /></el-icon>
                  <el-icon v-else-if="progress.status === 'PENDING'" class="status-icon pending"><Clock /></el-icon>
                  <el-icon v-else-if="progress.status === 'UNCLAIMED'" class="status-icon unclaimed"><Clock /></el-icon>
                  <el-icon v-else class="status-icon default"><Document /></el-icon>
                </div>
              </div>
              <div v-if="index < filteredProgressData.length - 1" class="timeline-line"></div>
            </div>
            
            <!-- 进度内容卡片 -->
            <div class="timeline-content-card">
              <!-- 卡片头部 -->
              <div class="card-header">
                <div class="step-info-header">
                  <div class="step-title-section">
                    <div class="step-title">
                      <span class="step-number">{{ index + 1 }}</span>
                      <h5 class="step-name">{{ getStepDisplayName(progress) }}</h5>
                      <div class="status-tags">
                        <!-- 多人审核标签 -->
                        <span v-if="isMultiReviewerStep(progress, index)" 
                              class="status-tag multi-reviewer-tag">
                          👥 {{ t('reviewProgressHistory.ui.multiReview') }} {{ getMultiReviewerIndex(progress, index) }}
                        </span>
                        <!-- 主状态标签 -->
                        <span v-else
                          class="status-tag"
                          :style="{ 
                            backgroundColor: getStatusTag(progress).color + '20',
                            color: getStatusTag(progress).color,
                            borderColor: getStatusTag(progress).color
                          }">
                          {{ getStatusTag(progress).text }}
                        </span>
                        <!-- 返回标识 -->
                        <span v-if="isReturnedStep(progress, index) && !isVoidStep(progress)" class="return-badge">
                          {{ t('reviewProgressHistory.ui.returned') }}
                        </span>
                      </div>
                    </div>
                    <!-- 时间标签组 -->
                    <div class="time-tags-group">
                      <!-- 完成时间或截止时间 -->
                      <div class="time-tag completed-time">
                        <el-icon class="time-icon"><Clock /></el-icon>
                        <span class="time-text">{{ getTimeDisplayText(progress) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 展开/收纳按钮 - 移到最右边 -->
                <div class="expand-toggle">
                  <el-button 
                    type="text" 
                    size="small"
                    @click="toggleStepExpansion(`${progress.step_id}-${index}`)"
                    :class="['expand-btn', { 'expanded': isStepExpanded(`${progress.step_id}-${index}`) }]">
                    <el-icon :class="{ 'rotate-180': isStepExpanded(`${progress.step_id}-${index}`) }">
                      <ArrowDown />
                    </el-icon>
                    {{ isStepExpanded(`${progress.step_id}-${index}`) ? t('reviewProgressHistory.ui.collapse') : t('reviewProgressHistory.ui.expand') }}
                  </el-button>
                </div>
              </div>
              
              <!-- 可展开的详细信息 -->
              <div v-show="isStepExpanded(`${progress.step_id}-${index}`)" class="expandable-content">
                <!-- 步骤描述信息 -->
                <div class="step-description-card">
                  <div class="description-content">
                    <div class="description-text">
                      <span class="step-description">
                        {{ getStepDescription(progress, index) }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- 返回操作信息（仅VOID状态显示） -->
                <div v-if="isVoidStep(progress)" class="action-summary-card">
                <div class="summary-content">
                    <div class="summary-text">
                      <span class="return-action-text">
                        {{ getReturnActionText(progress) }}
                      </span>
                    </div>
                </div>
              </div>
              
              <!-- 参与者信息卡片 -->
              <div v-if="progress.has_claimed_user || progress.has_action_user || getEnhancedParticipantInfo(progress).candidateTypes.length > 0" 
                   class="participants-card">
                
                <!-- 执行者信息 -->
                <div v-if="progress.has_claimed_user || progress.has_action_user" class="executors-section">
                  <div class="executor-type-section">
                    <!-- 类型头部 -->
                    <div class="executor-type-header">
                      <h6 class="section-title">👥 {{ t('reviewProgressHistory.ui.executor') }}</h6>
                    </div>
                    
                    <!-- 执行者标签列表 -->
                    <div class="executors-tags">
                      <!-- 认领者标签 -->
                      <div v-if="progress.has_claimed_user" class="executor-tag claimed">
                        <div class="executor-avatar">{{ getUserDisplayName(progress.claimed_by)?.charAt(0) || '?' }}</div>
                        <div class="executor-name">{{ getUserDisplayName(progress.claimed_by) || t('reviewProgressHistory.ui.unknownUser') }}</div>
                      </div>
                      
                      <!-- 操作者标签 -->
                      <div v-if="progress.has_action_user && progress.action_by.autodeskId !== progress.claimed_by.autodeskId" 
                           class="executor-tag action">
                        <div class="executor-avatar">{{ getUserDisplayName(progress.action_by)?.charAt(0) || '?' }}</div>
                        <div class="executor-name">{{ getUserDisplayName(progress.action_by) || t('reviewProgressHistory.ui.unknownUser') }}</div>
                        <div class="executor-role-badge">{{ t('reviewProgressHistory.ui.operator') }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 候选者信息（进行中的步骤不显示） -->
                <div v-if="getEnhancedParticipantInfo(progress).candidateTypes.length > 0 && !['CLAIMED', 'PENDING'].includes(progress.status)" class="candidates-section">
                    
                    <!-- 合并的候选者信息 - 使用人物标签样式 -->
                    <div class="candidates-combined">
                        <div 
                          v-for="candidateType in getEnhancedParticipantInfo(progress).candidateTypes" 
                          :key="candidateType.type"
                          class="candidate-type-section">
                        
                        <!-- 类型头部（包含统计） -->
                          <div class="candidate-type-header">
                          <h6 class="section-title">{{ candidateType.icon }} {{ candidateType.label }}</h6>
                          </div>
                        
                        <!-- 候选者标签列表（使用与执行者相同的样式） -->
                        <div class="candidate-tags">
                            <div 
                              v-for="item in candidateType.items" 
                              :key="item.autodeskId || item.id"
                            class="executor-tag candidate">
                            <div class="executor-avatar">
                                {{ candidateType.type === 'users' ? getEntityDisplayName(item, candidateType.type)?.charAt(0) || '?' : candidateType.icon }}
                              </div>
                            <div class="executor-name">{{ getEntityDisplayName(item, candidateType.type) || t('reviewProgressHistory.ui.unknown') }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                </div>
              </div>
              
              <!-- 备注信息 -->
              <div v-if="progress.notes" class="progress-notes">
                <div class="notes-label">📝 Comment</div>
                <div class="notes-content">{{ progress.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      <!-- 原始数据 -->
      <div class="raw-data-section">
        <el-collapse>
          <el-collapse-item :title="`🔍 ${t('reviewProgressHistory.ui.viewRawData')}`" name="progress-raw-data">
            <div class="raw-data-options">
              <div class="data-info">
                <p class="info-text">
                  <strong>{{ t('reviewProgressHistory.ui.explanation') }}</strong>{{ t('reviewProgressHistory.ui.dataDescription') }}
                </p>
                <div class="data-stats">
                  <span class="stat-badge">{{ t('reviewProgressHistory.ui.displayedRecords') }}: {{ filteredProgressData.length }}</span>
                  <span class="stat-badge">{{ t('reviewProgressHistory.ui.originalRecords') }}: {{ allProgressData.length }}</span>
                  <span class="stat-badge">{{ t('reviewProgressHistory.ui.completedSteps') }}: {{ filteredProgressData.filter(p => p.status === 'SUBMITTED').length }}</span>
                  <span class="stat-badge">{{ t('reviewProgressHistory.ui.returnOperations') }}: {{ filteredProgressData.filter(p => p.status === 'VOID').length }}</span>
                  <span class="stat-badge">{{ t('reviewProgressHistory.ui.pendingSteps') }}: {{ filteredProgressData.filter(p => p.status === 'UNCLAIMED').length }}</span>
                  <span v-if="allProgressData.length > filteredProgressData.length" class="stat-badge filtered-count">
                    {{ t('reviewProgressHistory.ui.filtered') }}: {{ allProgressData.length - filteredProgressData.length }}
                  </span>
                </div>
              </div>
            </div>
            <JsonViewer 
              :data="progressData"
              :title="t('reviewProgressHistory.ui.rawDataTitle')"
              :max-height="400" />
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    
    <!-- 无进度历史 -->
    <div v-else class="no-progress">
      <el-empty :description="t('reviewProgressHistory.ui.noProgressHistory')" :image-size="60" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Loading, Check, User, Clock, Timer, Document, ArrowDown, ArrowLeft, Refresh } from '@element-plus/icons-vue'
import JsonViewer from './JsonViewer.vue'
import StatusTag from './StatusTag.vue'
import entityCache from '../utils/entityCache.js'

export default {
  name: 'ReviewProgressHistory',
  components: {
    JsonViewer,
    StatusTag,
    Loading,
    Check,
    User,
    Clock,
    Timer,
    Document,
    ArrowDown,
    ArrowLeft
  },
  props: {
    reviewId: {
      type: String,
      required: true
    },
    project: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {
    const { t } = useI18n()
    
    // 响应式数据
    const progressData = ref(null)
    const loading = ref(false)
    const error = ref('')
    
    // 展开状态管理
    const expandedSteps = ref(new Set())
    
    
    // 检查VOID状态是否是有意义的返回操作
    const isValidVoidRecord = (progress, allProgress) => {
      if (progress.status !== 'VOID') return true
      
      // 如果VOID记录有action_by或claimed_by，说明是有意义的操作
      if (progress.has_action_user || progress.has_claimed_user) {
        return true
      }
      
      // 新的逻辑：检查这个VOID记录是否真的是工作流返回操作
      // 真正的返回操作应该满足以下条件：
      // 1. VOID记录后面应该有一个UNCLAIMED或PENDING状态的记录（表示返回到某个步骤）
      // 2. 或者VOID记录后面有一个不同step_id的UNCLAIMED/PENDING记录
      
      const voidTime = new Date(progress.end_time.replace(' ', 'T') + (progress.end_time.includes('Z') ? '' : 'Z'))
      
      // 查找VOID记录之后的记录
      const laterRecords = allProgress.filter(p => {
        if (!p.end_time) return false
        const pTime = new Date(p.end_time.replace(' ', 'T') + (p.end_time.includes('Z') ? '' : 'Z'))
        return pTime > voidTime
      })
      
      // 检查是否有后续的UNCLAIMED或PENDING记录（表示返回到某个步骤等待处理）
      const hasReturnTarget = laterRecords.some(p => 
        ['UNCLAIMED', 'PENDING'].includes(p.status)
      )
      
      // 如果有返回目标，才认为是有效的返回操作
      if (hasReturnTarget) {
        return true
      }
      
      // 其他情况都认为是操作cancel产生的VOID，不显示
      return false
    }

    // 智能去重函数：处理重复的进度记录
    const deduplicateProgressRecords = (progressList) => {
      const deduplicatedProgress = []
      const stepStatusMap = new Map() // 存储每个步骤的状态记录
      
      // 首先按步骤分组，分析每个步骤的状态
      for (const progress of progressList) {
        const stepId = progress.step_id
        const status = progress.status
        
        if (!stepStatusMap.has(stepId)) {
          stepStatusMap.set(stepId, {
            stepName: progress.step_name,
            records: [],
            hasClaimed: false,
            hasSubmitted: false,
            unclaimedRecords: []
          })
        }
        
        const stepData = stepStatusMap.get(stepId)
        stepData.records.push(progress)
        
        if (status === 'CLAIMED') {
          stepData.hasClaimed = true
        } else if (status === 'SUBMITTED') {
          stepData.hasSubmitted = true
        } else if (status === 'UNCLAIMED') {
          stepData.unclaimedRecords.push(progress)
        }
      }
      
      // 处理每个步骤的记录
      for (const [stepId, stepData] of stepStatusMap) {
        const { records, hasClaimed, unclaimedRecords } = stepData
        
        for (const progress of records) {
          const status = progress.status
          
          if (status === 'UNCLAIMED') {
            // 对于 UNCLAIMED 状态的特殊处理
            if (hasClaimed) {
              // 如果该步骤已经有 CLAIMED 记录，则跳过所有 UNCLAIMED 记录
              continue
            } else {
              // 如果没有 CLAIMED 记录，只保留一个最完整的 UNCLAIMED 记录
              const isFirstUnclaimed = unclaimedRecords.indexOf(progress) === 0
              if (isFirstUnclaimed) {
                // 找到候选人信息最完整的 UNCLAIMED 记录
                const bestUnclaimed = unclaimedRecords.reduce((best, current) => {
                  const bestCount = (best.candidates?.users_count || 0) + 
                                  (best.candidates?.companies_count || 0) + 
                                  (best.candidates?.roles_count || 0)
                  const currentCount = (current.candidates?.users_count || 0) + 
                                     (current.candidates?.companies_count || 0) + 
                                     (current.candidates?.roles_count || 0)
                  return currentCount > bestCount ? current : best
                }, unclaimedRecords[0])
                
                deduplicatedProgress.push(bestUnclaimed)
              }
              // 跳过其他 UNCLAIMED 记录
              continue
            }
          } else {
            // 对于其他状态（SUBMITTED, CLAIMED, APPROVED, REJECTED等），保留所有记录
            deduplicatedProgress.push(progress)
          }
        }
      }
      
      return deduplicatedProgress
    }

    // 时间排序函数：统一的时间比较逻辑
    const sortByTime = (a, b) => {
      // 处理没有end_time的情况（通常是当前待处理的步骤）
      if (!a.end_time && !b.end_time) return 0
      if (!a.end_time) return 1  // 没有end_time的放在最后
      if (!b.end_time) return -1
      
      // 转换时间格式进行比较
      const timeA = new Date(a.end_time.replace(' ', 'T') + (a.end_time.includes('Z') ? '' : 'Z'))
      const timeB = new Date(b.end_time.replace(' ', 'T') + (b.end_time.includes('Z') ? '' : 'Z'))
      
      return timeA - timeB
    }
    
    // 计算属性：按时间顺序排序的进度列表（过滤无效的VOID记录并去重）
    const filteredProgressData = computed(() => {
      if (!progressData.value?.progress) return []
      
      const allProgress = progressData.value.progress
      
      
      // 1. 过滤有效的进度记录
      const validProgress = allProgress.filter((progress, index) => {
        if (!progress || !progress.status || progress.status.trim() === '') {
          return false
        }
        
        // 对VOID状态进行特殊检查
        const isValid = isValidVoidRecord(progress, allProgress)
        
        
        return isValid
      })
      
      // 2. 按时间排序（确保去重时保留最合适的记录）
      const sortedValidProgress = [...validProgress].sort(sortByTime)
      
      // 3. 智能去重：处理重复的 UNCLAIMED/PENDING 记录
      const deduplicatedProgress = deduplicateProgressRecords(sortedValidProgress)
      
      // 4. 最终排序：按时间顺序（最早的在前面）
      return deduplicatedProgress.sort(sortByTime)
    })
    
    // 计算属性：包含所有状态的完整进度数据（用于调试和分析）
    const allProgressData = computed(() => {
      if (!progressData.value?.progress) return []
      
      return progressData.value.progress
        .filter(progress => progress && progress.status && progress.status.trim() !== '')
        .sort(sortByTime)
    })
    
    // 计算属性：检测重复步骤（工作流返回的标志）
    const stepOccurrences = computed(() => {
      const occurrences = new Map()
      
      filteredProgressData.value.forEach((progress, index) => {
        const stepKey = `${progress.step_id}_${progress.step_name}`
        if (!occurrences.has(stepKey)) {
          occurrences.set(stepKey, [])
        }
        occurrences.set(stepKey, [...occurrences.get(stepKey), { ...progress, displayIndex: index }])
      })
      
      return occurrences
    })

    // 检测多人审核步骤（必须是连续的同一步骤）
    const multiReviewerSteps = computed(() => {
      const result = new Map()
      const progressList = filteredProgressData.value
      
      if (progressList.length === 0) return result
      
      // 按时间排序的进度列表
      const sortedProgress = [...progressList].sort((a, b) => {
        const timeA = new Date(a.end_time).getTime()
        const timeB = new Date(b.end_time).getTime()
        return timeA - timeB
      })
      
      // 查找连续的同一步骤SUBMITTED记录
      for (let i = 0; i < sortedProgress.length; i++) {
        const current = sortedProgress[i]
        
        if (current.status !== 'SUBMITTED') continue
        
        const stepKey = `${current.step_id}_${current.step_name}`
        const consecutiveRecords = [{ progress: current, originalIndex: progressList.indexOf(current) }]
        
        // 向后查找连续的同一步骤记录
        let j = i + 1
        while (j < sortedProgress.length) {
          const next = sortedProgress[j]
          const nextStepKey = `${next.step_id}_${next.step_name}`
          
          if (nextStepKey === stepKey && next.status === 'SUBMITTED') {
            consecutiveRecords.push({ progress: next, originalIndex: progressList.indexOf(next) })
            j++
          } else {
            break // 遇到不同步骤或非SUBMITTED状态，停止
          }
        }
        
        // 如果找到多个连续记录，则认为是多人审核
        if (consecutiveRecords.length > 1) {
          result.set(stepKey, consecutiveRecords)
          i = j - 1 // 跳过已处理的记录
        }
      }
      
      return result
    })
    
    // 检查某个步骤是否是工作流返回的结果
    const isReturnedStep = (progress, index) => {
      // 只有 VOID 状态才是真正的返回操作
      if (progress.status === 'VOID') {
        return true
      }
      
      // 检查是否是由于 VOID 操作导致的后续状态
      // 查找当前记录之前是否有相同步骤的 VOID 记录
      const allSteps = filteredProgressData.value
      const currentStepId = progress.step_id
      
      for (let i = 0; i < index; i++) {
        const prevStep = allSteps[i]
        if (prevStep.step_id === currentStepId && prevStep.status === 'VOID') {
          // 如果找到了相同步骤的 VOID 记录，说明当前记录是返回后的状态
          return true
        }
      }
      
      return false
    }
    
    // 检查是否是VOID状态（返回操作）
    const isVoidStep = (progress) => {
      return progress.status && progress.status.toUpperCase() === 'VOID'
    }

    // 检查某个步骤是否是多人审核（连续的同一步骤）
    const isMultiReviewerStep = (progress, index) => {
      const stepKey = `${progress.step_id}_${progress.step_name}`
      const multiRecords = multiReviewerSteps.value.get(stepKey) || []
      
      if (multiRecords.length <= 1 || progress.status !== 'SUBMITTED') {
        return false
      }
      
      // 检查当前记录是否在连续的多人审核记录中
      return multiRecords.some(record => 
        record.progress.end_time === progress.end_time &&
        record.progress.action_by?.autodeskId === progress.action_by?.autodeskId
      )
    }

    // 获取多人审核的序号（基于连续记录的顺序）
    const getMultiReviewerIndex = (progress, index) => {
      const stepKey = `${progress.step_id}_${progress.step_name}`
      const multiRecords = multiReviewerSteps.value.get(stepKey) || []
      
      if (multiRecords.length <= 1) return 0
      
      // 多人审核记录已经按时间排序，直接查找序号
      const currentIndex = multiRecords.findIndex(record => 
        record.progress.end_time === progress.end_time &&
        record.progress.action_by?.autodeskId === progress.action_by?.autodeskId
      )
      
      return currentIndex >= 0 ? currentIndex + 1 : 0
    }
    
    // 获取返回操作的描述文本
    const getReturnActionText = (progress) => {
      if (!isVoidStep(progress)) return null
      
      // 根据JSON数据分析：VOID状态的"最终审阅"后面跟着UNCLAIMED状态的"初始审阅 2"
      // 查找当前VOID记录之后的下一个记录，确定返回目标
      const currentIndex = filteredProgressData.value.findIndex(p => 
        p.step_id === progress.step_id && p.end_time === progress.end_time
      )
      
      // 查找下一个非VOID状态的记录作为返回目标
      for (let i = currentIndex + 1; i < filteredProgressData.value.length; i++) {
        const nextStep = filteredProgressData.value[i]
        if (!isVoidStep(nextStep)) {
          return t('reviewProgressHistory.ui.returnOperations.sentBackTo', { stepName: translateStepName(nextStep.step_name) })
        }
      }
      
      // 如果没有找到后续步骤，尝试从原始数据中推断
      // 根据step_id查找相关步骤
      const relatedSteps = filteredProgressData.value.filter(p => 
        p.step_id === progress.step_id && !isVoidStep(p)
      )
      
      if (relatedSteps.length > 0) {
        // 找到最后一个非VOID的相同step_id记录
        const lastRelatedStep = relatedSteps[relatedSteps.length - 1]
        return t('reviewProgressHistory.ui.returnOperations.sentBackTo', { stepName: translateStepName(lastRelatedStep.step_name) })
      }
      
      return t('reviewProgressHistory.ui.returnOperations.sentBackToPrevious')
    }
    
    // 翻译步骤名称
    const translateStepName = (stepName) => {
      // 基本翻译映射
      const baseMapping = {
        '发起者': 'Initiator',
        '初始审阅': 'Initial Review',
        '最终审阅': 'Final Review'
      }
      
      // 检查是否是带数字的步骤名称
      for (const [chinese, english] of Object.entries(baseMapping)) {
        if (stepName.startsWith(chinese)) {
          // 如果是完全匹配，直接返回
          if (stepName === chinese) {
            return english
          }
          // 如果是带数字的，替换中文部分，保留数字
          const suffix = stepName.substring(chinese.length)
          return english + suffix
        }
      }
      
      // 如果没有匹配，返回原始名称
      return stepName
    }
    
    // 获取步骤的显示名称（翻译后的名称）
    const getStepDisplayName = (progress) => {
      const translated = translateStepName(progress.step_name)
      console.log(`Translating step: "${progress.step_name}" -> "${translated}"`)
      return translated
    }
    
    // 获取状态标签信息
    const getStatusTag = (progress) => {
      if (isVoidStep(progress)) {
        return {
          text: t('reviewProgressHistory.status.returned'),
          type: 'danger',
          color: '#ef4444'
        }
      }
      
      switch (progress.status) {
        case 'SUBMITTED':
          return {
            text: t('reviewProgressHistory.status.submitted'),
            type: 'success',
            color: '#10b981'
          }
        case 'CLAIMED':
          return {
            text: t('reviewProgressHistory.status.inProgress'),
            type: 'warning',
            color: '#f59e0b'
          }
        case 'PENDING':
          return {
            text: t('reviewProgressHistory.status.pending'),
            type: 'info',
            color: '#6b7280'
          }
        case 'UNCLAIMED':
          return {
            text: t('reviewProgressHistory.status.notStarted'),
            type: 'info',
            color: '#6b7280'
          }
        default:
          return {
            text: progress.status || t('reviewProgressHistory.status.unknown'),
            type: 'info',
            color: '#6b7280'
          }
      }
    }
    
    // 获取截止时间信息
    const getDeadlineInfo = (progress) => {
      const enhancedInfo = getEnhancedParticipantInfo(progress)
      
      // 只有进行中和未完成的步骤才显示截止时间
      if (!['CLAIMED', 'PENDING', 'UNCLAIMED'].includes(progress.status)) {
        return null
      }
      
      // 从工作流数据中获取期限信息
      if (enhancedInfo.duration > 0) {
        return {
          duration: enhancedInfo.duration,
          text: `${enhancedInfo.duration}天期限`,
          type: enhancedInfo.duration <= 1 ? 'urgent' : 'normal'
        }
      }
      
      return null
    }
    
    // 获取时间显示文本（完成时间或截止时间）
    const getTimeDisplayText = (progress) => {
      // 如果有完成时间，显示完成时间
      if (progress.end_time) {
        return progress.end_time
      }
      
      // 如果没有完成时间，计算并显示截止时间
      const enhancedInfo = getEnhancedParticipantInfo(progress)
      if (enhancedInfo.duration > 0) {
        // 计算截止时间：从步骤开始时间 + 期限天数
        // 这里需要找到步骤的开始时间，可以从前一个步骤的完成时间推算
        const allSteps = filteredProgressData.value
        const currentIndex = allSteps.findIndex(p => 
          p.step_id === progress.step_id && p.end_time === progress.end_time
        )
        
        let startTime = null
        if (currentIndex > 0) {
          // 使用前一个步骤的完成时间作为当前步骤的开始时间
          const previousStep = allSteps[currentIndex - 1]
          if (previousStep.end_time) {
            startTime = new Date(previousStep.end_time.replace(' ', 'T') + (previousStep.end_time.includes('Z') ? '' : 'Z'))
          }
        }
        
        if (startTime) {
          // 计算截止时间
          const deadlineTime = new Date(startTime)
          deadlineTime.setDate(deadlineTime.getDate() + enhancedInfo.duration)
          
          // 格式化截止时间
          const year = deadlineTime.getFullYear()
          const month = String(deadlineTime.getMonth() + 1).padStart(2, '0')
          const day = String(deadlineTime.getDate()).padStart(2, '0')
          const hours = String(deadlineTime.getHours()).padStart(2, '0')
          const minutes = String(deadlineTime.getMinutes()).padStart(2, '0')
          const seconds = String(deadlineTime.getSeconds()).padStart(2, '0')
          
          return `Due Date : ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        }
      }
      
      // 默认显示"进行中"
      return t('reviewProgressHistory.status.inProgress')
    }
    
    // 获取步骤描述信息
    const getStepDescription = (progress, index) => {
      const allSteps = filteredProgressData.value
      
      // 如果是VOID状态（返回操作）
      if (isVoidStep(progress)) {
        // 查找返回的目标步骤
        for (let i = index + 1; i < allSteps.length; i++) {
          const nextStep = allSteps[i]
          if (!isVoidStep(nextStep)) {
            return t('reviewProgressHistory.status.returnedTo', { stepName: translateStepName(nextStep.step_name) })
          }
        }
        return t('reviewProgressHistory.status.returnedToPrevious')
      }
      
      // 如果是正常完成的步骤
      if (progress.status === 'SUBMITTED') {
        // 查找下一个步骤
        for (let i = index + 1; i < allSteps.length; i++) {
          const nextStep = allSteps[i]
          if (!isVoidStep(nextStep)) {
            return t('reviewProgressHistory.status.submittedTo', { stepName: translateStepName(nextStep.step_name) })
          }
        }
        // 如果没有下一个步骤，说明是最后一步
        return t('reviewProgressHistory.status.completed')
      }
      
      // 如果是进行中的步骤
      if (['CLAIMED', 'PENDING', 'UNCLAIMED'].includes(progress.status)) {
        return t('reviewProgressHistory.status.currentStep', { stepName: translateStepName(progress.step_name) })
      }
      
      // 默认描述
      return t('reviewProgressHistory.status.defaultStep', { stepName: translateStepName(progress.step_name) })
    }
    
    // 响应式数据：最终审批状态（从 versions API 获取）
    const finalApprovalStatus = ref(null)
    // 响应式数据：工作流详细信息
    const workflowData = ref(null)
    
    // 获取工作流详细信息
    const loadWorkflowData = async () => {
      if (!props.reviewId || !props.project?.id) return
      
      try {
        const response = await axios.get(`/api/reviews/jarvis/${props.reviewId}/workflow`, {
          timeout: 30000,
          params: {
            projectId: props.project.id
          }
        })
        
        if (response.data.success) {
          workflowData.value = response.data
        }
      } catch (err) {
        console.error('获取工作流信息失败:', err)
        // 不显示错误消息，因为这是可选功能
      }
    }
    
    // 获取最终审批状态
    const loadFinalApprovalStatus = async () => {
      if (!props.reviewId || !props.project?.id) return
      
      try {
        const response = await axios.get(`/api/reviews/jarvis/${props.reviewId}/versions`, {
          timeout: 30000,
          params: {
            projectId: props.project.id,
            limit: 50  // 获取所有文件版本
          }
        })
        
        if (response.data.success && response.data.versions && response.data.versions.length > 0) {
          // 查找已审批的文件版本
          const approvedVersions = response.data.versions.filter(version => 
            version.approve_status && 
            (version.approve_status.value === 'APPROVED' || version.approve_status.value === 'REJECTED')
          )
          
          if (approvedVersions.length > 0) {
            // 取第一个已审批的版本作为最终状态
            const finalVersion = approvedVersions[0]
            const approvalStatus = finalVersion.approve_status
            
            // 从原始数据中获取更多信息
            const rawVersion = finalVersion.raw_version_data || {}
            const approveStatusRaw = rawVersion.approveStatus || {}
            
            finalApprovalStatus.value = {
              status: approvalStatus.value,
              type: approveStatusRaw.builtIn === false ? '自定义' : '内置',
              comment: approvalStatus.label || '',
              approver: '', // 审批人信息在进度历史中获取
              time: finalVersion.modified_date || ''
            }
          }
        }
      } catch (err) {
        console.error('获取最终审批状态失败:', err)
        // 不显示错误消息，因为这是可选功能
      }
    }
    
    // 加载进度历史
    const loadProgressHistory = async () => {
      if (!props.reviewId) {
        error.value = t('reviewProgressHistory.missingReviewId')
        return
      }
      
      if (!props.project?.id) {
        error.value = t('reviewProgressHistory.missingProjectInfo')
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const response = await axios.get(`/api/reviews/jarvis/${props.reviewId}/progress`, {
          timeout: 30000,
          params: {
            projectId: props.project.id
          }
        })
        
        if (response.data.success) {
          progressData.value = response.data
          // 同时加载工作流信息和最终审批状态
          await Promise.all([
            loadWorkflowData(),
            loadFinalApprovalStatus()
          ])
          
          // 默认展开最新的步骤（最后一个）
          if (filteredProgressData.value.length > 0) {
            const lastIndex = filteredProgressData.value.length - 1
            const lastStep = filteredProgressData.value[lastIndex]
            const expandKey = `${lastStep.step_id}-${lastIndex}`
            expandedSteps.value.add(expandKey)
          }
          
        } else {
          throw new Error(response.data.error || t('reviewProgressHistory.loadFailed'))
        }
      } catch (err) {
        console.error('加载进度历史失败:', err)
        error.value = err.response?.data?.error || err.message || t('reviewProgressHistory.loadFailed')
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }
    
    // 刷新进度历史数据
    const refreshProgressHistory = async () => {
      ElMessage.info(t('reviewProgressHistory.ui.refreshing'))
      await loadProgressHistory()
    }
    
    // 工具方法
    const getProgressStatusClass = (progress) => {
      if (progress.status === 'VOID') return 'void'
      if (progress.status === 'SUBMITTED' || progress.is_completed) return 'completed'
      if (progress.status === 'CLAIMED' || progress.is_claimed) return 'claimed'
      if (progress.status === 'PENDING' || progress.is_pending) return 'pending'
      if (progress.status === 'UNCLAIMED') return 'unclaimed'
      return 'default'
    }
    
    const getStatusForTag = (status) => {
      const statusMap = {
        'PENDING': 'pending',
        'CLAIMED': 'claimed',
        'SUBMITTED': 'submitted',
        'APPROVED': 'approved',
        'REJECTED': 'rejected'
      }
      return statusMap[status] || status?.toLowerCase() || 'unknown'
    }
    
    const getStepTypeLabel = (type) => {
      const typeMap = {
        'direct_assignment': t('reviewProgressHistory.ui.assignmentTypes.direct_assignment'),
        'role_based': t('reviewProgressHistory.ui.assignmentTypes.role_based'),
        'company_based': t('reviewProgressHistory.ui.assignmentTypes.company_based'),
        'mixed_assignment': t('reviewProgressHistory.ui.assignmentTypes.mixed_assignment'),
        'no_assignment': t('reviewProgressHistory.ui.assignmentTypes.no_assignment'),
        'unknown': t('reviewProgressHistory.ui.assignmentTypes.unknown')
      }
      return typeMap[type] || type
    }
    
    const getStepTypeTagType = (type) => {
      const typeMap = {
        'direct_assignment': 'primary',
        'role_based': 'success',
        'company_based': 'warning',
        'mixed_assignment': 'info',
        'no_assignment': 'danger',
        'unknown': 'info'
      }
      return typeMap[type] || 'info'
    }
    
    const getStatusLabel = (status) => {
      const statusMap = {
        'PENDING': t('reviewProgressHistory.status.PENDING'),
        'CLAIMED': t('reviewProgressHistory.status.CLAIMED'),
        'SUBMITTED': t('reviewProgressHistory.status.SUBMITTED'),
        'APPROVED': t('reviewProgressHistory.status.APPROVED'),
        'REJECTED': t('reviewProgressHistory.status.REJECTED')
      }
      return statusMap[status] || status
    }
    
    const getStatusColor = (status) => {
      const colorMap = {
        'PENDING': '#909399',
        'CLAIMED': '#e6a23c',
        'SUBMITTED': '#409eff',
        'APPROVED': '#67c23a',
        'REJECTED': '#f56c6c'
      }
      return colorMap[status] || '#909399'
    }
    
    // 获取最终状态文本
    const getFinalStatusText = (status) => {
      const statusMap = {
        'APPROVED': t('reviewProgressHistory.ui.finalStatus.APPROVED'),
        'REJECTED': t('reviewProgressHistory.ui.finalStatus.REJECTED')
      }
      return statusMap[status] || status
    }
    
    // 根据步骤ID获取工作流步骤详细信息
    const getWorkflowStepInfo = (stepId) => {
      if (!workflowData.value?.detailed_steps) return null
      
      return workflowData.value.detailed_steps.find(step => step.id === stepId)
    }
    
    // 获取增强的参与者信息（结合工作流数据）
    const getEnhancedParticipantInfo = (progress) => {
      const stepInfo = getWorkflowStepInfo(progress.step_id)
      const result = {
        // 基础信息（来自进度数据）
        claimedBy: progress.claimed_by,
        actionBy: progress.action_by,
        candidates: progress.candidates,
        // 增强信息（来自工作流数据）
        stepType: stepInfo?.type || 'UNKNOWN',
        stepTypeLabel: getStepTypeDisplayName(stepInfo?.type || 'UNKNOWN'),
        duration: stepInfo?.duration || 0,
        dueDateType: stepInfo?.due_date_type || '',
        groupReview: stepInfo?.group_review || {},
        // 候选者类型分析
        candidateTypes: []
      }
      
      // 分析候选者类型
      if (progress.candidates.users_count > 0) {
        result.candidateTypes.push({
          type: 'users',
          count: progress.candidates.users_count,
          label: t('reviewProgressHistory.ui.candidateTypes.specifiedUser'),
          icon: '👤',
          items: progress.candidates.users
        })
      }
      
      if (progress.candidates.roles_count > 0) {
        result.candidateTypes.push({
          type: 'roles',
          count: progress.candidates.roles_count,
          label: t('reviewProgressHistory.ui.candidateTypes.roleAssignment'),
          icon: '🏷️',
          items: progress.candidates.roles
        })
      }
      
      if (progress.candidates.companies_count > 0) {
        result.candidateTypes.push({
          type: 'companies',
          count: progress.candidates.companies_count,
          label: t('reviewProgressHistory.ui.candidateTypes.companyAssignment'),
          icon: '🏢',
          items: progress.candidates.companies
        })
      }
      
      return result
    }
    
    // 获取步骤类型显示名称
    const getStepTypeDisplayName = (type) => {
      const typeMap = {
        'INITIATOR': t('reviewProgressHistory.stepTypes.INITIATOR'),
        'REVIEWER': t('reviewProgressHistory.stepTypes.REVIEWER'),
        'APPROVER': t('reviewProgressHistory.stepTypes.APPROVER'),
        'OBSERVER': t('reviewProgressHistory.stepTypes.OBSERVER')
      }
      return typeMap[type] || type
    }
    
    // 展开/收纳相关方法
    const toggleStepExpansion = (stepId) => {
      if (expandedSteps.value.has(stepId)) {
        expandedSteps.value.delete(stepId)
      } else {
        expandedSteps.value.add(stepId)
      }
      // 触发响应式更新
      expandedSteps.value = new Set(expandedSteps.value)
    }
    
    const isStepExpanded = (stepId) => {
      return expandedSteps.value.has(stepId)
    }
    
    // 监听评审ID变化
    watch(() => props.reviewId, (newId, oldId) => {
      if (newId && newId !== oldId) {
        console.log(`Review ID changed from ${oldId} to ${newId}`)
        progressData.value = null
        error.value = ''
        // 重置展开状态
        expandedSteps.value.clear()
        loadProgressHistory()
      }
    }, { immediate: true })
    
    // 获取用户显示名称（支持用户、角色、公司）
    const getEntityDisplayName = (entity, entityType = 'auto') => {
      if (!entity) return 'Unknown';
      
      // 如果实体有 autodeskId，优先使用 autodeskId 作为查找键
      const entityId = entity.autodeskId || entity.id;
      if (!entityId) {
        // 如果没有ID，直接返回名称
        return entity.name || 'Unknown';
      }
      
      console.log('🔍 ReviewProgressHistory获取实体显示名称:', { 
        entityId, 
        entityType, 
        entityName: entity.name,
        projectId: props.project?.id 
      });
      
      // 使用 entityCache 获取显示名称
      const displayName = entityCache.getEntityDisplayName(entityId, entityType, props.project?.id);
      
      if (displayName && displayName !== entityId) {
        console.log('✅ ReviewProgressHistory EntityCache结果:', { entityId, entityType, displayName });
        return displayName;
      }
      
      // 如果 entityCache 没有找到，回退到实体自身的名称
      const fallbackName = entity.name || entityId;
      console.log('⚠️ ReviewProgressHistory使用回退名称:', { entityId, entityType, fallbackName });
      return fallbackName;
    };

    // 获取用户显示名称
    const getUserDisplayName = (user) => {
      return getEntityDisplayName(user, 'user');
    };

    // 获取角色显示名称
    const getRoleDisplayName = (role) => {
      return getEntityDisplayName(role, 'role');
    };

    // 获取公司显示名称
    const getCompanyDisplayName = (company) => {
      return getEntityDisplayName(company, 'company');
    };

    // 组件挂载时加载数据
    onMounted(async () => {
      console.log('ReviewProgressHistory mounted with reviewId:', props.reviewId)
      
      // 预加载实体缓存以确保用户、角色、公司映射可用
      if (props.project?.id) {
        try {
          console.log('🏢 ReviewProgressHistory预加载实体缓存:', props.project.id);
          await entityCache.getProjectEntities(props.project.id);
          console.log('✅ ReviewProgressHistory实体缓存预加载完成');
        } catch (error) {
          console.warn('⚠️ ReviewProgressHistory实体缓存预加载失败:', error);
        }
      }
      
      if (props.reviewId) {
        loadProgressHistory()
      }
    })
    
    return {
      // i18n
      t,
      
      progressData,
      loading,
      error,
      filteredProgressData,
      allProgressData,
      stepOccurrences,
      finalApprovalStatus,
      workflowData,
      expandedSteps,
      loadProgressHistory,
      refreshProgressHistory,
      getProgressStatusClass,
      getStatusForTag,
      getStepTypeLabel,
      getStepTypeTagType,
      getStatusLabel,
      getStatusColor,
      getFinalStatusText,
      getEnhancedParticipantInfo,
      getStepTypeDisplayName,
      toggleStepExpansion,
      isStepExpanded,
      isReturnedStep,
      isVoidStep,
      isMultiReviewerStep,
      getMultiReviewerIndex,
      multiReviewerSteps,
      getReturnActionText,
      getStepDisplayName,
      isValidVoidRecord,
      getStatusTag,
      getDeadlineInfo,
      getTimeDisplayText,
      getStepDescription,
      translateStepName,
      getEntityDisplayName,
      getUserDisplayName,
      getRoleDisplayName,
      getCompanyDisplayName
    }
  }
}
</script>

<style scoped>
.review-progress-history {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 40px;
  justify-content: center;
  color: #6b7280;
}

.progress-error {
  padding: 20px;
  text-align: center;
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}



/* 时间线头部样式 */
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.timeline-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-header h4 {
  color: #1e293b;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-item {
  font-size: 13px;
  color: #64748b;
  background: #f8fafc;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

/* 时间线容器 */
.timeline-container {
  position: relative;
  padding-left: 8px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 40px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

/* 时间线节点样式 */
.timeline-node {
  position: relative;
  margin-right: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 3;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dot-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

/* SUBMITTED状态 - 绿色背景 */
.timeline-item.completed .timeline-dot {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  transform: scale(1.05);
}

/* CLAIMED状态 - 橙色背景 */
.timeline-item.claimed .timeline-dot {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  transform: scale(1.05);
}

/* PENDING状态 - 灰色背景 */
.timeline-item.pending .timeline-dot {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
}

/* UNCLAIMED状态 - 浅灰色背景 */
.timeline-item.unclaimed .timeline-dot {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-color: #e2e8f0;
}

/* VOID状态 - 红色背景（返回操作） */
.timeline-item.void .timeline-dot {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
}

/* 其他状态 - 蓝色背景 */
.timeline-item:not(.completed):not(.claimed):not(.pending):not(.unclaimed):not(.void) .timeline-dot {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  transform: scale(1.05);
}

.status-icon {
  font-size: 18px;
  transition: all 0.3s ease;
}

/* 已提交状态 - 绿色打勾 */
.status-icon.submitted {
  color: white;
}

/* 已认领状态 - 橙色用户图标 */
.status-icon.claimed {
  color: white;
}

/* 待处理状态 - 灰色时钟图标 */
.status-icon.pending {
  color: #64748b;
}

/* VOID状态 - 白色返回图标 */
.status-icon.void {
  color: white;
}

/* UNCLAIMED状态 - 灰色时钟图标 */
.status-icon.unclaimed {
  color: #64748b;
}

/* 默认状态 - 蓝色文档图标 */
.status-icon.default {
  color: white;
}

/* 连接线样式 */
.timeline-line {
  position: absolute;
  left: 23px;
  top: 48px;
  bottom: -40px;
  width: 3px;
  background: linear-gradient(to bottom, #e2e8f0 0%, #cbd5e1 100%);
  z-index: 1;
  border-radius: 2px;
}

.timeline-item.completed .timeline-line {
  background: linear-gradient(to bottom, #10b981 0%, #059669 50%, #e2e8f0 100%);
}

.timeline-item.claimed .timeline-line {
  background: linear-gradient(to bottom, #f59e0b 0%, #d97706 50%, #e2e8f0 100%);
}

.timeline-item:last-child .timeline-line {
  display: none;
}

/* 返回步骤的特殊样式 */
.timeline-item.returned-step .timeline-dot {
  border: 3px solid #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.timeline-item.returned-step .timeline-content-card {
  border-left: 4px solid #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.timeline-item.returned-step .timeline-line {
  background: linear-gradient(to bottom, #f59e0b 0%, #d97706 50%, #e2e8f0 100%);
  border-left: 2px dashed #f59e0b;
  width: 1px;
  margin-left: 1px;
}

/* VOID步骤的特殊样式 */
.timeline-item.void-step .timeline-dot {
  border: 3px solid #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.timeline-item.void-step .timeline-content-card {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
}

.timeline-item.void-step .timeline-line {
  background: linear-gradient(to bottom, #ef4444 0%, #dc2626 50%, #e2e8f0 100%);
  border-left: 2px dashed #ef4444;
  width: 1px;
  margin-left: 1px;
}

/* 内容卡片样式 */
.timeline-content-card {
  flex: 1;
  min-width: 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.timeline-content-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

/* 卡片头部 */
.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.step-info-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-title-section {
  flex: 1;
  min-width: 0;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.status-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.status-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.multi-reviewer-tag {
  background: #fef3c7 !important;
  color: #d97706 !important;
  border-color: #fcd34d !important;
  font-weight: 700;
  animation: multi-reviewer-pulse 2s infinite;
}

@keyframes multi-reviewer-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.1);
  }
}

.deadline-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid #f59e0b;
  background-color: #fef3c720;
  color: #d97706;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.deadline-tag.urgent {
  border-color: #ef4444;
  background-color: #fef2f220;
  color: #dc2626;
  animation: pulse-urgent 2s infinite;
}

.deadline-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes pulse-urgent {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-name {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.return-badge {
  font-size: 11px;
  font-weight: 500;
  color: #d97706;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid #f59e0b;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

.void-badge {
  font-size: 11px;
  font-weight: 500;
  color: #dc2626;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid #ef4444;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

.step-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 展开按钮 */
.expand-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  transition: all 0.2s ease;
  min-width: 70px;
  justify-content: center;
}

.expand-btn:hover {
  color: #3b82f6;
  background-color: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.expand-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.expand-btn .el-icon {
  font-size: 14px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.expand-btn .el-icon.rotate-180 {
  transform: rotate(180deg);
}

/* 展开状态的按钮样式 */
.expand-btn.expanded {
  color: #059669;
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.expand-btn.expanded:hover {
  color: #047857;
  border-color: #059669;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

/* 时间标签组 */
.time-tags-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.time-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.time-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 完成时间标签 */
.time-tag.completed-time {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border-color: #bfdbfe;
}

.time-tag.completed-time .time-icon {
  font-size: 14px;
  color: #3b82f6;
}

/* 剩余时间标签 */
.time-tag.remaining-time {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border-color: #f59e0b;
}

.time-tag.remaining-time .duration-icon {
  font-size: 14px;
  color: #d97706;
}

.time-text,
.duration-text {
  font-weight: 600;
  white-space: nowrap;
}

/* 可展开内容 */
.expandable-content {
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-top: 1px solid #f1f5f9;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 1000px;
  }
}

/* 步骤描述卡片 */
.step-description-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.description-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.description-text {
  flex: 1;
}

.step-description {
  font-size: 14px;
  font-weight: 600;
  color: #0369a1;
  background: rgba(3, 105, 161, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #0ea5e9;
}

/* 操作摘要卡片 */
.action-summary-card {
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
}

.summary-content {
  display: flex;
  align-items: center;
}

.summary-text {
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.return-action-text {
  color: #dc2626;
  font-weight: 600;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ef4444;
  display: inline-block;
}


/* 参与者信息卡片 */
.participants-card {
  padding: 12px 16px;
  background: #ffffff;
}

.section-title {
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 执行者部分 - 标签形式 */
.executors-section {
  margin-bottom: 12px;
}

.executor-type-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
}

.executor-type-header {
  margin-bottom: 12px;
}

.executors-tags,
.candidate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.executor-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  min-width: 0;
}

.executor-tag:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.executor-tag.claimed {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.executor-tag.action {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.executor-tag.candidate {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
}

.executor-tag .executor-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.executor-tag.claimed .executor-avatar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.executor-tag.action .executor-avatar {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.executor-tag.candidate .executor-avatar {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.executor-tag .executor-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.executor-role-badge {
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
  flex-shrink: 0;
}

/* 候选者部分 */
.candidates-section {
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.candidates-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.candidate-type-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.candidate-type-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.type-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.type-info {
  flex: 1;
  min-width: 0;
}

.type-count {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.type-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}

/* 合并的候选者信息 */
.candidates-combined {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.candidate-type-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.candidate-type-header {
  margin-bottom: 12px;
}

.type-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.type-name {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex: 1;
}

.type-count-badge {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.candidate-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.candidate-item:hover {
  background: #f9fafb;
  border-color: #cbd5e1;
  transform: translateX(2px);
}

.item-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-id {
  font-size: 11px;
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 备注信息样式 */
.progress-notes {
  padding: 16px 24px;
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border-top: 1px solid #f1f5f9;
  border-left: 4px solid #f59e0b;
}

.notes-label {
  font-size: 13px;
  color: #92400e;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.notes-content {
  color: #451a03;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 500;
}


.raw-data-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.raw-data-options {
  margin-bottom: 16px;
}

.data-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.info-text {
  margin: 0 0 12px 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.5;
}

.data-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #e2e8f0;
  color: #475569;
}

.stat-badge.void-count {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.stat-badge.filtered-count {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.no-progress {
  padding: 40px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-progress-history {
    padding: 16px;
  }
  
  
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .timeline-container {
    padding-left: 4px;
  }
  
  .timeline-node {
    margin-right: 16px;
  }
  
  .timeline-dot {
    width: 40px;
    height: 40px;
  }
  
  .timeline-line {
    left: 19px;
  }
  
  .timeline-content-card {
    border-radius: 12px;
  }
  
  .card-header {
    padding: 16px 20px 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .step-info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .step-title-section {
    width: 100%;
  }
  
  .expand-toggle {
    align-self: flex-end;
    margin-top: 0;
  }
  
  .expand-btn {
    padding: 4px 8px;
    min-width: 60px;
    font-size: 11px;
  }
  
  .expand-btn .el-icon {
    font-size: 12px;
  }
  
  .time-tags-group {
    gap: 6px;
  }
  
  .time-tag {
    font-size: 11px;
    padding: 4px 8px;
  }
  
  .step-name {
    font-size: 16px;
  }
  
  .step-description-card {
    padding: 8px 12px;
  }
  
  .step-description {
    font-size: 13px;
    padding: 4px 10px;
  }
  
  .action-summary-card {
    padding: 8px 12px;
  }
  
  .summary-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .participants-card {
    padding: 8px 12px;
  }
  
  .candidates-overview {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .candidate-items {
    grid-template-columns: 1fr;
  }
  
  .executors-tags {
    gap: 8px;
  }
  
  .executor-tag {
    padding: 6px 10px;
  }
  
  .executor-tag .executor-name {
    max-width: 100px;
    font-size: 12px;
  }
}
</style>
