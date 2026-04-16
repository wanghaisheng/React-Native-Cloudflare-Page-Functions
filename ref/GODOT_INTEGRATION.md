# Godot 集成指南

本文档说明如何将 Godot 引擎集成到 React Native Expo 项目中。涵盖了不同的项目结构适配、常见问题解决方案和最佳实践。

## 项目结构适配

### 方案 1：标准项目（代码在 src 目录下）

适用于大多数 React Native 项目，应用代码在 `src/` 目录下：

```
项目根目录/
├── app.config.ts              # Expo 配置文件（根目录）
├── app.plugin.cjs             # Expo 插件配置
├── package.json               # 项目依赖和脚本
├── plugin/                    # 自定义 Expo 插件
│   ├── src/
│   │   ├── index.js           # 插件入口（CommonJS）
│   │   ├── withPckFile.js     # iOS 文件处理
│   │   └── withGodotFiles.js  # Android 文件处理
│   └── tsconfig.json
├── assets/                    # Godot 资源文件（根目录）
│   └── godot/
│       ├── main.pck            # iOS 游戏包
│       └── godot-files/        # Android 游戏文件
│           └── main/
└── src/                       # 应用代码
    ├── app/
    │   └── (logged)/
    │       └── godot-game.tsx
    ├── components/
    ├── features/
    └── types/
        └── react-native-godot.d.ts
```

### 方案 2：Monorepo 项目（代码在 apps 目录下）

适用于 Turborepo、Nx 等 monorepo 工具管理的项目：

```
项目根目录/
├── app.config.ts              # Expo 配置文件（根目录）
├── app.plugin.cjs             # Expo 插件配置
├── package.json               # 根 package.json
├── plugin/                    # 自定义 Expo 插件
│   ├── src/
│   │   ├── index.js
│   │   ├── withPckFile.js
│   │   └── withGodotFiles.js
│   └── tsconfig.json
├── assets/                    # Godot 资源文件（根目录）
│   └── godot/
└── apps/
    └── mobile/               # 移动应用
        ├── app.config.ts      # 应用特定配置
        ├── package.json
        └── src/               # 应用代码
            ├── app/
            ├── components/
            └── types/
```

**关键差异**：
- Monorepo 中 `app.config.ts` 可能在 `apps/mobile/` 目录下
- 插件配置通常在根目录的 `app.plugin.cjs`
- 资源文件路径需要根据实际情况调整

## 已完成的配置

### 1. 依赖安装
- ✅ `@borndotcom/react-native-godot@^1.0.1`
- ✅ `expo-build-properties@~1.0.9`
- ✅ `expo-file-system@55.0.16`
- ✅ `patch-package@8.0.1`

### 2. 自定义 Expo 插件（已启用）
- ✅ `plugin/src/index.js` - 插件入口（CommonJS 格式）
- ✅ `plugin/src/withPckFile.js` - iOS 文件处理
- ✅ `plugin/src/withGodotFiles.js` - Android 文件处理
- ✅ `app.plugin.cjs` - 插件配置
- ✅ 插件自动构建脚本（`scripts/build-plugin.cjs`）

**关键修复**：将插件源代码从 TypeScript 改为 CommonJS 格式，解决模块系统冲突

### 3. 应用配置
- ✅ `app.config.ts` Godot 插件配置已启用
- ✅ Android build properties 配置已启用（minSdkVersion: 29, Maven 仓库）

### 4. Godot 资源文件
- ✅ `assets/godot/main.pck` - iOS 游戏包
- ✅ `assets/godot/godot-files/main/` - Android 游戏文件

### 5. 游戏页面
- ✅ `src/app/(logged)/godot-game.tsx` - Godot 游戏页面
- ✅ 包含触摸控制按钮
- ✅ 使用 worklet 机制进行线程安全的 API 调用

### 6. TypeScript 类型声明
- ✅ `src/types/react-native-godot.d.ts` - Godot 模块类型声明

## 如何使用

### 自动配置（推荐）

由于插件已启用，Godot 资源文件会在 prebuild 时自动复制：

#### iOS
```bash
npx expo prebuild --platform ios --clean
pnpm ios
```

插件会自动：
- 将 `assets/godot/main.pck` 复制到 `ios/main.pck`
- 将 `main.pck` 添加到 Xcode 项目资源

#### Android
```bash
npx expo prebuild --platform android --clean
pnpm android
```

插件会自动：
- 将 `assets/godot/godot-files/main/` 递归复制到 `android/app/src/main/assets/main/`
- 配置 `minSdkVersion: 29`
- 添加 Godot Maven 仓库

### 访问游戏页面

在应用中导航到 `/godot-game` 路径即可访问 Godot 游戏。

### 控制说明

游戏页面包含三个控制按钮：
- **←** - 向左移动 (ui_left)
- **跳** - 跳跃 (ui_accept)
- **→** - 向右移动 (ui_right)

### 构建和运行

#### iOS
```bash
npx expo prebuild --platform ios --clean
pnpm ios
```

#### Android
```bash
npx expo prebuild --platform android --clean
pnpm android
```

## 技术要点

### 线程安全
所有 Godot API 调用都在 `runOnGodotThread` 中执行，确保线程安全：

```typescript
runOnGodotThread(() => {
  'worklet'; // 必须标记
  const Godot = RTNGodot.API();
  const Input = Godot.Input;
  Input.action_press(action);
});
```

### 平台差异
- **iOS**: 使用 `--main-pack` 参数指向 `.pck` 文件
- **Android**: 使用 `--path` 参数指向游戏文件目录

### 插件机制（已启用）
自定义 Expo 插件在 prebuild 时自动：
- iOS: 从 `assets/godot/main.pck` 复制到 iOS 项目并添加到 Xcode 资源
- Android: 从 `assets/godot/godot-files/main/` 递归复制到 `android/app/src/main/assets/main/`

**当前状态**: 插件已启用，自动复制资源文件

## 注意事项

### 文件位置说明
- **根目录文件**: `app.config.ts` 和 `app.plugin.cjs` 必须在项目根目录，这是 Expo 的标准配置
- **plugin 目录**: 自定义 Expo 插件在根目录的 `plugin/` 目录
- **assets 目录**: Godot 资源文件在根目录的 `assets/` 目录
- **src 目录**: 应用代码在 `src/` 目录下

### 已知问题与解决方案

#### 1. 模块系统冲突（已解决）

**问题描述**：
- 项目使用 `"type": "module"` (ES modules)
- Expo 插件系统期望 CommonJS 格式
- 导致插件加载失败：`require is not defined in ES module scope`

**错误信息**：
```
PluginError: Unable to resolve a valid config plugin for ./app.plugin.cjs.
require is not defined in ES module scope, you can use import instead
```

**解决方案**：
1. 将插件源代码从 TypeScript 改为 CommonJS 格式：
   - 将 `.ts` 文件改为 `.js` 文件
   - 将 `import/export` 改为 `require/module.exports`
   - 示例：
   ```javascript
   // 之前 (TypeScript ES modules)
   import { ConfigPlugin } from 'expo/config-plugins';
   export default withPlugin;

   // 之后 (CommonJS)
   const { ConfigPlugin } = require('expo/config-plugins');
   module.exports = withPlugin;
   ```

2. 创建自定义构建脚本替代 TypeScript 编译：
   ```javascript
   // scripts/build-plugin.cjs
   const fs = require('fs');
   const path = require('path');

   const sourceDir = path.join(__dirname, '../plugin/src');
   const buildDir = path.join(__dirname, '../plugin/build');

   // 复制 .js 文件并重命名为 .cjs
   const files = [
     { src: 'index.js', dest: 'index.cjs' },
     { src: 'withGodotFiles.js', dest: 'withGodotFiles.cjs' },
     { src: 'withPckFile.js', dest: 'withPckFile.cjs' }
   ];

   for (const { src, dest } of files) {
     fs.copyFileSync(
       path.join(sourceDir, src),
       path.join(buildDir, dest)
     );
   }
   ```

3. 更新 `package.json` 构建脚本：
   ```json
   {
     "scripts": {
       "build:plugin": "node scripts/build-plugin.cjs",
       "postinstall": "pnpm run build:plugin"
     }
   }
   ```

4. 使用 `.cjs` 扩展名确保 CommonJS 解析：
   - `app.plugin.cjs` - 插件入口
   - `plugin/build/index.cjs` - 构建输出
   - `plugin/build/withGodotFiles.cjs` - Android 插件
   - `plugin/build/withPckFile.cjs` - iOS 插件

#### 2. TypeScript 配置问题（已解决）

**问题描述**：
- TypeScript 编译输出 ES modules
- 与项目 `"type": "module"` 冲突
- 无法正确解析 `expo/config-plugins` 模块

**解决方案**：
- 不使用 TypeScript 编译插件
- 直接使用 JavaScript + CommonJS
- 避免类型检查问题

#### 3. 文件扩展名冲突（已解决）

**问题描述**：
- `.js` 文件在 `"type": "module"` 项目中被当作 ES modules
- 需要 `.cjs` 才能被当作 CommonJS

**解决方案**：
- 构建时将 `.js` 重命名为 `.cjs`
- 在 require 路径中使用 `.cjs` 扩展名

### 开发注意事项
1. **Android 补丁**: 如果遇到 Android 崩溃，需要应用 `@borndotcom/react-native-godot` 的补丁
2. **插件构建**: 修改插件代码后需要运行 `pnpm run build:plugin`
3. **资源更新**: 更新 Godot 游戏文件后需要重新运行 prebuild（插件会自动复制）
4. **CommonJS 格式**: 插件代码必须使用 CommonJS 格式，不能使用 ES modules

## 参考资源

- [React Native Godot GitHub](https://github.com/borndotcom/react-native-godot)
- [参考项目](./ref/react-native-godot-demo)

## 配置文件说明

### app.config.ts
Expo 的主配置文件，包含：
- 应用基本信息（名称、版本、包名）
- 平台特定配置（iOS、Android）
- 插件配置（包括 Godot 插件和 expo-build-properties）
- 构建属性配置

**关键配置**：
```typescript
plugins: [
  './app.plugin.cjs',
  [
    'expo-build-properties',
    {
      android: {
        minSdkVersion: 29,
        extraMavenRepos: [
          '../../node_modules/@borndotcom/react-native-godot/android/libs/libgodot-android/4.5.1.migeran.2',
        ],
      },
    },
  ],
]
```

### app.plugin.cjs
Expo 插件配置文件，用于加载自定义插件：
```javascript
module.exports = require('./plugin/build/index.cjs');
```

### package.json
项目依赖和脚本配置，包含：
- Godot 相关依赖
- 插件构建脚本：`build:plugin`
- 自动构建钩子：`postinstall`

**关键配置**：
```json
{
  "scripts": {
    "build:plugin": "node scripts/build-plugin.cjs",
    "postinstall": "pnpm run build:plugin"
  }
}
```

## 调试技巧

### 查看插件日志
在 prebuild 过程中，插件会输出日志：
- iOS: "Copied main.pck to iOS project"
- Android: "Copied Godot files from assets/godot/godot-files/main/ to android/app/src/main/assets/main/"

### 常见问题排查
1. **插件未生效**: 检查 `app.plugin.cjs` 路径是否正确
2. **资源未复制**: 检查 `assets/godot/` 目录是否存在
3. **类型错误**: 确保 `src/types/react-native-godot.d.ts` 存在
4. **构建失败**: 运行 `pnpm run build:plugin` 重新构建插件
5. **模块错误**: 确保插件使用 CommonJS 格式（.cjs 扩展名）
6. **require 错误**: 检查 require 路径是否使用 .cjs 扩展名

### 验证插件工作
运行 prebuild 后检查：
- iOS: `ios/main.pck` 文件是否存在
- Android: `android/app/src/main/assets/main/` 目录是否存在
- Xcode 项目中是否包含 `main.pck` 资源

## 集成步骤总结

### 快速集成（推荐）

1. **安装依赖**
```bash
pnpm add @borndotcom/react-native-godot expo-build-properties expo-file-system
pnpm add -D expo-module-scripts
```

2. **创建插件文件**
```bash
mkdir -p plugin/src
# 创建 index.js, withPckFile.js, withGodotFiles.js（使用 CommonJS 格式）
```

3. **创建构建脚本**
```bash
mkdir -p scripts
# 创建 build-plugin.cjs
```

4. **配置 package.json**
```json
{
  "scripts": {
    "build:plugin": "node scripts/build-plugin.cjs",
    "postinstall": "pnpm run build:plugin"
  }
}
```

5. **创建 app.plugin.cjs**
```javascript
module.exports = require('./plugin/build/index.cjs');
```

6. **配置 app.config.ts**
```typescript
plugins: [
  './app.plugin.cjs',
  [
    'expo-build-properties',
    {
      android: {
        minSdkVersion: 29,
        extraMavenRepos: [
          '../../node_modules/@borndotcom/react-native-godot/android/libs/libgodot-android/4.5.1.migeran.2',
        ],
      },
    },
  ],
]
```

7. **添加 Godot 资源文件**
```bash
mkdir -p assets/godot/godot-files/main
# 复制 main.pck 和 godot-files/main/ 到 assets/godot/
```

8. **构建插件**
```bash
pnpm run build:plugin
```

9. **运行 prebuild**
```bash
npx expo prebuild --clean
```

### 关键要点

- ✅ 插件代码必须使用 CommonJS 格式
- ✅ 构建输出使用 .cjs 扩展名
- ✅ 资源文件放在根目录的 `assets/godot/`
- ✅ 插件配置文件在根目录的 `app.plugin.cjs`
- ✅ 避免在插件中使用 TypeScript
