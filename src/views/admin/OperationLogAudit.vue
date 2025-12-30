<template>
  <div class="operation-log-audit">
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <h2>操作日志</h2>
        <p class="subtitle">查看和分析系统操作日志</p>
      </div>
    </el-card>

    <!-- 统计概览卡片 -->
    <div v-if="statistics" class="statistics-cards">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon>
                  <Document />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.total_operations.toLocaleString() }}</div>
                <div class="stat-label">总操作次数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon success">
                <el-icon>
                  <CircleCheck />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ (statistics.total_operations - statistics.total_errors).toLocaleString() }}
                </div>
                <div class="stat-label">成功操作</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon error">
                <el-icon>
                  <CircleClose />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.total_errors.toLocaleString() }}</div>
                <div class="stat-label">失败操作</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon rate">
                <el-icon>
                  <TrendCharts />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ successRate }}%</div>
                <div class="stat-label">成功率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选面板 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" label-width="100px" @submit.prevent="handleSearch">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="用户ID">
              <el-input v-model.number="filterForm.user_id" placeholder="请输入用户ID" clearable @clear="handleSearch" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="操作类型">
              <el-select v-model="filterForm.operation_type" placeholder="请选择操作类型" clearable @change="handleSearch">
                <el-option label="全部" value="" />
                <el-option label="登录" value="login" />
                <el-option label="登出" value="logout" />
                <el-option label="查询" value="query" />
                <el-option label="导出" value="export" />
                <el-option label="下载" value="download" />
                <el-option label="查看" value="view" />
                <el-option label="API调用" value="api" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="模块">
              <el-select v-model="filterForm.module" placeholder="请选择模块" clearable @change="handleSearch">
                <el-option label="全部" value="" />
                <el-option label="认证" value="auth" />
                <el-option label="合格证" value="certificate" />
                <el-option label="产品" value="product" />
                <el-option label="企业" value="enterprise" />
                <el-option label="统计" value="statistics" />
                <el-option label="税务" value="tax" />
                <el-option label="API" value="api" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="开始日期">
              <el-date-picker v-model="filterForm.start_date" type="date" placeholder="选择开始日期" format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" style="width: 100%" @change="handleSearch" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="结束日期">
              <el-date-picker v-model="filterForm.end_date" type="date" placeholder="选择结束日期" format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" style="width: 100%" @change="handleSearch" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="快捷选择">
              <el-select v-model="quickTimeRange" placeholder="快捷时间选择" @change="handleQuickTimeRange">
                <el-option label="今天" value="today" />
                <el-option label="最近7天" value="last7days" />
                <el-option label="最近30天" value="last30days" />
                <el-option label="本月" value="thisMonth" />
                <el-option label="上月" value="lastMonth" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item>
              <el-button type="primary" @click="handleSearch" :loading="loading">
                <el-icon>
                  <Search />
                </el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon>
                  <RefreshLeft />
                </el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作日志列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>操作日志列表</span>
          <div class="header-actions">
            <el-dropdown @command="handleExportCommand" :disabled="exporting">
              <el-button type="primary" size="small" :loading="exporting">
                <el-icon>
                  <Download />
                </el-icon>
                导出日志
                <el-icon class="el-icon--right">
                  <ArrowDown />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="current">
                    导出当前页 ({{ logList.length }}条)
                  </el-dropdown-item>
                  <el-dropdown-item command="all">
                    导出全部数据
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" size="small" @click="handleRefresh" :loading="loading">
              <el-icon>
                <Refresh />
              </el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="logList" v-loading="loading" stripe border style="width: 100%"
        :default-sort="{ prop: 'start_time', order: 'descending' }">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="start_time" label="操作时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div>
              <div class="user-name">{{ row.user?.name || row.name || '-' }}</div>
              <div class="user-username">{{ row.user?.username || row.username || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeTag(row.operation_type)" size="small">
              {{ getOperationTypeLabel(row.operation_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.response_status && row.response_status < 400 ? 'success' : 'danger'" size="small">
              {{ row.response_status && row.response_status < 400 ? '成功' : '失败' }} </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="140" show-overflow-tooltip />
        <el-table-column prop="duration_ms" label="耗时(ms)" width="100" align="center" sortable>
          <template #default="{ row }">
            <span :class="getDurationClass(row.duration_ms)">
              {{ row.duration_ms || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="result_count" label="结果数" width="100" align="center" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="操作详情" width="800px" :close-on-click-modal="false">
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentLog.user_id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">
            {{ currentLog.user?.username || currentLog.username || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="姓名">
            {{ currentLog.user?.name || currentLog.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">
            {{ formatDateTime(currentLog.start_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationTypeTag(currentLog.operation_type)" size="small">
              {{ getOperationTypeLabel(currentLog.operation_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            <el-tag type="info" size="small">{{ currentLog.module }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="具体动作" :span="2">
            {{ currentLog.action }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">请求信息</el-divider>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="请求方法">
            {{ currentLog.request_method || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求路径">
            {{ currentLog.request_path || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求参数">
            <pre v-if="currentLog.request_params" class="json-content">{{ formatJSON(currentLog.request_params) }}</pre>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">响应信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="响应状态">
            <el-tag :type="currentLog.response_status && currentLog.response_status < 400 ? 'success' : 'danger'"
              size="small">
              {{ currentLog.response_status || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="响应消息">
            {{ currentLog.response_message || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="结果数量">
            {{ currentLog.result_count || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="执行时长">
            <span :class="getDurationClass(currentLog.duration_ms)">
              {{ currentLog.duration_ms ? `${currentLog.duration_ms} ms` : '-' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLog.error_message" label="错误信息" :span="2">
            <el-text type="danger">{{ currentLog.error_message }}</el-text>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider v-if="currentLog.business_data" content-position="left">业务数据</el-divider>
        <el-descriptions v-if="currentLog.business_data" :column="1" border>
          <el-descriptions-item label="业务数据">
            <pre class="json-content">{{ formatJSON(currentLog.business_data) }}</pre>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">环境信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="IP地址">
            {{ currentLog.ip_address || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户代理" :span="2">
            <div class="user-agent">{{ currentLog.user_agent || '-' }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider v-if="currentLog.remarks" content-position="left">备注</el-divider>
        <el-descriptions v-if="currentLog.remarks" :column="1" border>
          <el-descriptions-item label="备注">
            {{ currentLog.remarks }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Document,
  CircleCheck,
  CircleClose,
  TrendCharts,
  Search,
  RefreshLeft,
  Refresh,
  Download,
  ArrowDown,
} from "@element-plus/icons-vue";
import { getAllOperationLogs, getSystemStatistics, exportOperationLogs } from "../../services/operationLogApi";
import type { OperationLogItem, OperationLogStatistics } from "../../types/api";
import { downloadFile, generateFilename } from "../../utils/export";

// 筛选表单
const filterForm = reactive({
  user_id: undefined as number | undefined,
  operation_type: "",
  module: "",
  start_date: "",
  end_date: "",
});

// 快捷时间范围
const quickTimeRange = ref("");

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 数据
const logList = ref<OperationLogItem[]>([]);
const statistics = ref<OperationLogStatistics | null>(null);
const loading = ref(false);
const exporting = ref(false);

// 详情弹窗
const detailDialogVisible = ref(false);
const currentLog = ref<OperationLogItem | null>(null);

// 计算成功率
const successRate = computed(() => {
  if (!statistics.value || statistics.value.total_operations === 0) {
    return 0;
  }
  const rate = ((statistics.value.total_operations - statistics.value.total_errors) / statistics.value.total_operations) * 100;
  return rate.toFixed(2);
});

// 获取操作日志列表
const fetchLogs = async () => {
  loading.value = true;
  try {
    const response = await getAllOperationLogs({
      user_id: filterForm.user_id,
      operation_type: filterForm.operation_type,
      module: filterForm.module,
      start_date: filterForm.start_date,
      end_date: filterForm.end_date,
      page: pagination.page,
      pageSize: pagination.pageSize,
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize,
    });

    if (response.code === 200 && response.data) {
      logList.value = response.data.logs || [];
      pagination.total = response.data.total || 0;
    } else {
      ElMessage.error(response.message || "获取操作日志失败");
    }
  } catch (error: any) {
    console.error("获取操作日志失败:", error);
    ElMessage.error(error.response?.data?.detail || "获取操作日志失败");
  } finally {
    loading.value = false;
  }
};

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const response = await getSystemStatistics({
      start_date: filterForm.start_date,
      end_date: filterForm.end_date,
    });

    if (response.code === 200 && response.data) {
      statistics.value = response.data;
    }
  } catch (error: any) {
    console.error("获取统计数据失败:", error);
  }
};

// 查询
const handleSearch = () => {
  pagination.page = 1;
  fetchLogs();
  fetchStatistics();
};

// 重置
const handleReset = () => {
  filterForm.user_id = undefined;
  filterForm.operation_type = "";
  filterForm.module = "";
  filterForm.start_date = "";
  filterForm.end_date = "";
  quickTimeRange.value = "";
  handleSearch();
};

// 刷新
const handleRefresh = () => {
  fetchLogs();
  fetchStatistics();
};

// 快捷时间范围选择
const handleQuickTimeRange = (value: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (value) {
    case "today":
      filterForm.start_date = formatDate(today);
      filterForm.end_date = formatDate(today);
      break;
    case "last7days":
      filterForm.start_date = formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));
      filterForm.end_date = formatDate(today);
      break;
    case "last30days":
      filterForm.start_date = formatDate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));
      filterForm.end_date = formatDate(today);
      break;
    case "thisMonth":
      filterForm.start_date = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      filterForm.end_date = formatDate(today);
      break;
    case "lastMonth":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      filterForm.start_date = formatDate(lastMonthStart);
      filterForm.end_date = formatDate(lastMonthEnd);
      break;
  }
  handleSearch();
};

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchLogs();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  fetchLogs();
};

// 查看详情
const handleViewDetail = (row: OperationLogItem) => {
  currentLog.value = row;
  detailDialogVisible.value = true;
};

// 格式化日期时间
const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 格式化日期
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 格式化JSON
const formatJSON = (jsonStr: string) => {
  try {
    const obj = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonStr;
  }
};

// 获取操作类型标签
const getOperationTypeTag = (type: string) => {
  const tagMap: Record<string, any> = {
    login: "success",
    logout: "info",
    query: "primary",
    export: "warning",
    download: "warning",
    view: "",
    api: "info",
  };
  return tagMap[type] || "";
};

// 获取操作类型标签文本
const getOperationTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    login: "登录",
    logout: "登出",
    query: "查询",
    export: "导出",
    download: "下载",
    view: "查看",
    api: "API",
  };
  return labelMap[type] || type;
};

// 获取耗时样式类
const getDurationClass = (duration: number | undefined) => {
  if (!duration) return "";
  if (duration < 100) return "duration-fast";
  if (duration < 1000) return "duration-normal";
  return "duration-slow";
};

// 导出命令处理
const handleExportCommand = (command: string) => {
  if (command === "current") {
    handleExport();
  } else if (command === "all") {
    handleExportAll();
  }
};

// 导出当前页
const handleExport = async () => {
  if (logList.value.length === 0) {
    ElMessage.warning("当前页没有可导出的数据");
    return;
  }

  exporting.value = true;
  try {
    const params = {
      user_id: filterForm.user_id,
      operation_type: filterForm.operation_type || undefined,
      module: filterForm.module || undefined,
      start_date: filterForm.start_date || undefined,
      end_date: filterForm.end_date || undefined,
      format: "excel",
      filename: "操作日志_当前页",
      range: "current",
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize,
    };

    const blob = await exportOperationLogs(params);
    const filename = generateFilename("操作日志_当前页", "xlsx");
    downloadFile(blob, filename);

    ElMessage.success(`当前页数据导出成功（${logList.value.length}条记录）`);
  } catch (error: any) {
    console.error("导出失败:", error);
    const errorMessage = error?.message || "导出失败，请重试";
    ElMessage.error(errorMessage);
  } finally {
    exporting.value = false;
  }
};

// 导出全部数据
const handleExportAll = async () => {
  exporting.value = true;
  try {
    const params = {
      user_id: filterForm.user_id,
      operation_type: filterForm.operation_type || undefined,
      module: filterForm.module || undefined,
      start_date: filterForm.start_date || undefined,
      end_date: filterForm.end_date || undefined,
      format: "excel",
      filename: "操作日志_全部",
      range: "all",
    };

    const blob = await exportOperationLogs(params);
    const filename = generateFilename("操作日志_全部", "xlsx");
    downloadFile(blob, filename);

    ElMessage.success("全部数据导出成功");
  } catch (error: any) {
    console.error("导出失败:", error);
    const errorMessage = error?.message || "导出失败，请重试";
    ElMessage.error(errorMessage);
  } finally {
    exporting.value = false;
  }
};

// 初始化
onMounted(() => {
  // 默认查询最近7天
  quickTimeRange.value = "last7days";
  handleQuickTimeRange("last7days");
});
</script>

<style scoped lang="scss">
.operation-log-audit {
  padding: 20px;

  .header-card {
    margin-bottom: 20px;

    .page-header {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .statistics-cards {
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.success {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
            color: white;
          }

          &.error {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
          }

          &.rate {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            color: white;
          }
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 28px;
            font-weight: 600;
            color: #303133;
            line-height: 1.2;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .user-name {
      font-weight: 500;
      color: #303133;
    }

    .user-username {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }

    .duration-fast {
      color: #67c23a;
    }

    .duration-normal {
      color: #e6a23c;
    }

    .duration-slow {
      color: #f56c6c;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .log-detail {
    .json-content {
      background: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.6;
      max-height: 300px;
      overflow: auto;
      margin: 0;
    }

    .user-agent {
      word-break: break-all;
      font-size: 12px;
      color: #606266;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .operation-log-audit {
    padding: 10px;

    .statistics-cards {
      .stat-card {
        margin-bottom: 12px;
      }
    }
  }
}
</style>
