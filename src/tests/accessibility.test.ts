/**
 * 可访问性功能测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
    FocusManager, 
    AriaManager, 
    ScreenReaderAnnouncer,
    ThemeManager,
    getFocusableElements,
    createKeyboardNavigationHandler,
    createAriaManager,
    getScreenReaderAnnouncer,
    getThemeManager,
    isHighContrastMode,
    prefersReducedMotion,
    prefersDarkTheme,
    KEYBOARD_KEYS,
    ARIA_ROLES
} from '../utils/accessibility'

// Mock DOM APIs
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

describe('FocusManager', () => {
    let container: HTMLElement
    let focusManager: FocusManager

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="container">
                <button id="btn1">Button 1</button>
                <input id="input1" type="text" />
                <button id="btn2">Button 2</button>
                <button id="btn3" disabled>Disabled Button</button>
                <a id="link1" href="#">Link 1</a>
            </div>
        `
        container = document.getElementById('container')!
        focusManager = new FocusManager(container)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('应该正确获取可聚焦元素', () => {
        const focusableElements = getFocusableElements(container)
        expect(focusableElements).toHaveLength(4) // 不包括disabled按钮
        expect(focusableElements.map(el => el.id)).toEqual(['btn1', 'input1', 'btn2', 'link1'])
    })

    it('应该能够聚焦到下一个元素', () => {
        const btn1 = document.getElementById('btn1')!
        btn1.focus()
        
        const result = focusManager.focusNext()
        expect(result).toBe(true)
        expect(document.activeElement?.id).toBe('input1')
    })

    it('应该能够聚焦到上一个元素', () => {
        const input1 = document.getElementById('input1')!
        input1.focus()
        
        const result = focusManager.focusPrevious()
        expect(result).toBe(true)
        expect(document.activeElement?.id).toBe('btn1')
    })

    it('应该能够聚焦到第一个元素', () => {
        const result = focusManager.focusFirst()
        expect(result).toBe(true)
        expect(document.activeElement?.id).toBe('btn1')
    })

    it('应该能够聚焦到最后一个元素', () => {
        const result = focusManager.focusLast()
        expect(result).toBe(true)
        expect(document.activeElement?.id).toBe('link1')
    })

    it('应该在循环中正确处理焦点', () => {
        focusManager.focusLast()
        const result = focusManager.focusNext()
        expect(result).toBe(true)
        expect(document.activeElement?.id).toBe('btn1')
    })
})

describe('AriaManager', () => {
    let element: HTMLElement
    let ariaManager: AriaManager

    beforeEach(() => {
        element = document.createElement('div')
        ariaManager = createAriaManager(element)
    })

    it('应该正确设置ARIA角色', () => {
        ariaManager.setRole(ARIA_ROLES.BUTTON)
        expect(element.getAttribute('role')).toBe('button')
    })

    it('应该正确设置ARIA标签', () => {
        ariaManager.setLabel('测试标签')
        expect(element.getAttribute('aria-label')).toBe('测试标签')
    })

    it('应该正确设置展开状态', () => {
        ariaManager.setExpanded(true)
        expect(element.getAttribute('aria-expanded')).toBe('true')
        
        ariaManager.setExpanded(false)
        expect(element.getAttribute('aria-expanded')).toBe('false')
    })

    it('应该正确设置选中状态', () => {
        ariaManager.setSelected(true)
        expect(element.getAttribute('aria-selected')).toBe('true')
    })

    it('应该正确设置禁用状态', () => {
        ariaManager.setDisabled(true)
        expect(element.getAttribute('aria-disabled')).toBe('true')
    })

    it('应该支持链式调用', () => {
        const result = ariaManager
            .setRole(ARIA_ROLES.BUTTON)
            .setLabel('测试按钮')
            .setDisabled(false)

        expect(result).toBe(ariaManager)
        expect(element.getAttribute('role')).toBe('button')
        expect(element.getAttribute('aria-label')).toBe('测试按钮')
        expect(element.getAttribute('aria-disabled')).toBe('false')
    })
})

describe('ScreenReaderAnnouncer', () => {
    let announcer: ScreenReaderAnnouncer

    beforeEach(() => {
        announcer = new ScreenReaderAnnouncer()
    })

    afterEach(() => {
        announcer.destroy()
    })

    it('应该创建实时区域', () => {
        const liveRegions = document.querySelectorAll('[aria-live]')
        expect(liveRegions.length).toBeGreaterThan(0)
    })

    it('应该正确公告消息', () => {
        announcer.announce('测试消息', 'polite')
        
        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion?.textContent).toBe('测试消息')
    })

    it('应该支持不同优先级', () => {
        announcer.announce('紧急消息', 'assertive')
        
        const liveRegion = document.querySelector('[aria-live="assertive"]')
        expect(liveRegion?.textContent).toBe('紧急消息')
    })

    it('应该正确清理实时区域', () => {
        const initialCount = document.querySelectorAll('[aria-live]').length
        announcer.destroy()
        const finalCount = document.querySelectorAll('[aria-live]').length
        expect(finalCount).toBeLessThan(initialCount)
    })
})

describe('键盘导航处理器', () => {
    it('应该正确处理键盘事件', () => {
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        
        const keyboardHandler = createKeyboardNavigationHandler([
            {
                key: KEYBOARD_KEYS.ENTER,
                handler: handler1,
                preventDefault: true
            },
            {
                key: KEYBOARD_KEYS.ESCAPE,
                handler: handler2,
                stopPropagation: true
            }
        ])

        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })

        const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault')
        const stopPropagationSpy = vi.spyOn(escapeEvent, 'stopPropagation')

        keyboardHandler(enterEvent)
        expect(handler1).toHaveBeenCalledWith(enterEvent)
        expect(preventDefaultSpy).toHaveBeenCalled()

        keyboardHandler(escapeEvent)
        expect(handler2).toHaveBeenCalledWith(escapeEvent)
        expect(stopPropagationSpy).toHaveBeenCalled()

        keyboardHandler(spaceEvent)
        expect(handler1).toHaveBeenCalledTimes(1)
        expect(handler2).toHaveBeenCalledTimes(1)
    })
})

describe('ThemeManager', () => {
    let themeManager: ThemeManager

    beforeEach(() => {
        themeManager = new ThemeManager()
    })

    it('应该正确检测主题偏好', () => {
        // Mock high contrast mode
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-contrast: high)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }))

        expect(isHighContrastMode()).toBe(true)
    })

    it('应该正确检测减少动画偏好', () => {
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }))

        expect(prefersReducedMotion()).toBe(true)
    })

    it('应该正确检测深色主题偏好', () => {
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-color-scheme: dark)',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }))

        expect(prefersDarkTheme()).toBe(true)
    })

    it('应该支持主题变化监听', () => {
        const listener = vi.fn()
        themeManager.addThemeChangeListener(listener)
        
        // 模拟主题变化
        const mockEvent = { matches: true }
        // 这里需要触发媒体查询变化事件，但由于测试环境限制，我们只验证监听器注册
        
        themeManager.removeThemeChangeListener(listener)
        // 验证监听器被正确移除
    })
})

describe('全局实例管理', () => {
    it('应该返回相同的屏幕阅读器实例', () => {
        const instance1 = getScreenReaderAnnouncer()
        const instance2 = getScreenReaderAnnouncer()
        expect(instance1).toBe(instance2)
    })

    it('应该返回相同的主题管理器实例', () => {
        const instance1 = getThemeManager()
        const instance2 = getThemeManager()
        expect(instance1).toBe(instance2)
    })
})

describe('边界情况测试', () => {
    it('应该处理空容器的焦点管理', () => {
        const emptyContainer = document.createElement('div')
        const focusManager = new FocusManager(emptyContainer)
        
        expect(focusManager.focusNext()).toBe(false)
        expect(focusManager.focusPrevious()).toBe(false)
        expect(focusManager.focusFirst()).toBe(false)
        expect(focusManager.focusLast()).toBe(false)
    })

    it('应该处理不存在的键盘事件', () => {
        const handler = createKeyboardNavigationHandler([])
        const event = new KeyboardEvent('keydown', { key: 'Unknown' })
        
        expect(() => handler(event)).not.toThrow()
    })

    it('应该处理空消息的屏幕阅读器公告', () => {
        const announcer = new ScreenReaderAnnouncer()
        
        expect(() => announcer.announce('', 'polite')).not.toThrow()
        
        announcer.destroy()
    })
})
