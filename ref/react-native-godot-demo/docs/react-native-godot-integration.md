# React Native 与 Godot 融合机制详解

## 一、核心概念

React Native 与 Godot 的融合不是简单的 UI 叠加，而是通过 **原生桥接** 和 **线程隔离** 实现的深度集成。

### 1.1 架构概述

```
┌─────────────────────────────────────────────────────────┐
│              React Native 层（JavaScript）              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React Native UI 组件                             │  │
│  │  - 触摸控制按钮                                   │  │
│  │  - UI 界面                                       │  │
│  │  - 导航栏                                       │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  RTNGodotView 组件（原生视图）                     │  │
│  │  - 嵌入 Godot 渲染视图                            │  │
│  │  - 处理触摸事件                                   │  │
│  │  - 显示 Godot 渲染内容                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Godot 引擎层（原生）                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Godot 渲染循环                                    │  │
│  │  - 游戏逻辑                                      │  │
│  │  - 物理引擎                                      │  │
│  │  - 输入处理                                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 二、融合机制详解

### 2.1 RTNGodotView 组件

**核心组件**：`RTNGodotView`

**作用**：
- 在 React Native 中嵌入 Godot 渲染视图
- 作为原生视图组件（类似于 `<Image>` 或 `<View>`）
- 处理 Godot 的渲染和输入

**使用示例**：
```typescript
import { RTNGodotView } from 'react-native-godot';

function GameScreen() {
  return (
    <View style={styles.container}>
      {/* Godot 渲染视图 */}
      <RTNGodotView 
        style={styles.gameView}
      />
      
      {/* React Native UI 叠加层 */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_left')}
        >
          <Text>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_accept')}
        >
          <Text>跳</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_right')}
        >
          <Text>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**关键点**：
- `RTNGodotView` 是一个原生组件，不是 React 组件
- 它直接渲染 Godot 引擎的输出
- 可以与 React Native UI 叠加层共存
- React Native UI 悬浮在 Godot 视图之上

### 2.2 线程隔离机制

**问题**：Godot 引擎需要在单独的线程上运行，不能在 JavaScript 线程上运行。

**解决方案**：使用 Worklet（工作线程）

**机制**：
```
JavaScript 主线程
    ↓
runOnGodotThread()
    ↓
Godot 专用线程
    ↓
LibGodot 原生库
    ↓
Godot 引擎
```

**代码示例**：
```typescript
import { runOnGodotThread } from 'react-native-godot';

function pressAction(action: string) {
  // 在 Godot 专用线程上执行
  runOnGodotThread(() => {
    'worklet';
    
    // 获取 Godot API
    const Godot = RTNGodot.API();
    const Input = Godot.Input;
    
    // 发送输入事件到 Godot
    Input.action_press(action);
  });
}
```

**关键点**：
- `runOnGodotThread` 将代码调度到 Godot 专用线程
- `'worklet'` 标记告诉系统这是 worklet 函数
- 避免线程冲突和性能问题

### 2.3 输入处理机制

**React Native → Godot 输入流程**：

```
用户触摸 React Native 按钮
    ↓
JavaScript 处理触摸事件
    ↓
调用 pressAction('ui_left')
    ↓
runOnGodotThread()
    ↓
在 Godot 线程上调用 Godot.Input.action_press('ui_left')
    ↓
Godot 引擎接收输入事件
    ↓
Godot 游戏逻辑响应输入
    ↓
Godot 更新游戏状态
    ↓
RTNGodotView 渲染更新后的画面
```

**代码示例**：
```typescript
// React Native 端
function pressAction(action: string) {
  runOnGodotThread(() => {
    'worklet';
    const Godot = RTNGodot.API();
    const Input = Godot.Input;
    Input.action_press(action);
  });
}

// Godot 端（GDScript）
func _input(event):
    if event.is_action_pressed("ui_left"):
        velocity.x = -SPEED
    elif event.is_action_pressed("ui_right"):
        velocity.x = SPEED
    elif event.is_action_pressed("ui_accept"):
        if is_on_floor():
            velocity.y = JUMP_FORCE
```

### 2.4 平台特定文件处理

#### iOS 平台

**文件格式**：`.pck`（Godot Pack 文件）

**原因**：
- iOS 访问 pack 文件没有性能限制
- pack 文件更高效，易于管理

**处理流程**：
```
1. 开发者将 Godot 游戏导出为 main.pck
2. 放置在 assets/godot/main.pck
3. 自定义 Expo 插件 withPckFile.ts
4. prebuild 时自动复制到 iOS 项目根目录
5. 添加到 Xcode 资源
6. Godot 初始化时使用 --main-pack 参数
```

**代码示例**：
```typescript
// plugin/src/withPckFile.ts (iOS 插件)
export default function withPckFile(config) {
  // 复制 main.pck 到 iOS 项目根目录
  const source = path.join(projectRoot, 'assets', 'godot', 'main.pck');
  const destination = path.join(projectRoot, 'main.pck');
  
  fs.copyFileSync(source, destination);
  
  // 添加到 Xcode 项目资源
  config.modResults = [
    {
      platform: 'ios',
      file: 'main.pck',
      buildPhase: 'Resources',
    },
  ];
}
```

**Godot 初始化**：
```typescript
// iOS 初始化
const godot = await RTNGodot.init({
  '--main-pack': FileSystem.bundleDirectory + '/main.pck',
});
```

#### Android 平台

**文件格式**：文件夹结构

**原因**：
- Android 访问 pack 文件内容很慢
- 单独文件访问性能更好

**处理流程**：
```
1. 开发者将 Godot 游戏导出为文件夹结构
2. 放置在 assets/godot/godot-files/main/
3. 自定义 Expo 插件 withGodotFiles.ts
4. prebuild 时递归复制到 android/app/src/main/assets/main/
5. Godot 初始化时使用 --path /main 参数
```

**代码示例**：
```typescript
// plugin/src/withGodotFiles.ts (Android 插件)
export default function withGodotFiles(config) {
  const source = path.join(projectRoot, 'assets', 'godot', 'godot-files', 'main');
  const destination = path.join(
    projectRoot, 
    'android', 
    'app', 
    'src', 
    'main', 
    'assets', 
    'main'
  );
  
  // 递归复制所有文件
  copyDirectorySync(source, destination);
  
  // 确保目标目录存在
  fs.mkdirSync(destination, { recursive: true });
}
```

**Godot 初始化**：
```typescript
// Android 初始化
const godot = await RTNGodot.init({
  '--path': '/main',  // 指向 assets 目录
});
```

## 三、完整集成示例

### 3.1 React Native 端完整代码

```typescript
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RTNGodotView, runOnGodotThread } from 'react-native-godot';

export default function GameScreen() {
  // 初始化 Godot
  useEffect(() => {
    const initGodot = async () => {
      try {
        await RTNGodot.init({
          // iOS 使用 --main-pack
          // Android 使用 --path
          ...(Platform.OS === 'ios' 
            ? { '--main-pack': 'main.pck' }
            : { '--path': '/main' }
          ),
        });
        console.log('Godot initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Godot:', error);
      }
    };

    initGodot();
  }, []);

  // 输入处理函数
  const pressAction = (action: string) => {
    runOnGodotThread(() => {
      'worklet';
      const Godot = RTNGodot.API();
      const Input = Godot.Input;
      Input.action_press(action);
    });
  };

  const releaseAction = (action: string) => {
    runOnGodotThread(() => {
      'worklet';
      const Godot = RTNGodot.API();
      const Input = Godot.Input;
      Input.action_release(action);
    });
  };

  return (
    <View style={styles.container}>
      {/* Godot 渲染视图 */}
      <RTNGodotView style={styles.gameView} />
      
      {/* React Native UI 叠加层 */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button}
          onPressIn={() => pressAction('ui_left')}
          onPressOut={() => releaseAction('ui_left')}
        >
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPressIn={() => pressAction('ui_accept')}
          onPressOut={() => releaseAction('ui_accept')}
        >
          <Text style={styles.buttonText}>跳</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPressIn={() => pressAction('ui_right')}
          onPressOut={() => releaseAction('ui_right')}
        >
          <Text style={styles.buttonText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameView: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

### 3.2 Godot 端完整代码（GDScript）

```gdscript
extends CharacterBody2D

const SPEED = 200.0
const JUMP_FORCE = -400.0

var velocity = Vector2.ZERO

func _ready():
    # 设置输入映射
    Input.add_action("ui_left")
    Input.add_action("ui_right")
    Input.add_action("ui_accept")

func _physics_process(delta):
    # 处理移动
    velocity.x = 0
    velocity.y += gravity * delta
    
    # 处理输入
    if Input.is_action_pressed("ui_left"):
        velocity.x = -SPEED
    elif Input.is_action_pressed("ui_right"):
        velocity.x = SPEED
    
    # 处理跳跃
    if Input.is_action_pressed("ui_accept"):
        if is_on_floor():
            velocity.y = JUMP_FORCE
    
    # 应用移动
    velocity = move_and_slide()
```

## 四、数据流图

### 4.1 输入流

```
用户触摸 React Native 按钮
    ↓
React Native JavaScript 主线程
    ↓
pressAction('ui_left')
    ↓
runOnGodotThread()
    ↓
Godot 专用线程
    ↓
RTNGodot.API().Input.action_press('ui_left')
    ↓
Godot Input 系统
    ↓
Godot 游戏逻辑处理
    ↓
Godot 更新游戏状态
    ↓
RTNGodotView 重新渲染
```

### 4.2 渲染流

```
Godot 引擎渲染循环
    ↓
生成渲染帧
    ↓
通过 LibGodot 传递到原生层
    ↓
RTNGodotView 接收渲染数据
    ↓
转换为原生视图
    │
    ├─ iOS: OpenGL/Metal 渲染
    └─ Android: OpenGL ES/Vulkan 渲染
    ↓
React Native 显示
```

### 4.3 线程通信流

```
JavaScript 主线程
    ↓
React Native 桥接
    ↓
原生层
    ↓
线程调度器
    ↓
Godot 专用线程
    ↓
LibGodot
    ↓
Godot 引擎
    ↓
返回结果到 Godot 线程
    ↓
线程调度器
    ↓
返回到 JavaScript 主线程
```

## 五、关键技术点

### 5.1 Worklet 机制

**什么是 Worklet**：
- 在单独线程上执行的 JavaScript 函数
- 用于避免阻塞主线程
- 在 React Native Godot 中用于 Godot API 调用

**为什么需要 Worklet**：
- Godot 引擎不是线程安全的
- 不能在 JavaScript 主线程上直接操作 Godot
- 需要在专用线程上执行 Godot 操作

**示例**：
```typescript
// ❌ 错误：在主线程上调用 Godot API
const Godot = RTNGodot.API();
Godot.Input.action_press('ui_left'); // 可能导致崩溃

// ✅ 正确：在 Godot 线程上调用
runOnGodotThread(() => {
  'worklet';
  const Godot = RTngodot.API();
  Godot.Input.action_press('ui_left');
});
```

### 5.2 原生视图集成

**RTNGodotView 原理**：
- 是一个 React Native 原生视图组件
- 类似于 `<Image>` 或 `<View>`
- 底层使用原生代码实现
- 直接渲染 Godot 引擎的输出

**与普通视图的区别**：
- 普通视图：渲染静态内容（图片、文本、布局）
- RTNGodotView：渲染动态游戏内容（实时渲染）

**代码示例**：
```typescript
// 普通视图
<Image 
  source={{ uri: 'https://example.com/image.png' }}
  style={{ width: 200, height: 200 }}
/>

// Godot 视图
<RTNGodotView 
  style={{ flex: 1 }}
  // 自动渲染 Godot 游戏内容
/>
```

### 5.3 自定义 Expo 插件

**插件作用**：
- 自动处理平台特定的文件复制
- 在 prebuild 过程中执行
- 简化开发流程

**iOS 插件**：
```typescript
// plugin/src/withPckFile.ts
export default function withPckFile(config) {
  // 复制 main.pck
  fs.copyFileSync('assets/godot/main.pck', 'main.pck');
  
  // 添加到 Xcode 资源
  config.modResults = [
    {
      platform: 'ios',
      file: 'main.pck',
      buildPhase: 'Resources',
    },
  ];
}
```

**Android 插件**：
```typescript
// plugin/src/withGodotFiles.ts
export default function withGodotFiles(config) {
  // 递归复制 Godot 文件
  copyDirectorySync(
    'assets/godot/godot-files/main/',
    'android/app/src/main/assets/main/'
  );
}
```

## 六、常见问题

### 6.1 为什么不能直接在 React Native 中写游戏逻辑？

**原因**：
- React Native 是 UI 框架，不是游戏引擎
- 没有物理引擎、碰撞检测等游戏功能
- 性能不足以处理复杂游戏逻辑

**解决方案**：
- 使用 Godot 引擎处理游戏逻辑
- React Native 处理 UI 和输入
- 通过 API 桥接两者

### 6.2 为什么需要线程隔离？

**原因**：
- Godot 引擎不是线程安全的
- JavaScript 主线程被 UI 渲染占用
- 直接调用会导致崩溃或性能问题

**解决方案**：
- 使用 `runOnGodotThread()` 调度到 Godot 专用线程
- 所有 Godot API 调用必须在 worklet 中执行

### 6.3 为什么 iOS 和 Android 使用不同的文件格式？

**原因**：
- **iOS**：访问 pack 文件性能好，文件管理简单
- **Android**：访问 pack 文件内容慢，单独文件性能好

**解决方案**：
- iOS 使用 `.pck` 文件
- Android 使用文件夹结构
- 自定义插件自动处理差异

## 七、RTNGodotView 使用方式

### 7.1 全屏 Godot 视图（整个页面）

**场景**：整个页面都是 Godot 游戏，没有 React Native UI

**代码示例**：
```typescript
import { RTNGodotView } from 'react-native-godot';

export default function FullScreenGame() {
  return (
    <View style={styles.container}>
      {/* 整个页面都是 Godot 视图 */}
      <RTNGodotView style={styles.fullScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreen: {
    flex: 1, // 占据整个屏幕
  },
});
```

**特点**：
- ✅ 整个页面都是 Godot 渲染
- ✅ 没有额外的 React Native UI
- ✅ 适合纯游戏应用
- ✅ 性能最优

### 7.2 局部 Godot 视图（页面的一部分）

**场景**：页面的一部分是 Godot 游戏，其他部分是 React Native UI

**代码示例**：
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RTNGodotView, runOnGodotThread } from 'react-native-godot';

export default function HybridScreen() {
  return (
    <View style={styles.container}>
      {/* 顶部 React Native UI */}
      <View style={styles.header}>
        <Text style={styles.title}>我的游戏</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Text>菜单</Text>
        </TouchableOpacity>
      </View>
      
      {/* 中间 Godot 视图（页面的一部分） */}
      <RTNGodotView style={styles.gameView} />
      
      {/* 底部 React Native UI 控制层 */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_left')}
        >
          <Text>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_accept')}
        >
          <Text>跳</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_right')}
        >
          <Text>→</Text>
        </TouchableOpacity>
      </View>
      
      {/* 侧边 React Native UI */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>排行榜</Text>
        <Text style={styles.sidebarItem}>1. 玩家 - 1000分</Text>
        <Text style={styles.sidebarItem}>2. 玩家 - 800分</Text>
        <Text style={styles.sidebarItem}>3. 玩家 - 600分</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  gameView: {
    flex: 1, // 占据中间部分
  },
  controls: {
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#333',
    padding: 20,
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sidebarItem: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
});
```

**特点**：
- ✅ Godot 视图只占页面的一部分
- ✅ React Native UI 可以与 Godot 视图共存
- ✅ 可以添加侧边栏、顶部栏等 UI
- ✅ 适合混合应用（游戏 + UI）
- ✅ 更灵活的用户体验

### 7.3 多个 Godot 视图（页面的多个部分）

**场景**：页面中有多个独立的 Godot 视图

**代码示例**：
```typescript
import { View } from 'react-native';
import { RTNGodotView, runOnGodotThread } from 'react-native-godot';

export default function MultiGodotScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.game1}>
        <Text>游戏 1</Text>
        <RTNGodotView style={styles.gameView} />
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_accept')}
        >
          <Text>跳跃</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.game2}>
        <Text>游戏 2</text>
        <RTNGodotView style={styles.gameView} />
        <TouchableOpacity 
          style={styles.button}
          onPress={() => pressAction('ui_accept')}
        >
          <Text>跳跃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  game1: {
    flex: 1,
  },
  game2: {
    flex: 1,
  },
  gameView: {
    flex: 1,
  },
  button: {
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
});
```

**特点**：
- ✅ 页面可以有多个独立的 Godot 视图
- ✅ 每个 Godot 视图可以独立控制
- ✅ 适合多游戏页面或游戏展示

### 7.4 使用建议

**全屏 Godot 视图适合**：
- 纯游戏应用
- 游戏展示页面
- 游戏体验页面

**局部 Godot 视图适合**：
- 混合应用（游戏 + UI）
- 游戏预览
- 游戏教程
- 游戏排行榜页面

**混合使用优势**：
- 利用 React Native 强大的 UI 能力
- 利用 Godot 强大的游戏引擎
- 提供更好的用户体验
- 更灵活的页面布局

## 八、总结

### 7.1 融合机制总结

1. **视图层**：RTNGodotView 嵌入 Godot 渲染视图
2. **输入层**：React Native 触摸事件 → worklet → Godot Input API
3. **线程层**：JavaScript 主线程 → 线程调度器 → Godot 专用线程
4. **文件层**：自定义 Expo 插件自动处理平台差异
5. **渲染层**：Godot 引擎 → LibGodot → 原生视图 → React Native 显示

### 7.2 关键技术点

- ✅ RTNGodotView 原生视图组件
- ✅ runOnGodotThread 线程隔离
- ✅ worklet 机制
- ✅ 自定义 Expo 插件
- ✅ 平台特定文件处理

### 7.3 优势

- ✅ 利用 Godot 强大的游戏引擎
- ✅ 利用 React Native 跨平台能力
- ✅ 线程隔离保证稳定性
- ✅ 自动化文件处理简化开发
- ✅ 自定义 UI 叠加层增强体验

---

> **学习来源**：React Native Godot 官方文档 + 项目 README 分析
> 
> **核心机制**：RTNGodotView（原生视图）+ runOnGodotThread（线程隔离）+ 自定义插件（文件处理）
