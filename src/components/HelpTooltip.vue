<template>
  <div class="help-tooltip">
    <el-tooltip :content="content" :placement="placement" :effect="effect" :disabled="!content" :show-after="showAfter"
      :hide-after="hideAfter" :popper-class="popperClass">
      <template #content>
        <div class="help-content" v-if="useSlot">
          <slot />
        </div>
        <div class="help-content" v-else>
          <div v-if="title" class="help-title">{{ title }}</div>
          <div class="help-text" v-html="formattedContent"></div>
          <div v-if="examples.length > 0" class="help-examples">
            <div class="examples-title">示例：</div>
            <ul class="examples-list">
              <li v-for="(example, index) in examples" :key="index">
                {{ example }}
              </li>
            </ul>
          </div>
          <div v-if="links.length > 0" class="help-links">
            <a v-for="(link, index) in links" :key="index" :href="link.url" target="_blank" class="help-link">
              {{ link.text }}
            </a>
          </div>
        </div>
      </template>

      <el-icon :class="['help-icon', iconClass]" :style="{ color: iconColor, fontSize: iconSize }" @click="handleClick">
        <component :is="icon" />
      </el-icon>
    </el-tooltip>

    <!-- 详细帮助对话框 -->
    <el-dialog v-model="showDetailDialog" :title="dialogTitle" width="600px" @close="closeDetailDialog">
      <div class="detail-help-content">
        <div v-if="detailContent" v-html="detailContent"></div>
        <slot name="detail" v-else />
      </div>

      <template #footer>
        <el-button @click="closeDetailDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { QuestionFilled, InfoFilled, Warning } from '@element-plus/icons-vue'

interface HelpLink {
  text: string
  url: string
}

interface Props {
  content?: string
  title?: string
  examples?: string[]
  links?: HelpLink[]
  detailContent?: string
  dialogTitle?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
  effect?: 'dark' | 'light'
  icon?: any
  iconColor?: string
  iconSize?: string
  iconClass?: string
  showAfter?: number
  hideAfter?: number
  popperClass?: string
  clickable?: boolean
  useSlot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  title: '',
  examples: () => [],
  links: () => [],
  detailContent: '',
  dialogTitle: '帮助信息',
  placement: 'top',
  effect: 'dark',
  icon: QuestionFilled,
  iconColor: '#909399',
  iconSize: '16px',
  iconClass: '',
  showAfter: 300,
  hideAfter: 100,
  popperClass: 'help-tooltip-popper',
  clickable: false,
  useSlot: false
})

// 响应式数据
const showDetailDialog = ref(false)

// 格式化内容（支持简单的HTML标签）
const formattedContent = computed(() => {
  if (!props.content) return ''

  return props.content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
})

// 处理点击事件
const handleClick = () => {
  if (props.clickable && (props.detailContent || props.useSlot)) {
    showDetailDialog.value = true
  }
}

// 关闭详细帮助对话框
const closeDetailDialog = () => {
  showDetailDialog.value = false
}


</script>

<style scoped>
.help-tooltip {
  display: inline-block;
  margin-left: 4px;
}

.help-icon {
  cursor: help;
  vertical-align: middle;
  transition: color 0.3s;
}

.help-icon:hover {
  color: #409eff !important;
}

.help-icon.clickable {
  cursor: pointer;
}

.help-content {
  max-width: 300px;
  line-height: 1.5;
}

.help-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.help-text {
  margin-bottom: 10px;
  color: #606266;
}

.help-text :deep(strong) {
  font-weight: bold;
  color: #303133;
}

.help-text :deep(em) {
  font-style: italic;
}

.help-text :deep(code) {
  background-color: #f5f7fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.help-examples {
  margin-bottom: 10px;
}

.examples-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #409eff;
}

.examples-list {
  margin: 0;
  padding-left: 16px;
  color: #606266;
}

.examples-list li {
  margin-bottom: 3px;
  font-size: 12px;
}

.help-links {
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
}

.help-link {
  display: inline-block;
  margin-right: 10px;
  color: #409eff;
  text-decoration: none;
  font-size: 12px;
}

.help-link:hover {
  text-decoration: underline;
}

.detail-help-content {
  line-height: 1.6;
  color: #606266;
}

.detail-help-content :deep(h1),
.detail-help-content :deep(h2),
.detail-help-content :deep(h3) {
  color: #303133;
  margin-top: 20px;
  margin-bottom: 10px;
}

.detail-help-content :deep(ul),
.detail-help-content :deep(ol) {
  padding-left: 20px;
}

.detail-help-content :deep(li) {
  margin-bottom: 5px;
}

.detail-help-content :deep(code) {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.detail-help-content :deep(pre) {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
}
</style>

<style>
.help-tooltip-popper {
  max-width: 350px !important;
}

.help-tooltip-popper .el-tooltip__content {
  line-height: 1.5 !important;
}
</style>
