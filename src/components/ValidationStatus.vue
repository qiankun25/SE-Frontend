<template>
    <div class="ts-validation" :class="level" v-if="message">
        <div class="ts-validation-icon">
            <!-- 成功图标 -->
            <svg v-if="level === 'success'" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <!-- 警告图标 -->
            <svg v-else-if="level === 'warning'" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <!-- 错误图标 -->
            <svg v-else-if="level === 'error'" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <!-- 信息图标 -->
            <svg v-else viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
        </div>
        <div class="ts-validation-message">
            <div class="ts-validation-title">{{ title || message }}</div>
            <div v-if="description" class="ts-validation-description">{{ description }}</div>
        </div>
        <div v-if="showActions" class="ts-validation-actions">
            <slot name="actions">
                <button v-if="showContinue" type="button" @click="$emit('continue')" class="ts-quick-button">
                    继续
                </button>
                <button v-if="showReselect" type="button" @click="$emit('reselect')" class="ts-quick-button">
                    重新选择
                </button>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ValidationLevel } from '../types/time-selection'

interface Props {
    /** 验证级别 */
    level: ValidationLevel
    /** 主要消息 */
    message: string
    /** 标题（可选，默认使用message） */
    title?: string
    /** 详细描述 */
    description?: string
    /** 是否显示操作按钮 */
    showActions?: boolean
    /** 是否显示继续按钮 */
    showContinue?: boolean
    /** 是否显示重新选择按钮 */
    showReselect?: boolean
}

interface Emits {
    (e: 'continue'): void
    (e: 'reselect'): void
}

const props = withDefaults(defineProps<Props>(), {
    showActions: false,
    showContinue: false,
    showReselect: false
})

const emit = defineEmits<Emits>()
</script>

<style scoped>
/* 导入设计系统样式 */
@import '../styles/time-selection-design-system.css';

/* 验证状态样式已在设计系统中定义 */
.ts-validation-actions {
    display: flex;
    gap: var(--ts-spacing-element);
    margin-top: var(--ts-spacing-element);
}

.ts-validation-actions .ts-quick-button {
    min-height: 28px;
    padding: var(--ts-spacing-small) var(--ts-spacing-padding);
    font-size: var(--ts-font-size-small);
}
</style>
