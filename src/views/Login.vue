<template>
    <div class="login-container">
        <div class="login-background"></div>
        <el-card class="login-card" shadow="always">
            <template #header>
                <div class="login-header">
                    <div class="login-logo">
                        <el-icon size="32" color="#409EFF">
                            <Platform />
                        </el-icon>
                    </div>
                    <h2 class="login-title">汽车企业查询系统</h2>
                    <p class="login-subtitle">Automotive Enterprise Query System</p>
                </div>
            </template>

            <el-form :model="loginForm" :rules="rules" ref="loginFormRef" @keyup.enter="handleLogin" size="large">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" clearable
                        :disabled="loading" />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock"
                        show-password clearable :disabled="loading" />
                </el-form-item>

                <el-form-item>
                    <div class="login-options">
                        <el-checkbox v-model="rememberMe" :disabled="loading">
                            记住密码
                        </el-checkbox>
                    </div>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%" size="large">
                        <span v-if="!loading">登录</span>
                        <span v-else>登录中...</span>
                    </el-button>
                </el-form-item>
            </el-form>

            <!-- 演示账号提示 -->
            <div class="demo-accounts" v-if="showDemoAccounts">
                <el-divider content-position="center">演示账号</el-divider>
                <div class="demo-account-list">
                    <el-tag v-for="account in demoAccounts" :key="account.username" @click="fillDemoAccount(account)"
                        class="demo-account-tag" :type="account.type">
                        {{ account.label }}
                    </el-tag>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Platform } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuth } from '../composables/useAuth'
import type { LoginRequest } from '../types/api'

const router = useRouter()
const { login, isLoggedIn } = useAuth()

// 响应式数据
const loading = ref(false)
const loginFormRef = ref()
const rememberMe = ref(false)
const showDemoAccounts = ref(true) // 开发环境显示演示账号

// 登录表单
const loginForm = reactive<LoginRequest>({
    username: '',
    password: ''
})

// 表单验证规则
const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 100, message: '密码长度在 6 到 100 个字符', trigger: 'blur' }
    ]
}

// 演示账号列表
const demoAccounts = ref([
    {
        username: 'admin',
        password: '123456',
        label: '管理员 (admin/123456)',
        type: 'danger'
    },
    {
        username: 'user',
        password: '123456',
        label: '普通用户 (user/123456)',
        type: 'primary'
    },
    {
        username: 'guest',
        password: '123456',
        label: '访客 (guest/123456)',
        type: 'info'
    }
])

// 登录处理
const handleLogin = async () => {
    if (!loginFormRef.value) return

    try {
        // 表单验证
        await loginFormRef.value.validate()

        loading.value = true

        // 调用登录API
        const success = await login(loginForm)

        if (success) {
            // 保存记住密码选项
            if (rememberMe.value) {
                localStorage.setItem('rememberedUsername', loginForm.username)
            } else {
                localStorage.removeItem('rememberedUsername')
            }

            // 跳转到首页
            const redirect = router.currentRoute.value.query.redirect as string
            router.push(redirect || '/')
        }
    } catch (error) {
        console.error('登录表单验证失败:', error)
        ElMessage.error('请检查输入信息')
    } finally {
        loading.value = false
    }
}

// 填充演示账号
const fillDemoAccount = (account: any) => {
    loginForm.username = account.username
    loginForm.password = account.password
    ElMessage.info(`已填充${account.label}`)
}

// 加载记住的用户名
const loadRememberedUsername = () => {
    const rememberedUsername = localStorage.getItem('rememberedUsername')
    if (rememberedUsername) {
        loginForm.username = rememberedUsername
        rememberMe.value = true
    }
}

// 组件挂载时的处理
onMounted(() => {
    // 如果已经登录，直接跳转
    if (isLoggedIn.value) {
        router.push('/')
        return
    }

    // 加载记住的用户名
    loadRememberedUsername()

    // 开发环境提示
    if (import.meta.env.DEV) {
        console.log('🚀 开发环境 - 可使用演示账号快速登录')
    }
})
</script>

<style scoped>
.login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.login-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: -1;
}

.login-background::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
}

.login-card {
    width: 420px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
    text-align: center;
    padding: 10px 0;
}

.login-logo {
    margin-bottom: 16px;
}

.login-title {
    margin: 0 0 8px 0;
    color: #303133;
    font-size: 24px;
    font-weight: 600;
}

.login-subtitle {
    margin: 0;
    color: #909399;
    font-size: 16px;
    font-weight: 400;
}

.login-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0;
}

.demo-accounts {
    margin-top: 24px;
    padding-top: 16px;
}

.demo-account-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.demo-account-tag {
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 8px 12px;
    text-align: center;
    border-radius: 6px;
}

.demo-account-tag:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 480px) {
    .login-card {
        width: 90%;
        margin: 0 20px;
    }

    .login-title {
        font-size: 22px;
    }

    .login-subtitle {
        font-size: 14px;
    }
}

/* 动画效果 */
.login-card {
    animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 表单项间距调整 */
:deep(.el-form-item) {
    margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
    margin-bottom: 0;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 按钮样式优化 */
:deep(.el-button--primary) {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}
</style>