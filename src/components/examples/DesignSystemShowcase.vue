<template>
    <div class="design-showcase">
        <h1 class="ts-title">时间选择组件设计系统展示</h1>
        
        <!-- 颜色方案展示 -->
        <div class="ts-section">
            <h2 class="ts-label">颜色方案</h2>
            <div class="color-palette">
                <div class="color-item">
                    <div class="color-swatch primary"></div>
                    <span>主色调</span>
                </div>
                <div class="color-item">
                    <div class="color-swatch success"></div>
                    <span>成功</span>
                </div>
                <div class="color-item">
                    <div class="color-swatch warning"></div>
                    <span>警告</span>
                </div>
                <div class="color-item">
                    <div class="color-swatch error"></div>
                    <span>错误</span>
                </div>
            </div>
        </div>

        <!-- 快捷按钮展示 -->
        <div class="ts-section">
            <h2 class="ts-label">快捷按钮样式</h2>
            <div class="ts-quick-buttons">
                <button type="button" class="ts-quick-button">历史总量</button>
                <button type="button" class="ts-quick-button selected">今年</button>
                <button type="button" class="ts-quick-button">近六月</button>
                <button type="button" class="ts-quick-button custom">自定义</button>
            </div>
        </div>

        <!-- 验证状态展示 -->
        <div class="ts-section">
            <h2 class="ts-label">验证状态</h2>
            
            <div class="validation-examples">
                <ValidationStatus 
                    level="success" 
                    message="时间范围设置正确" 
                    description="当前选择的时间范围符合同期比分析要求" 
                />
                
                <ValidationStatus 
                    level="warning" 
                    message="跨年时间范围提醒" 
                    description="同期比分析建议选择同一年份内的时间范围，以确保分析结果的准确性"
                    :show-actions="true"
                    :show-continue="true"
                    :show-reselect="true"
                />
                
                <ValidationStatus 
                    level="error" 
                    message="时间范围无效" 
                    description="结束时间不能早于开始时间，请重新选择" 
                />
            </div>
        </div>

        <!-- 时间选择组件展示 -->
        <div class="ts-section">
            <h2 class="ts-label">完整组件展示</h2>
            <TimeSelectionComponent 
                v-model="demoState" 
                title="合格证查询时间选择"
                :show-debug-info="false"
                @change="handleDemoChange"
            />
        </div>

        <!-- 响应式展示 -->
        <div class="ts-section">
            <h2 class="ts-label">响应式设计</h2>
            <div class="responsive-demo">
                <div class="device-frame desktop">
                    <div class="device-label">桌面端 (≥1024px)</div>
                    <div class="ts-quick-buttons">
                        <button type="button" class="ts-quick-button">历史总量</button>
                        <button type="button" class="ts-quick-button selected">今年</button>
                        <button type="button" class="ts-quick-button">近六月</button>
                        <button type="button" class="ts-quick-button">近三月</button>
                        <button type="button" class="ts-quick-button">去年</button>
                        <button type="button" class="ts-quick-button custom">自定义</button>
                    </div>
                </div>
                
                <div class="device-frame tablet">
                    <div class="device-label">平板端 (768px-1023px)</div>
                    <div class="ts-quick-buttons tablet-layout">
                        <button type="button" class="ts-quick-button">历史总量</button>
                        <button type="button" class="ts-quick-button selected">今年</button>
                        <button type="button" class="ts-quick-button">近六月</button>
                        <button type="button" class="ts-quick-button">近三月</button>
                        <button type="button" class="ts-quick-button">去年</button>
                        <button type="button" class="ts-quick-button custom">自定义</button>
                    </div>
                </div>
                
                <div class="device-frame mobile">
                    <div class="device-label">移动端 (<768px)</div>
                    <div class="ts-quick-buttons mobile-layout">
                        <button type="button" class="ts-quick-button">历史总量</button>
                        <button type="button" class="ts-quick-button selected">今年</button>
                        <button type="button" class="ts-quick-button">近六月</button>
                        <button type="button" class="ts-quick-button">近三月</button>
                        <button type="button" class="ts-quick-button">去年</button>
                        <button type="button" class="ts-quick-button custom">自定义</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TimeSelectionComponent from '../TimeSelectionComponent.vue'
import ValidationStatus from '../ValidationStatus.vue'
import type { TimeSelectionState } from '../../types/time-selection'

// 演示状态
const demoState = ref<TimeSelectionState>({
    quickSelection: 'thisYear',
    timeUnit: 'day',
    timeRange: null,
    comparisonEnabled: false,
    statisticsMode: 'total',
    validation: {
        isValid: true,
        level: 'success',
        message: '时间范围设置正确'
    }
})

const handleDemoChange = (event: any) => {
    console.log('Demo state changed:', event)
}
</script>

<style scoped>
/* 导入设计系统样式 */
@import '../../styles/time-selection-design-system.css';

.design-showcase {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--ts-spacing-xlarge);
}

/* 颜色展示 */
.color-palette {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--ts-spacing-component);
    margin-top: var(--ts-spacing-component);
}

.color-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ts-spacing-element);
}

.color-swatch {
    width: 60px;
    height: 60px;
    border-radius: var(--ts-border-radius-large);
    border: 1px solid var(--ts-color-border);
}

.color-swatch.primary { background-color: var(--ts-color-primary); }
.color-swatch.success { background-color: var(--ts-color-success); }
.color-swatch.warning { background-color: var(--ts-color-warning); }
.color-swatch.error { background-color: var(--ts-color-error); }

/* 验证状态展示 */
.validation-examples {
    display: flex;
    flex-direction: column;
    gap: var(--ts-spacing-component);
    margin-top: var(--ts-spacing-component);
}

/* 响应式展示 */
.responsive-demo {
    display: flex;
    flex-direction: column;
    gap: var(--ts-spacing-large);
    margin-top: var(--ts-spacing-component);
}

.device-frame {
    border: 1px solid var(--ts-color-border);
    border-radius: var(--ts-border-radius-large);
    padding: var(--ts-spacing-component);
    background: var(--ts-color-bg-white);
}

.device-label {
    font-size: var(--ts-font-size-small);
    color: var(--ts-color-text-secondary);
    margin-bottom: var(--ts-spacing-padding);
    text-align: center;
}

.tablet-layout {
    grid-template-columns: repeat(3, 1fr);
}

.mobile-layout {
    grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
    .design-showcase {
        padding: var(--ts-spacing-component);
    }
    
    .responsive-demo {
        gap: var(--ts-spacing-component);
    }
}
</style>
