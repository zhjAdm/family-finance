<template>
  <!-- 彩色光斑背景层 -->
  <div class="bg-blobs">
    <div class="bg-blob bg-blob--blue"></div>
    <div class="bg-blob bg-blob--purple"></div>
    <div class="bg-blob bg-blob--green"></div>
    <div class="bg-blob bg-blob--peach"></div>
  </div>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif;
  background: transparent;
  color: var(--text-regular, #4E5969);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
}

/* 全局链接 */
a {
  color: var(--color-primary, #409EFF);
  text-decoration: none;
}
a:hover {
  color: #66b1ff;
}

/* Element Plus 全局覆盖 */
:root {
  --el-color-primary: #409EFF;
  --el-color-primary-light-3: #79bbff;
  --el-color-primary-light-5: #a0cfff;
  --el-color-primary-light-7: #c6e2ff;
  --el-color-primary-light-8: #d9ecff;
  --el-color-primary-light-9: #ecf5ff;
  --el-color-success: #67C23A;
  --el-color-warning: #E6A23C;
  --el-color-danger: #F56C6C;
  --el-color-info: #909399;
  --el-border-radius-base: 8px;
  --el-border-radius-small: 6px;
  --el-font-size-base: 14px;
}

/* 弹窗 — 纯净白色 */
.el-dialog {
  border-radius: 18px !important;
  background: #fff !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: none !important;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
}
.el-dialog__header {
  padding: 22px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.el-dialog__headerbtn {
  top: 22px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background 0.15s;
}
.el-dialog__headerbtn:hover {
  background: rgba(0, 0, 0, 0.06);
}
.el-dialog__title {
  color: #1D2129;
  font-weight: 600;
}
.el-dialog__body {
  padding: 20px 24px;
}
.el-dialog__footer {
  padding: 0 24px 22px;
}
/* 弹窗内表单标签 */
.el-dialog .el-form-item__label {
  color: #3d4654;
  font-weight: 500;
}

/* 遮罩 */
.el-overlay {
  background: rgba(0, 0, 0, 0.45) !important;
}

/* 弹出确认框 */
.el-popconfirm {
  border-radius: 14px !important;
}

/* 消息提示 */
.el-message {
  border-radius: 12px;
}

/* 按钮微调 — 加 glass 质感 */
.el-button {
  border-radius: 10px;
  transition: all 0.2s ease-out;
}
.el-button:active {
  transform: scale(0.97);
}
.el-button--default {
  background: #fff !important;
  border: 1px solid #dcdfe6 !important;
}
.el-button--default:hover {
  background: #f5f7fa !important;
  border-color: #c0c4cc !important;
  color: var(--color-primary, #409EFF) !important;
}
.el-button--primary {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
}
.el-button--primary.is-link {
  box-shadow: none;
  background: transparent !important;
  border: none !important;
}

/* el-input / el-select 透明化 */
.el-input__wrapper,
.el-select .el-input__wrapper {
  background: rgba(255, 255, 255, 0.45) !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset !important;
  border-radius: 10px !important;
}
.el-input__wrapper:hover,
.el-select .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.25) inset !important;
}
.el-input__wrapper.is-focus,
.el-select .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--color-primary, #409EFF) inset !important;
}
/* 弹窗内输入框 */
.el-dialog .el-input__wrapper,
.el-dialog .el-select .el-input__wrapper,
.el-dialog .el-input-number .el-input__wrapper {
  background: #f5f7fa !important;
  box-shadow: 0 0 0 1px #e4e7ed inset !important;
  border-radius: 8px !important;
}
.el-dialog .el-input__wrapper:hover,
.el-dialog .el-select .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #c0c4cc inset !important;
}
.el-dialog .el-input__wrapper.is-focus,
.el-dialog .el-select .el-input__wrapper.is-focus {
  background: #fff !important;
  box-shadow: 0 0 0 1px var(--color-primary, #409EFF) inset !important;
}

/* el-date-picker */
.el-date-editor .el-input__wrapper {
  background: rgba(255, 255, 255, 0.45) !important;
}

/* el-switch */
.el-switch {
  --el-switch-on-color: #409EFF;
}

/* el-tag 适配 */
.el-tag {
  border-radius: 6px;
  border: none;
}

/* el-alert */
.el-alert {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* el-empty */
.el-empty__description p {
  color: #86909C;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(192, 196, 204, 0.5);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(144, 147, 153, 0.6);
}

/* ========== 移动端全局适配 ========== */
@media (max-width: 768px) {
  .el-dialog {
    width: 90% !important;
    border-radius: 14px !important;
  }
  .el-dialog__header {
    padding: 16px 16px 12px;
  }
  .el-dialog__headerbtn {
    top: 16px;
  }
  .el-dialog__body {
    padding: 16px;
  }
  .el-dialog__footer {
    padding: 0 16px 16px;
  }

  .el-message-box {
    width: 90% !important;
  }

  /* 最小触控区域 44px */
  .el-button {
    min-height: 44px;
  }
  .el-button--small {
    min-height: 36px;
  }

  /* 移动端表单：宽标签改顶部对齐 */
  .el-form[style*="label-width"] .el-form-item,
  .el-form .el-form-item {
    flex-direction: column;
    margin-bottom: 14px;
  }
  .el-form .el-form-item__label {
    text-align: left;
    padding-bottom: 4px;
    width: auto !important;
    font-size: 13px;
  }
  .el-form .el-form-item__content {
    margin-left: 0 !important;
  }

  /* 表格内链接按钮紧凑化 */
  .el-table .el-button--small,
  .el-table .el-button.is-link {
    min-height: auto;
    padding: 4px 6px;
    font-size: 12px;
  }

  /* el-table 固定列阴影 */
  .el-table__fixed-right-patch {
    background: transparent !important;
  }

  /* 移动端 popconfirm 宽度 */
  .el-popconfirm {
    max-width: 260px;
  }
}
</style>
