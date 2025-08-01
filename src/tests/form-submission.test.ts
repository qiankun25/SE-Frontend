/**
 * 表单提交行为测试
 * 验证按钮不会意外触发表单提交
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import QuickSelectionPanel from '../components/QuickSelectionPanel.vue'
import YearRangePicker from '../components/YearRangePicker.vue'
import MonthRangePicker from '../components/MonthRangePicker.vue'
import ValidationStatus from '../components/ValidationStatus.vue'

// Mock Element Plus
vi.mock('element-plus', () => ({
    ElIcon: { name: 'ElIcon' }
}))

describe('表单提交行为测试', () => {
    describe('QuickSelectionPanel', () => {
        let wrapper: any
        let formSubmitSpy: any

        beforeEach(() => {
            // 创建一个包含表单的容器
            document.body.innerHTML = `
                <form id="test-form">
                    <div id="component-container"></div>
                </form>
            `

            // 监听表单提交事件
            formSubmitSpy = vi.fn()
            const form = document.getElementById('test-form')!
            form.addEventListener('submit', formSubmitSpy)

            wrapper = mount(QuickSelectionPanel, {
                props: {
                    selectedOption: '',
                    quickOptions: [
                        { key: 'total', label: '历史总量', description: '查询所有历史数据' },
                        { key: 'thisYear', label: '今年', description: '查询当前年份的数据' }
                    ],
                    showCustomOption: true
                },
                attachTo: '#component-container',
                global: {
                    stubs: {
                        ElIcon: { template: '<span><slot /></span>' }
                    }
                }
            })
        })

        afterEach(() => {
            wrapper.unmount()
            document.body.innerHTML = ''
        })

        it('快捷选择按钮应该有正确的type属性', () => {
            const buttons = wrapper.findAll('button')
            buttons.forEach((button: any) => {
                expect(button.attributes('type')).toBe('button')
            })
        })

        it('点击快捷选择按钮不应该触发表单提交', async () => {
            const button = wrapper.find('button')
            await button.trigger('click')
            
            expect(formSubmitSpy).not.toHaveBeenCalled()
        })

        it('在快捷选择按钮上按回车键不应该触发表单提交', async () => {
            const button = wrapper.find('button')
            button.element.focus()
            
            await button.trigger('keydown', { key: 'Enter' })
            
            expect(formSubmitSpy).not.toHaveBeenCalled()
        })
    })

    describe('YearRangePicker', () => {
        let wrapper: any
        let formSubmitSpy: any

        beforeEach(() => {
            document.body.innerHTML = `
                <form id="test-form">
                    <div id="component-container"></div>
                </form>
            `

            formSubmitSpy = vi.fn()
            const form = document.getElementById('test-form')!
            form.addEventListener('submit', formSubmitSpy)

            wrapper = mount(YearRangePicker, {
                props: {
                    modelValue: { startYear: 2023, endYear: 2023 },
                    showQuickRange: true
                },
                attachTo: '#component-container'
            })
        })

        afterEach(() => {
            wrapper.unmount()
            document.body.innerHTML = ''
        })

        it('年份快速选择按钮应该有正确的type属性', () => {
            const buttons = wrapper.findAll('button')
            buttons.forEach((button: any) => {
                expect(button.attributes('type')).toBe('button')
            })
        })

        it('点击年份快速选择按钮不应该触发表单提交', async () => {
            const buttons = wrapper.findAll('button')
            if (buttons.length > 0) {
                await buttons[0].trigger('click')
                expect(formSubmitSpy).not.toHaveBeenCalled()
            }
        })
    })

    describe('MonthRangePicker', () => {
        let wrapper: any
        let formSubmitSpy: any

        beforeEach(() => {
            document.body.innerHTML = `
                <form id="test-form">
                    <div id="component-container"></div>
                </form>
            `

            formSubmitSpy = vi.fn()
            const form = document.getElementById('test-form')!
            form.addEventListener('submit', formSubmitSpy)

            wrapper = mount(MonthRangePicker, {
                props: {
                    modelValue: { 
                        startYear: 2023, 
                        startMonth: 1, 
                        endYear: 2023, 
                        endMonth: 12 
                    },
                    showQuickJump: true
                },
                attachTo: '#component-container'
            })
        })

        afterEach(() => {
            wrapper.unmount()
            document.body.innerHTML = ''
        })

        it('月份快捷跳转按钮应该有正确的type属性', () => {
            const buttons = wrapper.findAll('button')
            buttons.forEach((button: any) => {
                expect(button.attributes('type')).toBe('button')
            })
        })

        it('点击月份快捷跳转按钮不应该触发表单提交', async () => {
            const buttons = wrapper.findAll('button')
            if (buttons.length > 0) {
                await buttons[0].trigger('click')
                expect(formSubmitSpy).not.toHaveBeenCalled()
            }
        })
    })

    describe('ValidationStatus', () => {
        let wrapper: any
        let formSubmitSpy: any

        beforeEach(() => {
            document.body.innerHTML = `
                <form id="test-form">
                    <div id="component-container"></div>
                </form>
            `

            formSubmitSpy = vi.fn()
            const form = document.getElementById('test-form')!
            form.addEventListener('submit', formSubmitSpy)

            wrapper = mount(ValidationStatus, {
                props: {
                    level: 'warning',
                    message: '测试警告',
                    showActions: true,
                    showContinue: true,
                    showReselect: true
                },
                attachTo: '#component-container'
            })
        })

        afterEach(() => {
            wrapper.unmount()
            document.body.innerHTML = ''
        })

        it('验证状态操作按钮应该有正确的type属性', () => {
            const buttons = wrapper.findAll('button')
            buttons.forEach((button: any) => {
                expect(button.attributes('type')).toBe('button')
            })
        })

        it('点击验证状态操作按钮不应该触发表单提交', async () => {
            const buttons = wrapper.findAll('button')
            if (buttons.length > 0) {
                await buttons[0].trigger('click')
                expect(formSubmitSpy).not.toHaveBeenCalled()
            }
        })
    })

    describe('表单内输入框回车键测试', () => {
        let wrapper: any
        let formSubmitSpy: any

        beforeEach(() => {
            document.body.innerHTML = `
                <form id="test-form">
                    <input type="text" id="test-input" />
                    <div id="component-container"></div>
                </form>
            `

            formSubmitSpy = vi.fn()
            const form = document.getElementById('test-form')!
            form.addEventListener('submit', formSubmitSpy)

            wrapper = mount(QuickSelectionPanel, {
                props: {
                    selectedOption: '',
                    quickOptions: [
                        { key: 'total', label: '历史总量', description: '查询所有历史数据' }
                    ]
                },
                attachTo: '#component-container',
                global: {
                    stubs: {
                        ElIcon: { template: '<span><slot /></span>' }
                    }
                }
            })
        })

        afterEach(() => {
            wrapper.unmount()
            document.body.innerHTML = ''
        })

        it('在输入框中按回车键不应该触发表单提交（当所有按钮都有正确的type属性时）', async () => {
            const input = document.getElementById('test-input') as HTMLInputElement
            input.focus()
            
            // 模拟在输入框中按回车键
            const enterEvent = new KeyboardEvent('keydown', { 
                key: 'Enter', 
                bubbles: true, 
                cancelable: true 
            })
            input.dispatchEvent(enterEvent)
            
            // 等待事件处理
            await new Promise(resolve => setTimeout(resolve, 0))
            
            expect(formSubmitSpy).not.toHaveBeenCalled()
        })
    })

    describe('HTML按钮type属性验证', () => {
        it('应该验证所有按钮都有明确的type属性', () => {
            const buttonElements = [
                '<button type="button">正确的按钮</button>',
                '<button>错误的按钮</button>' // 这种会导致问题
            ]

            buttonElements.forEach((html, index) => {
                const div = document.createElement('div')
                div.innerHTML = html
                const button = div.querySelector('button')!
                
                if (index === 0) {
                    expect(button.type).toBe('button')
                } else {
                    // 默认type是submit，这会导致表单提交
                    expect(button.type).toBe('submit')
                }
            })
        })
    })
})
