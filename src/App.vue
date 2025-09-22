<script lang="ts" setup>
// 应用入口组件
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  background-color: #f5f7fa;
}

/* Element Plus 样式覆盖 */
.el-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.el-card__header {
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

.el-table {
  font-size: 16px;
}

.el-table th {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

.el-button {
  border-radius: 4px;
}

.el-input__wrapper {
  border-radius: 4px;
}

.el-select .el-input__wrapper {
  border-radius: 4px;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .el-table {
    font-size: 14px;
  }

  .el-card__body {
    padding: 15px;
  }
}
</style>
