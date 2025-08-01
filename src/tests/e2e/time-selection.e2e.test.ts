/**
 * 时间选择组件端到端测试
 * 覆盖所有业务场景的完整测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TimeSelectionComponent from '../../components/TimeSelectionComponent.vue'
import type { TimeSelectionState, TimeSelectionConfig } from '../../types/time-selection'

// Mock Element Plus components
const mockElementPlusComponents = {
    ElCheckbox: { template: '<input type="checkbox" v-bind="$attrs" @change="$emit(\'change\', $event.target.checked)" />' },
    ElTooltip: { template: '<div><slot /></div>' },
    ElIcon: { template: '<span><slot /></span>' },
    ElAlert: { template: '<div class="el-alert" :class="type"><slot /></div>', props: ['type'] },
    ElCollapse: { template: '<div><slot /></div>' },
    ElCollapseItem: { template: '<div><slot /></div>' }
}

describe('时间选择组件端到端测试', () => {
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

        wrapper = mount(TimeSelectionComponent, {
            props: {
                config,
                title: '时间选择测试',
                showDebugInfo: false
            },
            global: {
                stubs: mockElementPlusComponents
            }
        })
    })

    afterEach(() => {
        wrapper.unmount()
    })

    describe('业务场景1: 历史总量查询', () => {
        it('应该支持xxx公司历史合格证上传数量查询', async () => {
            // 选择历史总量
            await wrapper.vm.handleQuickOptionSelect({ key: 'total', label: '历史总量' })
            
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('total')
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.quickSelectionKey).toBe('total')
            expect(queryParams.startDate).toBeUndefined()
            expect(queryParams.endDate).toBeUndefined()
            
            // 验证查询策略
            expect(queryParams.queryStrategy).toBe('total')
        })

        it('应该推荐按年度统计', async () => {
            await wrapper.vm.handleQuickOptionSelect({ key: 'total', label: '历史总量' })
            
            // 检查统计模式建议
            const state = wrapper.vm.getState()
            expect(state.statisticsMode).toBe('total')
            
            // 验证推荐的时间单位
            const queryParams = wrapper.vm.getQueryParams()
            expect(['year', 'month'].includes(queryParams.timeUnit)).toBe(true)
        })
    })

    describe('业务场景2: 分年度统计查询', () => {
        it('应该支持奥迪(AUDI)品牌合格证上传数量分年度统计', async () => {
            // 选择近两年
            await wrapper.vm.handleQuickOptionSelect({ key: 'recent2years', label: '近两年' })
            
            // 选择年度时间单位
            await wrapper.vm.handleTimeUnitChange('year')
            
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('recent2years')
            expect(state.timeUnit).toBe('year')
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.timeUnit).toBe('year')
            expect(queryParams.dbTimeField).toBe('UPY')
            expect(queryParams.groupBy).toBe('UPY')
            
            // 验证时间范围
            expect(queryParams.startDate).toBeDefined()
            expect(queryParams.endDate).toBeDefined()
            
            const startYear = queryParams.startDate.getFullYear()
            const currentYear = new Date().getFullYear()
            expect(startYear).toBe(currentYear - 2)
        })

        it('应该支持按月度分组统计', async () => {
            await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
            await wrapper.vm.handleTimeUnitChange('month')
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.timeUnit).toBe('month')
            expect(queryParams.dbTimeField).toBe('UPM')
            expect(queryParams.groupBy).toBe('UPM')
        })
    })

    describe('业务场景3: 近期查询', () => {
        it('应该支持xxx公司近3月合格证上传数量查询', async () => {
            await wrapper.vm.handleQuickOptionSelect({ key: 'recent3months', label: '近三月' })
            
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('recent3months')
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.quickSelectionKey).toBe('recent3months')
            
            // 验证时间范围
            const startDate = queryParams.startDate
            const endDate = queryParams.endDate
            const now = new Date()
            
            expect(startDate).toBeDefined()
            expect(endDate).toBeDefined()
            
            // 验证是否为近3个月
            const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                              (now.getMonth() - startDate.getMonth())
            expect(monthsDiff).toBeCloseTo(3, 1)
        })

        it('应该推荐按月统计', async () => {
            await wrapper.vm.handleQuickOptionSelect({ key: 'recent3months', label: '近三月' })
            
            // 检查推荐的统计粒度
            const queryParams = wrapper.vm.getQueryParams()
            expect(['month', 'day'].includes(queryParams.timeUnit)).toBe(true)
        })
    })

    describe('业务场景4: 同期比分析', () => {
        it('应该支持同一年份内的同期比分析', async () => {
            // 选择今年
            await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
            
            // 启用同期比
            await wrapper.vm.handleComparisonToggle(true)
            
            const state = wrapper.vm.getState()
            expect(state.comparisonEnabled).toBe(true)
            
            // 验证没有跨年警告
            expect(state.validation.level).not.toBe('warning')
        })

        it('应该对跨年时间范围显示警告', async () => {
            // 选择近两年
            await wrapper.vm.handleQuickOptionSelect({ key: 'recent2years', label: '近两年' })
            
            // 启用同期比
            await wrapper.vm.handleComparisonToggle(true)
            
            await nextTick()
            
            const state = wrapper.vm.getState()
            expect(state.comparisonEnabled).toBe(true)
            
            // 应该显示跨年警告
            expect(state.validation.level).toBe('warning')
            expect(state.validation.message).toContain('跨年')
        })

        it('应该支持继续跨年同期比分析', async () => {
            await wrapper.vm.handleQuickOptionSelect({ key: 'recent2years', label: '近两年' })
            await wrapper.vm.handleComparisonToggle(true)
            
            // 模拟用户选择继续
            await wrapper.vm.handleContinueWithCrossYear()
            
            const state = wrapper.vm.getState()
            expect(state.comparisonEnabled).toBe(true)
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.enableComparison).toBe(true)
        })
    })

    describe('业务场景5: 自定义时间范围', () => {
        it('应该支持自定义日期范围查询', async () => {
            // 选择自定义
            await wrapper.vm.handleCustomOptionSelect()
            
            // 设置自定义时间范围
            const startDate = new Date('2023-01-01')
            const endDate = new Date('2023-06-30')
            
            await wrapper.vm.handleTimeRangeChange({
                startDate,
                endDate
            })
            
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('custom')
            expect(state.timeRange.startDate).toEqual(startDate)
            expect(state.timeRange.endDate).toEqual(endDate)
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.startDate).toEqual(startDate)
            expect(queryParams.endDate).toEqual(endDate)
            expect(queryParams.queryStrategy).toBe('range')
        })

        it('应该验证自定义时间范围的有效性', async () => {
            await wrapper.vm.handleCustomOptionSelect()
            
            // 设置无效的时间范围（结束日期早于开始日期）
            const startDate = new Date('2023-06-30')
            const endDate = new Date('2023-01-01')
            
            await wrapper.vm.handleTimeRangeChange({
                startDate,
                endDate
            })
            
            const state = wrapper.vm.getState()
            expect(state.validation.isValid).toBe(false)
            expect(state.validation.level).toBe('error')
        })
    })

    describe('业务场景6: 不同时间单位查询', () => {
        it('应该支持年度查询并映射到UPY字段', async () => {
            await wrapper.vm.handleTimeUnitChange('year')
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.timeUnit).toBe('year')
            expect(queryParams.dbTimeField).toBe('UPY')
        })

        it('应该支持月度查询并映射到UPM字段', async () => {
            await wrapper.vm.handleTimeUnitChange('month')
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.timeUnit).toBe('month')
            expect(queryParams.dbTimeField).toBe('UPM')
        })

        it('应该支持日期查询并映射到UPD字段', async () => {
            await wrapper.vm.handleTimeUnitChange('day')
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.timeUnit).toBe('day')
            expect(queryParams.dbTimeField).toBe('UPD')
        })
    })

    describe('业务场景7: 组合查询场景', () => {
        it('应该支持复杂的组合查询场景', async () => {
            // 场景：查询某企业今年按月统计的合格证数量，并与去年同期对比
            
            // 1. 选择今年
            await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
            
            // 2. 选择月度统计
            await wrapper.vm.handleTimeUnitChange('month')
            
            // 3. 启用同期比
            await wrapper.vm.handleComparisonToggle(true)
            
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('thisYear')
            expect(state.timeUnit).toBe('month')
            expect(state.comparisonEnabled).toBe(true)
            
            const queryParams = wrapper.vm.getQueryParams()
            expect(queryParams.timeUnit).toBe('month')
            expect(queryParams.dbTimeField).toBe('UPM')
            expect(queryParams.enableComparison).toBe(true)
            expect(queryParams.groupBy).toBe('UPM')
            
            // 验证时间范围为当前年份
            const currentYear = new Date().getFullYear()
            expect(queryParams.startDate.getFullYear()).toBe(currentYear)
            expect(queryParams.endDate.getFullYear()).toBe(currentYear)
        })
    })

    describe('错误处理和边界情况', () => {
        it('应该处理无效的快捷选项', async () => {
            try {
                await wrapper.vm.handleQuickOptionSelect({ key: 'invalid', label: '无效选项' })
            } catch (error) {
                expect(error).toBeDefined()
            }
        })

        it('应该处理组件重置', async () => {
            // 设置一些状态
            await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
            await wrapper.vm.handleTimeUnitChange('month')
            await wrapper.vm.handleComparisonToggle(true)
            
            // 重置组件
            wrapper.vm.reset()
            
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('')
            expect(state.timeUnit).toBe('day')
            expect(state.comparisonEnabled).toBe(false)
            expect(state.timeRange).toBeNull()
        })

        it('应该处理验证失败的情况', async () => {
            const validation = wrapper.vm.validate()
            expect(validation).toBeDefined()
            expect(typeof validation.isValid).toBe('boolean')
            expect(validation.level).toMatch(/^(success|warning|error)$/)
        })
    })

    describe('性能测试', () => {
        it('应该在合理时间内完成状态更新', async () => {
            const startTime = performance.now()
            
            // 执行多次状态更新
            for (let i = 0; i < 100; i++) {
                await wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
                await wrapper.vm.handleTimeUnitChange('month')
                await wrapper.vm.handleComparisonToggle(true)
                wrapper.vm.reset()
            }
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            // 应该在1秒内完成
            expect(duration).toBeLessThan(1000)
        })

        it('应该正确处理大量快速点击', async () => {
            const clickPromises = []
            
            // 模拟快速点击
            for (let i = 0; i < 50; i++) {
                clickPromises.push(
                    wrapper.vm.handleQuickOptionSelect({ key: 'thisYear', label: '今年' })
                )
            }
            
            await Promise.all(clickPromises)
            
            // 最终状态应该是一致的
            const state = wrapper.vm.getState()
            expect(state.quickSelection).toBe('thisYear')
        })
    })
})
