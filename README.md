# FOC 可视化教程

> 磁场定向控制（FOC）的可视化交互教学站 —— 纯原生 HTML/CSS/JS，零依赖，打开即用。

## 这是什么

一个用 Canvas 动画一步步讲清楚 FOC 从三相电流到双闭环 PI 控制完整链路的交互式教学网站。

每个知识点都有滑块交互、实时数值、Canvas 动画、公式说明。

## 快速开始

### 在线访问

https://你的用户名.github.io/foc-tutorial/

### 本地打开

双击 index.html 即可，无需服务器。

## 内容结构

| 部分 | 编号 | 主题 |
|------|------|------|
| 一 | 01 ~ 07 | 坐标变换 |
| 二 | 08 ~ 13 | SVPWM |
| 三 | 14 ~ 18 | 控制 |
| 四 | 19 ~ 21 | PI 调参 |
| 五 | 22 ~ 25 | 综合与硬件 |
| 附录 | 26 | 旧版资料库 |

## 技术栈

- HTML5 + CSS3 + 原生 JavaScript
- Canvas 2D 绘制动画
- 零外部依赖
- 支持高 DPI 屏幕

## 目录结构

foc-tutorial/
├── index.html
├── 01-three-phase.html
├── ...
├── README.md
└── assets/
    ├── style.css
    ├── nav.js
    ├── canvas-fit.js
    └── motor-model.js

## 特性

- 5 大部分颜色区分
- 键盘快捷键：空格 / R / 左右箭头
- 实时数值可复制
- 响应式布局
- 无需网络，完全离线可用

## 许可

仅供教学和学习使用。
