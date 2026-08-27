# HarmonyOS HAP 文件编译方案

## 一、项目现状分析

当前项目是一个基于 React + TypeScript + Vite 的 Web 应用，使用 Capacitor 构建 Android APK。

### 核心依赖分析

| 依赖 | 类型 | HarmonyOS 兼容性 |
|------|------|-----------------|
| React / ReactDOM | Web 框架 | 完全兼容（Web Component） |
| React Router DOM | 路由 | 完全兼容 |
| Zustand | 状态管理 | 完全兼容 |
| Tailwind CSS | 样式 | 完全兼容 |
| xlsx | Excel 处理 | 完全兼容 |
| @capacitor/core | Capacitor 核心 | 部分兼容 |
| @capacitor/filesystem | 文件系统 API | **需要适配** |
| IndexedDB | 本地数据库 | 完全兼容 |

### 关键问题

1. **@capacitor/filesystem** 是 Android 平台专用插件，HarmonyOS 不支持
2. 需要使用 HarmonyOS 的 Web Component 能力来包装 Web 应用

---

## 二、实现方案

### 方案一：Web Component 打包（推荐）

将现有的 Web 应用打包成 HarmonyOS 的 Web Component 模块，生成 HAP 文件。

**优点：**
- 复用 95% 以上的现有代码
- 开发成本低
- 迁移风险小

**缺点：**
- 部分原生 API 需要适配

**步骤：**

1. **安装 HarmonyOS DevEco Studio**
   - 需要在系统中安装 DevEco Studio
   - 配置 HarmonyOS SDK

2. **创建 HarmonyOS 项目**
   - 使用 DevEco Studio 创建新的 HarmonyOS 应用
   - 选择 "Web Component" 模板

3. **适配文件系统 API**
   - 创建平台适配层，在 HarmonyOS 环境下使用原生 API
   - 修改 `src/utils/filesystem.ts` 添加 HarmonyOS 支持

4. **构建 Web 资源**
   ```bash
   npm run build
   ```

5. **集成到 HarmonyOS 项目**
   - 将 `dist` 目录复制到 HarmonyOS 项目的 `web` 目录
   - 配置 `module.json5`

6. **构建 HAP 文件**
   - 使用 DevEco Studio 构建 Release 版本

---

## 三、文件修改清单

### 1. src/utils/filesystem.ts

添加 HarmonyOS 平台检测和适配：

```typescript
import { Capacitor } from '@capacitor/core';

export const isHarmonyOS = (): boolean => {
  return Capacitor.getPlatform() === 'harmonyos';
};

export const saveFileToAppDir = async (
  filename: string,
  content: string | Uint8Array,
  isBinary: boolean = false
): Promise<string> => {
  if (isHarmonyOS()) {
    // HarmonyOS 原生实现（需要在 DevEco Studio 中实现）
    throw new Error('HarmonyOS 文件系统 API 需在原生层实现');
  }
  
  // 现有实现...
};
```

### 2. 新增平台适配层

创建 `src/utils/platform.ts`：

```typescript
export const getPlatform = (): 'web' | 'android' | 'harmonyos' => {
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('harmonyos')) {
      return 'harmonyos';
    }
    if (userAgent.includes('android')) {
      return 'android';
    }
  }
  return 'web';
};
```

---

## 四、环境要求

| 环境 | 版本要求 |
|------|---------|
| DevEco Studio | >= 4.0 |
| HarmonyOS SDK | >= 6.0 |
| Node.js | >= 18.x |
| Java | >= 17 |

---

## 五、风险评估

| 风险 | 等级 | 应对措施 |
|------|------|---------|
| 文件系统 API 不兼容 | 高 | 创建平台适配层 |
| 原生能力差异 | 中 | 使用 Web 标准 API 替代 |
| DevEco Studio 环境 | 中 | 需要用户安装配置 |
| HAP 签名 | 高 | 需要申请 HarmonyOS 开发者账号 |

---

## 六、注意事项

1. **需要用户配合**：需要用户安装 DevEco Studio 并配置环境
2. **签名问题**：HAP 文件需要使用 HarmonyOS 开发者证书签名
3. **API 适配**：部分 Capacitor API 在 HarmonyOS 上不可用，需要替换

---

## 七、总结

将现有项目转换为 HarmonyOS HAP 文件是可行的，推荐使用 **Web Component 打包方案**，可以最大程度复用现有代码。

**建议步骤：**
1. 先安装 DevEco Studio 和 HarmonyOS SDK
2. 创建 HarmonyOS Web Component 项目
3. 适配文件系统 API
4. 构建并测试 HAP 文件