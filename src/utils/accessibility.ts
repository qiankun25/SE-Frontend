/**
 * 可访问性工具类
 * 提供键盘导航、屏幕阅读器支持等无障碍功能
 */

// ============================================================================
// 键盘导航相关
// ============================================================================

export const KEYBOARD_KEYS = {
    TAB: 'Tab',
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown'
} as const

export type KeyboardKey = typeof KEYBOARD_KEYS[keyof typeof KEYBOARD_KEYS]

/**
 * 键盘事件处理器接口
 */
export interface KeyboardHandler {
    key: KeyboardKey
    handler: (event: KeyboardEvent) => void
    preventDefault?: boolean
    stopPropagation?: boolean
}

/**
 * 创建键盘导航处理器
 */
export function createKeyboardNavigationHandler(handlers: KeyboardHandler[]) {
    return (event: KeyboardEvent) => {
        const handler = handlers.find(h => h.key === event.key)
        if (handler) {
            if (handler.preventDefault) {
                event.preventDefault()
            }
            if (handler.stopPropagation) {
                event.stopPropagation()
            }
            handler.handler(event)
        }
    }
}

/**
 * 获取可聚焦元素
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
}

/**
 * 焦点管理器
 */
export class FocusManager {
    private container: HTMLElement
    private focusableElements: HTMLElement[] = []
    private currentIndex = -1

    constructor(container: HTMLElement) {
        this.container = container
        this.updateFocusableElements()
    }

    /**
     * 更新可聚焦元素列表
     */
    updateFocusableElements(): void {
        this.focusableElements = getFocusableElements(this.container)
        this.currentIndex = this.focusableElements.findIndex(el => el === document.activeElement)
    }

    /**
     * 聚焦到下一个元素
     */
    focusNext(): boolean {
        this.updateFocusableElements()
        if (this.focusableElements.length === 0) return false

        this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length
        this.focusableElements[this.currentIndex].focus()
        return true
    }

    /**
     * 聚焦到上一个元素
     */
    focusPrevious(): boolean {
        this.updateFocusableElements()
        if (this.focusableElements.length === 0) return false

        this.currentIndex = this.currentIndex <= 0 
            ? this.focusableElements.length - 1 
            : this.currentIndex - 1
        this.focusableElements[this.currentIndex].focus()
        return true
    }

    /**
     * 聚焦到第一个元素
     */
    focusFirst(): boolean {
        this.updateFocusableElements()
        if (this.focusableElements.length === 0) return false

        this.currentIndex = 0
        this.focusableElements[this.currentIndex].focus()
        return true
    }

    /**
     * 聚焦到最后一个元素
     */
    focusLast(): boolean {
        this.updateFocusableElements()
        if (this.focusableElements.length === 0) return false

        this.currentIndex = this.focusableElements.length - 1
        this.focusableElements[this.currentIndex].focus()
        return true
    }

    /**
     * 获取当前聚焦的元素
     */
    getCurrentElement(): HTMLElement | null {
        return this.currentIndex >= 0 ? this.focusableElements[this.currentIndex] : null
    }
}

// ============================================================================
// ARIA 标签和语义化支持
// ============================================================================

/**
 * ARIA 角色定义
 */
export const ARIA_ROLES = {
    BUTTON: 'button',
    LISTBOX: 'listbox',
    OPTION: 'option',
    COMBOBOX: 'combobox',
    DIALOG: 'dialog',
    ALERT: 'alert',
    STATUS: 'status',
    PROGRESSBAR: 'progressbar',
    TAB: 'tab',
    TABPANEL: 'tabpanel',
    TABLIST: 'tablist',
    GRID: 'grid',
    GRIDCELL: 'gridcell',
    ROW: 'row'
} as const

/**
 * ARIA 属性设置器
 */
export class AriaManager {
    private element: HTMLElement

    constructor(element: HTMLElement) {
        this.element = element
    }

    /**
     * 设置角色
     */
    setRole(role: string): this {
        this.element.setAttribute('role', role)
        return this
    }

    /**
     * 设置标签
     */
    setLabel(label: string): this {
        this.element.setAttribute('aria-label', label)
        return this
    }

    /**
     * 设置标签引用
     */
    setLabelledBy(id: string): this {
        this.element.setAttribute('aria-labelledby', id)
        return this
    }

    /**
     * 设置描述引用
     */
    setDescribedBy(id: string): this {
        this.element.setAttribute('aria-describedby', id)
        return this
    }

    /**
     * 设置展开状态
     */
    setExpanded(expanded: boolean): this {
        this.element.setAttribute('aria-expanded', expanded.toString())
        return this
    }

    /**
     * 设置选中状态
     */
    setSelected(selected: boolean): this {
        this.element.setAttribute('aria-selected', selected.toString())
        return this
    }

    /**
     * 设置禁用状态
     */
    setDisabled(disabled: boolean): this {
        this.element.setAttribute('aria-disabled', disabled.toString())
        return this
    }

    /**
     * 设置隐藏状态
     */
    setHidden(hidden: boolean): this {
        this.element.setAttribute('aria-hidden', hidden.toString())
        return this
    }

    /**
     * 设置实时区域
     */
    setLive(live: 'off' | 'polite' | 'assertive'): this {
        this.element.setAttribute('aria-live', live)
        return this
    }

    /**
     * 设置当前值
     */
    setValueNow(value: number): this {
        this.element.setAttribute('aria-valuenow', value.toString())
        return this
    }

    /**
     * 设置最小值
     */
    setValueMin(min: number): this {
        this.element.setAttribute('aria-valuemin', min.toString())
        return this
    }

    /**
     * 设置最大值
     */
    setValueMax(max: number): this {
        this.element.setAttribute('aria-valuemax', max.toString())
        return this
    }

    /**
     * 设置值文本
     */
    setValueText(text: string): this {
        this.element.setAttribute('aria-valuetext', text)
        return this
    }
}

/**
 * 创建 ARIA 管理器
 */
export function createAriaManager(element: HTMLElement): AriaManager {
    return new AriaManager(element)
}

// ============================================================================
// 屏幕阅读器支持
// ============================================================================

/**
 * 屏幕阅读器公告
 */
export class ScreenReaderAnnouncer {
    private liveRegion: HTMLElement

    constructor() {
        this.liveRegion = this.createLiveRegion()
    }

    /**
     * 创建实时区域
     */
    private createLiveRegion(): HTMLElement {
        const region = document.createElement('div')
        region.setAttribute('aria-live', 'polite')
        region.setAttribute('aria-atomic', 'true')
        region.style.position = 'absolute'
        region.style.left = '-10000px'
        region.style.width = '1px'
        region.style.height = '1px'
        region.style.overflow = 'hidden'
        document.body.appendChild(region)
        return region
    }

    /**
     * 公告消息
     */
    announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
        this.liveRegion.setAttribute('aria-live', priority)
        this.liveRegion.textContent = message

        // 清空内容以便下次公告
        setTimeout(() => {
            this.liveRegion.textContent = ''
        }, 1000)
    }

    /**
     * 销毁实时区域
     */
    destroy(): void {
        if (this.liveRegion.parentNode) {
            this.liveRegion.parentNode.removeChild(this.liveRegion)
        }
    }
}

// 全局屏幕阅读器公告器实例
let globalAnnouncer: ScreenReaderAnnouncer | null = null

/**
 * 获取全局屏幕阅读器公告器
 */
export function getScreenReaderAnnouncer(): ScreenReaderAnnouncer {
    if (!globalAnnouncer) {
        globalAnnouncer = new ScreenReaderAnnouncer()
    }
    return globalAnnouncer
}

/**
 * 公告消息的便捷函数
 */
export function announceToScreenReader(
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
): void {
    getScreenReaderAnnouncer().announce(message, priority)
}

// ============================================================================
// 高对比度和主题支持
// ============================================================================

/**
 * 检测高对比度模式
 */
export function isHighContrastMode(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * 检测减少动画偏好
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 检测深色主题偏好
 */
export function prefersDarkTheme(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 主题管理器
 */
export class ThemeManager {
    private listeners: Array<(theme: string) => void> = []

    constructor() {
        this.setupMediaQueryListeners()
    }

    /**
     * 设置媒体查询监听器
     */
    private setupMediaQueryListeners(): void {
        const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)')

        darkThemeQuery.addEventListener('change', () => {
            this.notifyThemeChange()
        })

        highContrastQuery.addEventListener('change', () => {
            this.notifyThemeChange()
        })
    }

    /**
     * 获取当前主题
     */
    getCurrentTheme(): string {
        if (isHighContrastMode()) {
            return 'high-contrast'
        }
        if (prefersDarkTheme()) {
            return 'dark'
        }
        return 'light'
    }

    /**
     * 添加主题变化监听器
     */
    addThemeChangeListener(listener: (theme: string) => void): void {
        this.listeners.push(listener)
    }

    /**
     * 移除主题变化监听器
     */
    removeThemeChangeListener(listener: (theme: string) => void): void {
        const index = this.listeners.indexOf(listener)
        if (index > -1) {
            this.listeners.splice(index, 1)
        }
    }

    /**
     * 通知主题变化
     */
    private notifyThemeChange(): void {
        const currentTheme = this.getCurrentTheme()
        this.listeners.forEach(listener => listener(currentTheme))
    }
}

// 全局主题管理器实例
let globalThemeManager: ThemeManager | null = null

/**
 * 获取全局主题管理器
 */
export function getThemeManager(): ThemeManager {
    if (!globalThemeManager) {
        globalThemeManager = new ThemeManager()
    }
    return globalThemeManager
}

// ============================================================================
// Vue 3 组合式函数
// ============================================================================

import { ref, onMounted, onUnmounted, Ref } from 'vue'

/**
 * 键盘导航组合式函数
 */
export function useKeyboardNavigation(
    containerRef: Ref<HTMLElement | null>,
    handlers?: KeyboardHandler[]
) {
    const focusManager = ref<FocusManager | null>(null)

    const setupKeyboardNavigation = () => {
        if (!containerRef.value) return

        focusManager.value = new FocusManager(containerRef.value)

        const defaultHandlers: KeyboardHandler[] = [
            {
                key: KEYBOARD_KEYS.TAB,
                handler: (event) => {
                    if (event.shiftKey) {
                        focusManager.value?.focusPrevious()
                    } else {
                        focusManager.value?.focusNext()
                    }
                },
                preventDefault: true
            },
            {
                key: KEYBOARD_KEYS.ARROW_DOWN,
                handler: () => focusManager.value?.focusNext(),
                preventDefault: true
            },
            {
                key: KEYBOARD_KEYS.ARROW_UP,
                handler: () => focusManager.value?.focusPrevious(),
                preventDefault: true
            },
            {
                key: KEYBOARD_KEYS.HOME,
                handler: () => focusManager.value?.focusFirst(),
                preventDefault: true
            },
            {
                key: KEYBOARD_KEYS.END,
                handler: () => focusManager.value?.focusLast(),
                preventDefault: true
            }
        ]

        const allHandlers = [...defaultHandlers, ...(handlers || [])]
        const keyboardHandler = createKeyboardNavigationHandler(allHandlers)

        containerRef.value.addEventListener('keydown', keyboardHandler)

        return () => {
            containerRef.value?.removeEventListener('keydown', keyboardHandler)
        }
    }

    onMounted(() => {
        setupKeyboardNavigation()
    })

    return {
        focusManager,
        setupKeyboardNavigation
    }
}

/**
 * 屏幕阅读器支持组合式函数
 */
export function useScreenReader() {
    const announcer = getScreenReaderAnnouncer()

    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        announcer.announce(message, priority)
    }

    return {
        announce
    }
}

/**
 * 主题管理组合式函数
 */
export function useTheme() {
    const themeManager = getThemeManager()
    const currentTheme = ref(themeManager.getCurrentTheme())

    const handleThemeChange = (theme: string) => {
        currentTheme.value = theme
    }

    onMounted(() => {
        themeManager.addThemeChangeListener(handleThemeChange)
    })

    onUnmounted(() => {
        themeManager.removeThemeChangeListener(handleThemeChange)
    })

    return {
        currentTheme,
        isHighContrast: ref(isHighContrastMode()),
        prefersReducedMotion: ref(prefersReducedMotion()),
        prefersDarkTheme: ref(prefersDarkTheme())
    }
}

/**
 * ARIA 管理组合式函数
 */
export function useAria(elementRef: Ref<HTMLElement | null>) {
    const ariaManager = ref<AriaManager | null>(null)

    onMounted(() => {
        if (elementRef.value) {
            ariaManager.value = createAriaManager(elementRef.value)
        }
    })

    return {
        ariaManager
    }
}
