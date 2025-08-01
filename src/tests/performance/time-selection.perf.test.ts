/**
 * 时间选择组件性能测试
 * 测试组件在各种场景下的性能表现
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TimeSelectionComponent from '../../components/TimeSelectionComponent.vue'
import type { TimeSelectionState, TimeSelectionConfig } from '../../types/time-selection'

// 性能测试工具函数
function measurePerformance<T>(fn: () => T): { result: T; duration: number } {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    return { result, duration: end - start }
}

async function measureAsyncPerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    return { result, duration: end - start }
}

// Mock Element Plus components for performance testing
const mockElementPlusComponents = {
    ElCheckbox: { template: '<input type="checkbox" v-bind="$attrs" @change="$emit(\'change\', $event.target.checked)" />' },
    ElTooltip: { template: '<div><slot /></div>' },
    ElIcon: { template: '<span><slot /></span>' },
    ElAlert: { template: '<div class="el-alert" :class="type"><slot /></div>', props: ['type'] },
    ElCollapse: { template: '<div><slot /></div>' },
    ElCollapseItem: { template: '<div><slot /></div>' }
}

describe('时间选择组件性能测试', () => {
    let wrapper: any
    let config: TimeSelectionConfig

    beforeEach(() => {
        config = {
            quickSelection: {
                enabled: true,
                options: [
                    { key: 'total', label: '历史总量', description: '查询所有历史数据' },
                    { key: 'recent2years', label: '近两年', description: '查询最近两年的数据' },
                    { key: 'recent6months', label: '近六月', description: '查询最近六个月的数据' },
                    { key: 'recent3months', label: '近三月', description: '查询最近三个月的数据' },
                    { key: 'thisYear', label: '今年', description: '查询当前年份的数据' },
                    { key: 'lastYear', label: '去年', description: '查询上一年份的数据' }
                ],
                defaultOption: 'total',
                showDescription: true,
                showStatisticsSuggestion: true
            },
            timeUnits: {
                enabled: true,
                availableUnits: ['year', 'month', 'day'],
                defaultUnit: 'day',
                showUnitDescription: true
            },
            comparison: {
                enabled: true,
                showValidation: true,
                allowCrossYear: true,
                showWarningForCrossYear: true
            },
            validation: {
                enabled: true,
                showRealTimeValidation: true,
                showDetailedMessages: true
            },
            defaultTimeUnit: 'day'
        }
    })

    afterEach(() => {
        wrapper?.unmount()
    })

    describe('组件初始化性能', () => {
        it('应该在100ms内完成组件初始化', () => {
            const { duration } = measurePerformance(() => {
                wrapper = mount(TimeSelectionComponent, {
                    props: { config, title: '性能测试' },
                    global: { stubs: mockElementPlusComponents }
                })
            })

            expect(duration).toBeLessThan(100)
            expect(wrapper.exists()).toBe(true)
        })

        it('应该在合理时间内完成大量选项的渲染', () => {
            const largeConfig = {
                ...config,
                quickSelection: {
                    ...config.quickSelection,
                    options: Array.from({ length: 50 }, (_, i) => ({
                        key: `option${i}`,
                        label: `选项${i}`,
                        description: `这是选项${i}的描述`
                    }))
                }
            }

            const { duration } = measurePerformance(() => {
                wrapper = mount(TimeSelectionComponent, {
                    props: { config: largeConfig, title: '大量选项测试' },
                    global: { stubs: mockElementPlusComponents }
                })
            })

            expect(duration).toBeLessThan(200)
        })
    })

    describe('状态更新性能', () => {
        beforeEach(() => {
            wrapper = mount(TimeSelectionComponent, {
                props: { config, title: '状态更新测试' },
                global: { stubs: mockElementPlusComponents }
            })
        })

        it('应该在50ms内完成快捷选项切换', async () => {
            const { duration } = await measureAsyncPerformance(async () => {
                await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
                await nextTick()
            })

            expect(duration).toBeLessThan(50)
            expect(wrapper.vm.getState().quickSelection).toBe('thisYear')
        })

        it('应该在30ms内完成时间单位切换', async () => {
            const { duration } = await measureAsyncPerformance(async () => {
                await wrapper.vm.handleTimeUnitChange('month')
                await nextTick()
            })

            expect(duration).toBeLessThan(30)
            expect(wrapper.vm.getState().timeUnit).toBe('month')
        })

        it('应该在20ms内完成同期比开关切换', async () => {
            const { duration } = await measureAsyncPerformance(async () => {
                await wrapper.vm.handleComparisonToggle(true)
                await nextTick()
            })

            expect(duration).toBeLessThan(20)
            expect(wrapper.vm.getState().comparisonEnabled).toBe(true)
        })

        it('应该在100ms内完成复杂状态更新', async () => {
            const { duration } = await measureAsyncPerformance(async () => {
                await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
                await wrapper.vm.handleTimeUnitChange('month')
                await wrapper.vm.handleComparisonToggle(true)
                await nextTick()
            })

            expect(duration).toBeLessThan(100)
            
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('thisYear')
            expect(state.timeUnit).toBe('month')
            expect(state.comparisonEnabled).toBe(true)
        })
    })

    describe('查询参数生成性能', () => {
        beforeEach(() => {
            wrapper = mount(TimeSelectionComponent, {
                props: { config, title: '查询参数测试' },
                global: { stubs: mockElementPlusComponents }
            })
        })

        it('应该在10ms内生成查询参数', () => {
            // 设置一些状态
            wrapper.vm.setState({
                quickSelection: 'thisYear',
                timeUnit: 'month',
                timeRange: null,
                comparisonEnabled: true,
                statisticsMode: 'monthly',
                validation: { isValid: true, level: 'success', message: '' }
            })

            const { duration, result } = measurePerformance(() => {
                return wrapper.vm.getQueryParams()
            })

            expect(duration).toBeLessThan(10)
            expect(result).toBeDefined()
            expect(result.timeUnit).toBe('month')
            expect(result.enableComparison).toBe(true)
        })

        it('应该在5ms内完成状态验证', () => {
            const { duration, result } = measurePerformance(() => {
                return wrapper.vm.validate()
            })

            expect(duration).toBeLessThan(5)
            expect(result).toBeDefined()
            expect(typeof result.isValid).toBe('boolean')
        })
    })

    describe('大量操作性能', () => {
        beforeEach(() => {
            wrapper = mount(TimeSelectionComponent, {
                props: { config, title: '大量操作测试' },
                global: { stubs: mockElementPlusComponents }
            })
        })

        it('应该能够处理快速连续的状态更新', async () => {
            const operations = 100
            const { duration } = await measureAsyncPerformance(async () => {
                for (let i = 0; i < operations; i++) {
                    await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
                    await wrapper.vm.handleTimeUnitChange('month')
                    await wrapper.vm.handleComparisonToggle(i % 2 === 0)
                }
                await nextTick()
            })

            // 100次操作应该在1秒内完成
            expect(duration).toBeLessThan(1000)
            
            // 验证最终状态正确
            const finalState = wrapper.vm.getState()
            expect(finalState.quickSelection).toBe('thisYear')
            expect(finalState.timeUnit).toBe('month')
        })

        it('应该能够处理大量快速点击', async () => {
            const clicks = 50
            const promises: Promise<void>[] = []

            const { duration } = await measureAsyncPerformance(async () => {
                for (let i = 0; i < clicks; i++) {
                    promises.push(wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' }))
                }
                await Promise.all(promises)
                await nextTick()
            })

            // 50次快速点击应该在500ms内完成
            expect(duration).toBeLessThan(500)
            
            // 最终状态应该一致
            expect(wrapper.vm.getState().quickSelection).toBe('thisYear')
        })
    })

    describe('内存使用性能', () => {
        it('应该正确清理组件资源', () => {
            const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
            
            // 创建和销毁多个组件实例
            for (let i = 0; i < 10; i++) {
                const testWrapper = mount(TimeSelectionComponent, {
                    props: { config, title: `测试${i}` },
                    global: { stubs: mockElementPlusComponents }
                })
                
                // 执行一些操作
                testWrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
                testWrapper.vm.handleTimeUnitChange('month')
                
                // 销毁组件
                testWrapper.unmount()
            }

            // 强制垃圾回收（如果支持）
            if (global.gc) {
                global.gc()
            }

            const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
            
            // 内存增长应该在合理范围内（小于10MB）
            const memoryIncrease = finalMemory - initialMemory
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
        })
    })

    describe('防抖性能测试', () => {
        beforeEach(() => {
            wrapper = mount(TimeSelectionComponent, {
                props: { config, title: '防抖测试' },
                global: { stubs: mockElementPlusComponents }
            })
        })

        it('应该正确应用防抖机制', async () => {
            let validationCallCount = 0
            const originalValidate = wrapper.vm.validate
            wrapper.vm.validate = vi.fn(() => {
                validationCallCount++
                return originalValidate.call(wrapper.vm)
            })

            // 快速触发多次状态更新
            for (let i = 0; i < 10; i++) {
                wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
            }

            // 等待防抖延迟
            await new Promise(resolve => setTimeout(resolve, 350))

            // 验证函数调用次数应该被防抖限制
            expect(validationCallCount).toBeLessThan(10)
            expect(validationCallCount).toBeGreaterThan(0)
        })
    })

    describe('响应式性能测试', () => {
        it('应该在不同屏幕尺寸下保持良好性能', () => {
            const screenSizes = [
                { width: 1920, height: 1080 }, // 桌面
                { width: 1024, height: 768 },  // 平板
                { width: 375, height: 667 }    // 手机
            ]

            screenSizes.forEach(size => {
                // 模拟屏幕尺寸变化
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: size.width
                })
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: size.height
                })

                const { duration } = measurePerformance(() => {
                    wrapper = mount(TimeSelectionComponent, {
                        props: { config, title: `${size.width}x${size.height}测试` },
                        global: { stubs: mockElementPlusComponents }
                    })
                })

                expect(duration).toBeLessThan(150)
                wrapper.unmount()
            })
        })
    })

    describe('错误处理性能', () => {
        beforeEach(() => {
            wrapper = mount(TimeSelectionComponent, {
                props: { config, title: '错误处理测试' },
                global: { stubs: mockElementPlusComponents }
            })
        })

        it('应该快速处理验证错误', async () => {
            const { duration } = await measureAsyncPerformance(async () => {
                // 触发验证错误
                await wrapper.vm.handleTimeRangeChange({
                    startDate: new Date('2023-12-31'),
                    endDate: new Date('2023-01-01') // 无效范围
                })
                await nextTick()
            })

            expect(duration).toBeLessThan(50)
            
            const state = wrapper.vm.getState()
            expect(state.validation.isValid).toBe(false)
        })

        it('应该快速从错误状态恢复', async () => {
            // 先设置错误状态
            await wrapper.vm.handleTimeRangeChange({
                startDate: new Date('2023-12-31'),
                endDate: new Date('2023-01-01')
            })

            const { duration } = await measureAsyncPerformance(async () => {
                // 修正错误
                await wrapper.vm.handleTimeRangeChange({
                    startDate: new Date('2023-01-01'),
                    endDate: new Date('2023-12-31')
                })
                await nextTick()
            })

            expect(duration).toBeLessThan(50)
            
            const state = wrapper.vm.getState()
            expect(state.validation.isValid).toBe(true)
        })
    })

    describe('性能基准测试', () => {
        const performanceTargets = {
            componentInit: 100,      // 组件初始化 < 100ms
            stateUpdate: 50,         // 状态更新 < 50ms
            queryGeneration: 10,     // 查询参数生成 < 10ms
            validation: 5,           // 验证 < 5ms
            errorHandling: 50        // 错误处理 < 50ms
        }

        it('应该满足所有性能基准', async () => {
            // 组件初始化性能
            const { duration: initDuration } = measurePerformance(() => {
                wrapper = mount(TimeSelectionComponent, {
                    props: { config, title: '基准测试' },
                    global: { stubs: mockElementPlusComponents }
                })
            })
            expect(initDuration).toBeLessThan(performanceTargets.componentInit)

            // 状态更新性能
            const { duration: updateDuration } = await measureAsyncPerformance(async () => {
                await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
                await nextTick()
            })
            expect(updateDuration).toBeLessThan(performanceTargets.stateUpdate)

            // 查询参数生成性能
            const { duration: queryDuration } = measurePerformance(() => {
                wrapper.vm.getQueryParams()
            })
            expect(queryDuration).toBeLessThan(performanceTargets.queryGeneration)

            // 验证性能
            const { duration: validationDuration } = measurePerformance(() => {
                wrapper.vm.validate()
            })
            expect(validationDuration).toBeLessThan(performanceTargets.validation)

            // 错误处理性能
            const { duration: errorDuration } = await measureAsyncPerformance(async () => {
                await wrapper.vm.handleTimeRangeChange({
                    startDate: new Date('2023-12-31'),
                    endDate: new Date('2023-01-01')
                })
                await nextTick()
            })
            expect(errorDuration).toBeLessThan(performanceTargets.errorHandling)
        })
    })
})
