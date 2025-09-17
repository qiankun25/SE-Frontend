<template>
    <div class="operation-log">
        <!-- 页面标题 -->
        <div class="page-header">
            <div class="header-left">
                <h2>操作日志查看</h2>
                <p class="page-description">
                    查看系统中的用户操作记录，包括查询、导出、下载等操作日志
                </p>
            </div>
        </div>

        <!-- 查询条件区域 -->
        <el-card class="search-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <span>查询条件</span>
                </div>
            </template>

            <el-form :model="searchForm" :inline="true" label-width="120px">
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="操作类型">
                            <el-select v-model="searchForm.operationType" placeholder="请选择操作类型" clearable>
                                <el-option label="登录" value="login" />
                                <el-option label="登出" value="logout" />
                                <el-option label="查询" value="query" />
                                <el-option label="导出" value="export" />
                                <el-option label="下载" value="download" />
                                <el-option label="查看" value="view" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :span="8">
                        <el-form-item label="模块名称">
                            <el-select v-model="searchForm.module" placeholder="请选择模块" clearable>
                                <el-option label="合格证" value="certificate" />
                                <el-option label="产品" value="product" />
                                <el-option label="企业" value="enterprise" />
                                <el-option label="财税" value="tax" />
                                <el-option label="统计" value="statistics" />
                                <el-option label="认证" value="auth" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :span="8">
                        <el-form-item label="时间范围">
                            <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="用户ID">
                            <el-input v-model="searchForm.userId" placeholder="请输入用户ID" clearable />
                        </el-form-item>
                    </el-col>

                    <el-col :span="8">
                        <el-form-item label="IP地址">
                            <el-input v-model="searchForm.ipAddress" placeholder="请输入IP地址" clearable />
                        </el-form-item>
                    </el-col>

                    <el-col :span="8">
                        <el-form-item label="状态码">
                            <el-select v-model="searchForm.responseStatus" placeholder="请选择状态码" clearable>
                                <el-option label="成功(200)" value="200" />
                                <el-option label="失败(400)" value="400" />
                                <el-option label="未授权(401)" value="401" />
                                <el-option label="禁止(403)" value="403" />
                                <el-option label="未找到(404)" value="404" />
                                <el-option label="服务器错误(500)" value="500" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="24">
                        <div class="search-actions">
                            <el-button type="primary" @click="handleSearch" :loading="loading">
                                <el-icon>
                                    <Search />
                                </el-icon>
                                查询
                            </el-button>
                            <el-button @click="handleReset">
                                <el-icon>
                                    <Refresh />
                                </el-icon>
                                重置
                            </el-button>
                            <el-button type="success" @click="handleExport">
                                <el-icon>
                                    <Download />
                                </el-icon>
                                导出日志
                            </el-button>
                        </div>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <!-- 统计信息 -->
        <el-row :gutter="20" class="stats-row" v-if="hasSearched">
            <el-col :span="6">
                <el-card class="stats-card">
                    <div class="stats-item">
                        <div class="stats-value">{{ formatNumber(stats.totalLogs) }}</div>
                        <div class="stats-label">总日志数</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card class="stats-card">
                    <div class="stats-item">
                        <div class="stats-value">{{ formatNumber(stats.successLogs) }}</div>
                        <div class="stats-label">成功操作</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card class="stats-card">
                    <div class="stats-item">
                        <div class="stats-value">{{ formatNumber(stats.errorLogs) }}</div>
                        <div class="stats-label">失败操作</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card class="stats-card">
                    <div class="stats-item">
                        <div class="stats-value">{{ stats.avgDuration }}ms</div>
                        <div class="stats-label">平均耗时</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 日志类型切换 -->
        <el-card class="log-type-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <span>日志类型</span>
                    <el-radio-group v-model="logType" @change="handleLogTypeChange">
                        <el-radio-button value="operation">操作日志</el-radio-button>
                        <el-radio-button value="download">下载日志</el-radio-button>
                    </el-radio-group>
                </div>
            </template>

            <!-- 操作日志表格 -->
            <div v-show="logType === 'operation'">
                <el-table :data="operationLogs" v-loading="loading" stripe border height="500">
                    <el-table-column type="index" label="序号" width="60" />

                    <el-table-column prop="user.username" label="用户名" width="120" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.user?.username || row.user_id || '未知用户' }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="operation_type" label="操作类型" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getOperationTypeTag(row.operation_type)">
                                {{ getOperationTypeLabel(row.operation_type) }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="module" label="模块" width="100">
                        <template #default="{ row }">
                            <el-tag type="info">{{ getModuleLabel(row.module) }}</el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="action" label="具体操作" width="150" show-overflow-tooltip />

                    <el-table-column prop="request_method" label="请求方法" width="80" align="center" />

                    <el-table-column prop="response_status" label="状态" width="80" align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.response_status < 400 ? 'success' : 'danger'">
                                {{ row.response_status }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="result_count" label="结果数量" width="100" align="center" />

                    <el-table-column prop="ip_address" label="IP地址" width="120" show-overflow-tooltip />

                    <el-table-column prop="start_time" label="操作时间" width="160" align="center">
                        <template #default="{ row }">
                            {{ formatDateTime(row.start_time) }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="duration_ms" label="耗时" width="100" align="center">
                        <template #default="{ row }">
                            {{ row.duration_ms ? `${row.duration_ms}ms` : '-' }}
                        </template>
                    </el-table-column>

                    <el-table-column label="操作" width="120" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="handleViewDetail(row)">
                                查看详情
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 下载日志表格 -->
            <div v-show="logType === 'download'">
                <el-table :data="downloadLogs" v-loading="loading" stripe border height="500">
                    <el-table-column type="index" label="序号" width="60" />

                    <el-table-column prop="user.username" label="用户名" width="120" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.user?.username || row.user_id || '未知用户' }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="file_name" label="文件名" min-width="200" show-overflow-tooltip />

                    <el-table-column prop="file_type" label="文件类型" width="100" />

                    <el-table-column prop="file_size" label="文件大小" width="100" align="center">
                        <template #default="{ row }">
                            {{ formatFileSize(row.file_size) }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="data_source" label="数据源" width="120" />

                    <el-table-column prop="record_count" label="记录数" width="100" align="center" />

                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getDownloadStatusTag(row.status)">
                                {{ getDownloadStatusLabel(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="progress" label="进度" width="100" align="center">
                        <template #default="{ row }">
                            <el-progress v-if="row.progress" :percentage="row.progress" :stroke-width="8" />
                            <span v-else>-</span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="created_at" label="创建时间" width="160" align="center">
                        <template #default="{ row }">
                            {{ formatDateTime(row.created_at) }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="ip_address" label="IP地址" width="120" show-overflow-tooltip />

                    <el-table-column label="操作" width="120" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="handleViewDetail(row)">
                                查看详情
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 分页 -->
            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
                    :total="total" :page-sizes="[20, 50, 100, 200]" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange" @current-change="handlePageChange" />
            </div>
        </el-card>

        <!-- 详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="日志详情" width="800px">
            <div v-if="selectedLog" class="log-detail">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="日志ID">{{ selectedLog.id }}</el-descriptions-item>
                    <el-descriptions-item label="用户ID">{{ selectedLog.user_id }}</el-descriptions-item>
                    <el-descriptions-item label="操作类型">{{ getOperationTypeLabel(selectedLog.operation_type)
                        }}</el-descriptions-item>
                    <el-descriptions-item label="模块">{{ getModuleLabel(selectedLog.module) }}</el-descriptions-item>
                    <el-descriptions-item label="具体操作">{{ selectedLog.action }}</el-descriptions-item>
                    <el-descriptions-item label="请求方法">{{ selectedLog.request_method }}</el-descriptions-item>
                    <el-descriptions-item label="请求路径">{{ selectedLog.request_path }}</el-descriptions-item>
                    <el-descriptions-item label="响应状态">{{ selectedLog.response_status }}</el-descriptions-item>
                    <el-descriptions-item label="IP地址">{{ selectedLog.ip_address }}</el-descriptions-item>
                    <el-descriptions-item label="开始时间">{{ formatDateTime(selectedLog.start_time)
                        }}</el-descriptions-item>
                    <el-descriptions-item label="结束时间">{{ formatDateTime(selectedLog.end_time) }}</el-descriptions-item>
                    <el-descriptions-item label="执行时长">{{ selectedLog.duration_ms ? `${selectedLog.duration_ms}ms` : '-'
                        }}</el-descriptions-item>
                    <el-descriptions-item label="结果数量">{{ selectedLog.result_count || '-' }}</el-descriptions-item>
                </el-descriptions>

                <div v-if="selectedLog.request_params" class="detail-section">
                    <h4>请求参数</h4>
                    <pre>{{ formatJson(selectedLog.request_params) }}</pre>
                </div>

                <div v-if="selectedLog.business_data" class="detail-section">
                    <h4>业务数据</h4>
                    <pre>{{ formatJson(selectedLog.business_data) }}</pre>
                </div>

                <div v-if="selectedLog.error_message" class="detail-section">
                    <h4>错误信息</h4>
                    <pre class="error-message">{{ selectedLog.error_message }}</pre>
                </div>

                <div v-if="selectedLog.remarks" class="detail-section">
                    <h4>备注</h4>
                    <p>{{ selectedLog.remarks }}</p>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { operationLogApi } from '../services/api'

// 响应式数据
const loading = ref(false)
const hasSearched = ref(false)
const logType = ref<'operation' | 'download'>('operation')
const detailDialogVisible = ref(false)
const selectedLog = ref<any>(null)

// 搜索表单
const searchForm = reactive({
    operationType: '',
    module: '',
    timeRange: undefined as string[] | undefined,
    userId: '',
    ipAddress: '',
    responseStatus: ''
})

// 分页数据
const pagination = reactive({
    page: 1,
    pageSize: 50
})

// 表格数据
const operationLogs = ref<any[]>([])
const downloadLogs = ref<any[]>([])
const total = ref(0)

// 统计数据
const stats = reactive({
    totalLogs: 0,
    successLogs: 0,
    errorLogs: 0,
    avgDuration: 0
})

// 事件处理函数
const handleSearch = async () => {
    loading.value = true
    hasSearched.value = true

    try {
        // 构建查询参数
        const params: any = {
            limit: pagination.pageSize,
            offset: (pagination.page - 1) * pagination.pageSize
        }

        if (searchForm.operationType) params.operation_type = searchForm.operationType
        if (searchForm.module) params.module = searchForm.module
        if (searchForm.userId) params.user_id = searchForm.userId
        if (searchForm.ipAddress) params.ip_address = searchForm.ipAddress
        if (searchForm.responseStatus) params.response_status = searchForm.responseStatus

        if (searchForm.timeRange && Array.isArray(searchForm.timeRange) && searchForm.timeRange.length === 2) {
            params.start_date = searchForm.timeRange[0]
            params.end_date = searchForm.timeRange[1]
        }

        if (logType.value === 'operation') {
            // 调用操作日志API
            const response = await operationLogApi.getOperationLogs(params)
            if (response.code === 200) {
                operationLogs.value = response.data.logs || []
                total.value = response.data.total || 0

                // 更新统计数据
                const successLogs = operationLogs.value.filter(log => log.response_status < 400).length
                const errorLogs = operationLogs.value.filter(log => log.response_status >= 400).length
                const avgDuration = operationLogs.value.length > 0
                    ? Math.round(operationLogs.value.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / operationLogs.value.length)
                    : 0

                stats.totalLogs = operationLogs.value.length
                stats.successLogs = successLogs
                stats.errorLogs = errorLogs
                stats.avgDuration = avgDuration
            }
        } else {
            // 调用下载日志API
            const response = await operationLogApi.getDownloadLogs(params)
            if (response.code === 200) {
                downloadLogs.value = response.data.logs || []
                total.value = response.data.total || 0
            }
        }

        ElMessage.success('查询完成')
    } catch (error) {
        console.error('查询失败:', error)
        ElMessage.error('查询失败，请重试')

        // 如果API调用失败，使用模拟数据
        if (logType.value === 'operation') {
            const mockData = [
                {
                    id: 1,
                    user_id: 1,
                    user: { username: 'admin', name: '管理员' },
                    operation_type: 'query',
                    module: 'certificate',
                    action: 'search',
                    request_method: 'GET',
                    request_path: '/api/certificate-quantity/search',
                    response_status: 200,
                    response_message: '查询成功',
                    result_count: 1250,
                    ip_address: '192.168.1.100',
                    start_time: '2024-01-15T10:30:00',
                    end_time: '2024-01-15T10:30:05',
                    duration_ms: 5000,
                    request_params: '{"startDate":"2024-01-01","endDate":"2024-01-15"}',
                    business_data: '{"query_type":"date_range","vehicle_type":"all"}',
                    error_message: null,
                    remarks: null
                }
            ]
            operationLogs.value = mockData
            total.value = mockData.length
        }
    } finally {
        loading.value = false
    }
}

const handleReset = () => {
    searchForm.operationType = ''
    searchForm.module = ''
    searchForm.timeRange = undefined
    searchForm.userId = ''
    searchForm.ipAddress = ''
    searchForm.responseStatus = ''
    pagination.page = 1
    operationLogs.value = []
    downloadLogs.value = []
    hasSearched.value = false
}

const handleLogTypeChange = () => {
    pagination.page = 1
    handleSearch()
}

const handleViewDetail = (row: any) => {
    selectedLog.value = row
    detailDialogVisible.value = true
}

const handleExport = () => {
    ElMessage.success('导出功能开发中...')
}

const handlePageChange = (page: number) => {
    pagination.page = page
    handleSearch()
}

const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
    handleSearch()
}

// 工具函数
const getOperationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        'login': '登录',
        'logout': '登出',
        'query': '查询',
        'export': '导出',
        'download': '下载',
        'view': '查看'
    }
    return labels[type] || type
}

const getOperationTypeTag = (type: string) => {
    const tags: Record<string, string> = {
        'login': 'success',
        'logout': 'info',
        'query': 'primary',
        'export': 'warning',
        'download': 'success',
        'view': 'info'
    }
    return tags[type] || 'default'
}

const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
        'certificate': '合格证',
        'product': '产品',
        'enterprise': '企业',
        'tax': '财税',
        'statistics': '统计',
        'auth': '认证'
    }
    return labels[module] || module
}

const getDownloadStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        'pending': '等待中',
        'processing': '处理中',
        'completed': '已完成',
        'failed': '失败'
    }
    return labels[status] || status
}

const getDownloadStatusTag = (status: string) => {
    const tags: Record<string, 'success' | 'info' | 'primary' | 'warning' | 'danger'> = {
        'pending': 'info',
        'processing': 'warning',
        'completed': 'success',
        'failed': 'danger'
    }
    return tags[status] || 'default'
}

const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '-'
    return new Date(dateTime).toLocaleString('zh-CN')
}

const formatFileSize = (bytes: number) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const formatNumber = (num: number) => {
    return num.toLocaleString()
}

const formatJson = (jsonStr: string) => {
    try {
        return JSON.stringify(JSON.parse(jsonStr), null, 2)
    } catch {
        return jsonStr
    }
}

// 生命周期
onMounted(() => {
    // 页面加载时自动查询
    handleSearch()
})
</script>

<style scoped>
.operation-log {
    padding: 0;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding: 20px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
    margin: 0 0 8px 0;
    color: #303133;
    font-size: 24px;
    font-weight: 600;
}

.page-description {
    margin: 0;
    color: #606266;
    font-size: 14px;
    line-height: 1.5;
}

.search-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
}

.search-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
}

.stats-row {
    margin-bottom: 20px;
}

.stats-card {
    text-align: center;
}

.stats-item {
    padding: 10px 0;
}

.stats-value {
    font-size: 28px;
    font-weight: bold;
    color: #409eff;
    margin-bottom: 5px;
}

.stats-label {
    font-size: 14px;
    color: #606266;
}

.log-type-card {
    margin-bottom: 20px;
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding: 20px 0;
}

.log-detail {
    max-height: 600px;
    overflow-y: auto;
}

.detail-section {
    margin-top: 20px;
}

.detail-section h4 {
    margin: 0 0 10px 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
}

.detail-section pre {
    background: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
}

.error-message {
    color: #f56c6c;
    background: #fef0f0;
    border-color: #fbc4c4;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        gap: 15px;
    }

    .search-actions {
        flex-wrap: wrap;
    }

    .stats-row .el-col {
        margin-bottom: 10px;
    }
}
</style>
</rewritten_file>