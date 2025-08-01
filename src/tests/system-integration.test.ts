/**
 * 系统集成测试
 * 测试新的时间选择组件与现有系统的集成
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import TimeSelectionAdapter from '../components/TimeSelectionAdapter.vue'
import CertificateSearchConditions from '../components/CertificateSearchConditions.vue'
import type { TimeSelectionState, QueryParams } from '../types/time-selection'

// Mock Element Plus
vi.mock('element-plus', () => ({
    ElMessage: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn()
    },
    ElCollapse: { name: 'ElCollapse' },
    ElCollapseItem: { name: 'ElCollapseItem' },
    ElCard: { name: 'ElCard' },
    ElForm: { name: 'ElForm' },
    ElFormItem: { name: 'ElFormItem' },
    ElRow: { name: 'ElRow' },
    ElCol: { name: 'ElCol' },
    ElSelect: { name: 'ElSelect' },
    ElOption: { name: 'ElOption' },
    ElInput: { name: 'ElInput' },
    ElButton: { name: 'ElButton' },
    ElSwitch: { name: 'ElSwitch' },
    ElCheckbox: { name: 'ElCheckbox' },
    ElCheckboxGroup: { name: 'ElCheckboxGroup' },
    ElRadio: { name: 'ElRadio' },
    ElRadioGroup: { name: 'ElRadioGroup' },
    ElText: { name: 'ElText' }
}))

// Mock API
vi.mock('../services/api', () => ({
    certificateQuantityApi: {
        getCompaniesList: vi.fn().mockResolvedValue({
            code: 200,
            data: [
                { code: 'C001', name: '测试企业1' },
                { code: 'C002', name: '测试企业2' }
            ]
        })
    }
}))

describe('TimeSelectionAdapter', () => {
    let wrapper: any

    beforeEach(() => {
        wrapper = mount(TimeSelectionAdapter, {
            props: {
                modelValue: {
                    timeRangeType: '',
                    timeUnit: 'year',
                    customTimeRange: null,
                    enableComparison: false
                }
            },
            global: {
                stubs: {
                    TimeSelectionComponent: {
                        template: '<div class="mock-time-selection"></div>',
                        emits: ['change', 'validation-change', 'error'],
                        methods: {
                            getQueryParams: () => ({
                                timeUnit: 'day',
                                dbTimeField: 'UPD',
                                startDate: new Date('2023-01-01'),
                                endDate: new Date('2023-12-31')
                            }),
                            validate: () => ({
                                isValid: true,
                                level: 'success',
                                message: '验证通过'
                            }),
                            reset: vi.fn()
                        }
                    }
                }
            }
        })
    })

    afterEach(() => {
        wrapper.unmount()
    })

    it('应该正确渲染适配器组件', () => {
        expect(wrapper.find('.time-selection-adapter').exists()).toBe(true)
        expect(wrapper.find('.mock-time-selection').exists()).toBe(true)
    })

    it('应该正确转换原有表单数据到新组件状态', async () => {
        const legacyData = {
            timeRangeType: 'thisYear',
            timeUnit: 'month',
            customTimeRange: null,
            enableComparison: true
        }

        await wrapper.setProps({ modelValue: legacyData })

        const timeSelectionState = wrapper.vm.timeSelectionState
        expect(timeSelectionState.quickSelection).toBe('thisYear')
        expect(timeSelectionState.timeUnit).toBe('month')
        expect(timeSelectionState.comparisonEnabled).toBe(true)
    })

    it('应该正确转换自定义时间范围', async () => {
        const customRange = [new Date('2023-01-01'), new Date('2023-12-31')]
        const legacyData = {
            timeRangeType: 'custom',
            timeUnit: 'day',
            customTimeRange: customRange,
            enableComparison: false
        }

        await wrapper.setProps({ modelValue: legacyData })

        const timeSelectionState = wrapper.vm.timeSelectionState
        expect(timeSelectionState.quickSelection).toBe('custom')
        expect(timeSelectionState.timeRange).toEqual({
            startDate: customRange[0],
            endDate: customRange[1]
        })
    })

    it('应该正确处理时间选择变化事件', async () => {
        const newState: TimeSelectionState = {
            quickSelection: 'recent6months',
            timeUnit: 'month',
            timeRange: null,
            comparisonEnabled: true,
            statisticsMode: 'monthly',
            validation: {
                isValid: true,
                level: 'success',
                message: ''
            }
        }

        wrapper.vm.handleTimeSelectionChange(newState)

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('change')).toBeTruthy()
        
        const emittedValue = wrapper.emitted('update:modelValue')[0][0]
        expect(emittedValue.timeRangeType).toBe('recent6months')
        expect(emittedValue.timeUnit).toBe('month')
        expect(emittedValue.enableComparison).toBe(true)
    })

    it('应该暴露正确的方法', () => {
        expect(typeof wrapper.vm.reset).toBe('function')
        expect(typeof wrapper.vm.getQueryParams).toBe('function')
        expect(typeof wrapper.vm.validate).toBe('function')
        expect(typeof wrapper.vm.getLegacyFormData).toBe('function')
        expect(typeof wrapper.vm.setLegacyFormData).toBe('function')
    })
})

describe('CertificateSearchConditions 集成', () => {
    let wrapper: any

    beforeEach(() => {
        wrapper = mount(CertificateSearchConditions, {
            global: {
                stubs: {
                    TimeSelectionAdapter: {
                        template: '<div class="mock-time-selection-adapter"></div>',
                        props: ['modelValue'],
                        emits: ['update:modelValue', 'change', 'query-params-change', 'validation-change', 'error']
                    },
                    ElCard: { template: '<div><slot /></div>' },
                    ElForm: { template: '<div><slot /></div>' },
                    ElFormItem: { template: '<div><slot /></div>' },
                    ElRow: { template: '<div><slot /></div>' },
                    ElCol: { template: '<div><slot /></div>' },
                    ElSelect: { template: '<div><slot /></div>' },
                    ElOption: { template: '<div></div>' },
                    ElInput: { template: '<div></div>' },
                    ElButton: { template: '<div><slot /></div>' },
                    ElSwitch: { template: '<div></div>' },
                    ElCheckbox: { template: '<div></div>' },
                    ElCheckboxGroup: { template: '<div><slot /></div>' },
                    ElRadio: { template: '<div></div>' },
                    ElRadioGroup: { template: '<div><slot /></div>' },
                    ElText: { template: '<div></div>' }
                }
            }
        })
    })

    afterEach(() => {
        wrapper.unmount()
    })

    it('应该正确渲染时间选择适配器', () => {
        expect(wrapper.find('.mock-time-selection-adapter').exists()).toBe(true)
    })

    it('应该正确处理时间选择数据变化', async () => {
        const timeSelectionData = {
            timeRangeType: 'thisYear',
            timeUnit: 'month',
            customTimeRange: null,
            enableComparison: true
        }

        wrapper.vm.handleTimeSelectionChange(timeSelectionData)

        expect(wrapper.vm.form.timeRangeType).toBe('thisYear')
        expect(wrapper.vm.form.timeUnit).toBe('month')
        expect(wrapper.vm.form.enableComparison).toBe(true)
    })

    it('应该正确处理查询参数变化', async () => {
        const queryParams: QueryParams = {
            timeUnit: 'month',
            dbTimeField: 'UPM',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            quickSelectionKey: 'thisYear',
            enableComparison: true,
            queryStrategy: 'range'
        }

        wrapper.vm.handleQueryParamsChange(queryParams)

        expect(wrapper.vm.currentQueryParams).toEqual(queryParams)
    })

    it('应该正确处理验证状态变化', async () => {
        const validationResult = {
            isValid: false,
            level: 'error',
            message: '时间范围无效'
        }

        wrapper.vm.handleTimeValidationChange(validationResult)

        expect(wrapper.vm.timeValidationResult).toEqual(validationResult)
        expect(ElMessage.error).toHaveBeenCalledWith('时间范围无效')
    })

    it('应该在添加条件时包含查询参数', async () => {
        // 设置时间选择数据
        wrapper.vm.timeSelectionData = {
            timeRangeType: 'thisYear',
            timeUnit: 'month',
            customTimeRange: null,
            enableComparison: false
        }

        // 设置查询参数
        wrapper.vm.currentQueryParams = {
            timeUnit: 'month',
            dbTimeField: 'UPM',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31')
        }

        // 添加一些基本条件
        wrapper.vm.form.selectedCompanies = [
            { code: 'C001', name: '测试企业1' }
        ]

        wrapper.vm.handleAddCondition()

        expect(wrapper.emitted('add-condition')).toBeTruthy()
        const condition = wrapper.emitted('add-condition')[0][0]
        expect(condition.timeRangeType).toBe('thisYear')
        expect(condition.queryParams).toBeDefined()
        expect(condition.queryParams.dbTimeField).toBe('UPM')
    })

    it('应该正确重置时间选择数据', async () => {
        // 设置一些数据
        wrapper.vm.timeSelectionData = {
            timeRangeType: 'thisYear',
            timeUnit: 'month',
            customTimeRange: [new Date(), new Date()],
            enableComparison: true
        }
        wrapper.vm.currentQueryParams = { timeUnit: 'month' }
        wrapper.vm.timeValidationResult = { isValid: false }

        wrapper.vm.handleReset()

        expect(wrapper.vm.timeSelectionData.timeRangeType).toBe('')
        expect(wrapper.vm.timeSelectionData.enableComparison).toBe(false)
        expect(wrapper.vm.currentQueryParams).toBeNull()
        expect(wrapper.vm.timeValidationResult).toBeNull()
    })
})

describe('数据转换测试', () => {
    it('应该正确转换历史总量查询', () => {
        const legacyData = {
            timeRangeType: 'total',
            timeUnit: 'year',
            customTimeRange: null,
            enableComparison: false
        }

        const wrapper = mount(TimeSelectionAdapter, {
            props: { modelValue: legacyData },
            global: {
                stubs: {
                    TimeSelectionComponent: { template: '<div></div>' }
                }
            }
        })

        const newState = wrapper.vm.convertLegacyToNew(legacyData)
        expect(newState.quickSelection).toBe('total')
        expect(newState.timeUnit).toBe('year')
        expect(newState.timeRange).toBeNull()
    })

    it('应该正确转换自定义时间范围查询', () => {
        const customRange = [new Date('2023-01-01'), new Date('2023-12-31')]
        const legacyData = {
            timeRangeType: 'custom',
            timeUnit: 'day',
            customTimeRange: customRange,
            enableComparison: true
        }

        const wrapper = mount(TimeSelectionAdapter, {
            props: { modelValue: legacyData },
            global: {
                stubs: {
                    TimeSelectionComponent: { template: '<div></div>' }
                }
            }
        })

        const newState = wrapper.vm.convertLegacyToNew(legacyData)
        expect(newState.quickSelection).toBe('custom')
        expect(newState.timeRange.startDate).toEqual(customRange[0])
        expect(newState.timeRange.endDate).toEqual(customRange[1])
        expect(newState.comparisonEnabled).toBe(true)
    })

    it('应该正确反向转换新状态到原有格式', () => {
        const newState = {
            quickSelection: 'recent6months',
            timeUnit: 'month',
            timeRange: null,
            comparisonEnabled: true,
            statisticsMode: 'monthly',
            validation: { isValid: true, level: 'success', message: '' }
        }

        const wrapper = mount(TimeSelectionAdapter, {
            props: { modelValue: {} },
            global: {
                stubs: {
                    TimeSelectionComponent: { template: '<div></div>' }
                }
            }
        })

        const legacyData = wrapper.vm.convertNewToLegacy(newState)
        expect(legacyData.timeRangeType).toBe('recent6months')
        expect(legacyData.timeUnit).toBe('month')
        expect(legacyData.customTimeRange).toBeNull()
        expect(legacyData.enableComparison).toBe(true)
    })
})
