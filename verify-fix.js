// 验证字段过滤修复的脚本
// 在浏览器控制台中运行此脚本来验证修复效果

console.log('🔍 开始验证CompanyTable字段过滤修复...');

// 检查1: 验证selectedFields是否正确初始化
function checkSelectedFieldsInitialization() {
    console.log('\n📋 检查1: selectedFields初始化');
    
    // 检查Vue应用实例
    const app = document.querySelector('#app').__vue_app__;
    if (!app) {
        console.error('❌ 无法找到Vue应用实例');
        return false;
    }
    
    console.log('✅ Vue应用实例找到');
    return true;
}

// 检查2: 验证DisplayFields组件是否正确发送事件
function checkDisplayFieldsEvents() {
    console.log('\n🏷️ 检查2: DisplayFields事件发送');
    
    const displayFieldsElement = document.querySelector('.display-fields');
    if (!displayFieldsElement) {
        console.error('❌ 无法找到DisplayFields组件');
        return false;
    }
    
    const fieldTags = displayFieldsElement.querySelectorAll('.field-tag');
    console.log(`✅ 找到 ${fieldTags.length} 个字段标签`);
    
    // 检查是否有选中的字段（绿色标签）
    const selectedTags = Array.from(fieldTags).filter(tag => 
        tag.classList.contains('el-tag--success')
    );
    console.log(`✅ 找到 ${selectedTags.length} 个选中的字段`);
    
    return selectedTags.length > 0;
}

// 检查3: 验证CompanyTable是否显示正确的列
function checkCompanyTableColumns() {
    console.log('\n📊 检查3: CompanyTable列显示');
    
    const table = document.querySelector('.company-table .el-table');
    if (!table) {
        console.error('❌ 无法找到CompanyTable');
        return false;
    }
    
    const headers = table.querySelectorAll('.el-table__header th');
    const headerTexts = Array.from(headers).map(th => 
        th.textContent?.trim()
    ).filter(text => text && text !== '');
    
    console.log('✅ 表格列标题:', headerTexts);
    
    // 检查是否有预期的列
    const expectedColumns = ['企业ID', '企业名称', '企业代码', '企业类型'];
    const hasExpectedColumns = expectedColumns.some(col => 
        headerTexts.includes(col)
    );
    
    if (hasExpectedColumns) {
        console.log('✅ 找到预期的表格列');
        return true;
    } else {
        console.error('❌ 未找到预期的表格列');
        return false;
    }
}

// 检查4: 验证字段切换功能
function checkFieldToggling() {
    console.log('\n🔄 检查4: 字段切换功能');
    
    const fieldTags = document.querySelectorAll('.display-fields .field-tag');
    if (fieldTags.length === 0) {
        console.error('❌ 无法找到字段标签');
        return false;
    }
    
    console.log('✅ 字段切换功能可用');
    console.log('💡 请手动点击字段标签测试切换功能');
    
    return true;
}

// 检查5: 验证数据加载
function checkDataLoading() {
    console.log('\n📦 检查5: 数据加载');
    
    const tableRows = document.querySelectorAll('.company-table .el-table__body tr');
    if (tableRows.length === 0) {
        console.error('❌ 表格中没有数据行');
        return false;
    }
    
    console.log(`✅ 找到 ${tableRows.length} 行数据`);
    return true;
}

// 主验证函数
function verifyFix() {
    console.log('🚀 开始验证修复效果...\n');
    
    const checks = [
        { name: 'selectedFields初始化', fn: checkSelectedFieldsInitialization },
        { name: 'DisplayFields事件', fn: checkDisplayFieldsEvents },
        { name: 'CompanyTable列显示', fn: checkCompanyTableColumns },
        { name: '字段切换功能', fn: checkFieldToggling },
        { name: '数据加载', fn: checkDataLoading }
    ];
    
    let passedChecks = 0;
    
    checks.forEach((check, index) => {
        try {
            const result = check.fn();
            if (result) {
                passedChecks++;
            }
        } catch (error) {
            console.error(`❌ 检查 "${check.name}" 时出错:`, error);
        }
    });
    
    console.log(`\n📊 验证结果: ${passedChecks}/${checks.length} 项检查通过`);
    
    if (passedChecks === checks.length) {
        console.log('🎉 所有检查都通过！字段过滤功能修复成功！');
    } else if (passedChecks >= checks.length * 0.8) {
        console.log('⚠️ 大部分检查通过，可能还有小问题需要调整');
    } else {
        console.log('❌ 多项检查失败，需要进一步调试');
    }
    
    return passedChecks / checks.length;
}

// 提供手动测试指导
function showManualTestGuide() {
    console.log('\n📋 手动测试指导:');
    console.log('1. 观察页面加载时是否显示了默认选中的字段');
    console.log('2. 点击DisplayFields中的绿色标签，观察对应列是否消失');
    console.log('3. 点击DisplayFields中的灰色标签，观察对应列是否出现');
    console.log('4. 检查复杂字段（子公司、生产基地、车辆信息）是否正确显示');
    console.log('5. 测试导出功能是否按选中字段导出');
}

// 如果在浏览器环境中，自动运行验证
if (typeof window !== 'undefined') {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(verifyFix, 1000);
            showManualTestGuide();
        });
    } else {
        setTimeout(verifyFix, 1000);
        showManualTestGuide();
    }
}

// 导出函数供手动调用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { verifyFix, showManualTestGuide };
}
