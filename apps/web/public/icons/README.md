# PWA Icons 生成指南

## 所需图标尺寸

本应用需要以下 PWA 图标：

### 主图标
- `/icons/icon-192x192.png` - 192x192 像素 PNG 图标
- `/icons/icon-512x512.png` - 512x512 像素 PNG 图标

### 推荐额外图标
- `/icons/icon-72x72.png` - 72x72 像素（旧设备）
- `/icons/icon-96x96.png` - 96x96 像素（旧设备）
- `/icons/icon-128x128.png` - 128x128 像素（旧设备）
- `/icons/icon-144x144x144.png` - 144x144 像素（旧设备）
- `/icons/icon-152x152.png` - 152x152 像素（iOS）
- `/icons/icon-192x192.png` - 192x192 像素（Android）
- `/icons/icon-384x384.png` - 384x384 像素（Android）
- `/icons/icon-512x512.png` - 512x512 像素（通用）

## 图标设计要求

1. **格式**: PNG（支持透明背景）
2. **形状**: 正方形
3. **内容**: 
   - 应包含应用的标志性元素
   - 避免过多细节（小尺寸时看不清）
   - 考虑添加 padding（约 10-15%）以适应不同设备的圆角处理

## 图标生成工具

### 在线工具
- [PWA Icon Generator](https://www.pwaicon.com/)
- [Icon Generator](https://icon.kitchen/)
- [Figma](https://www.figma.com/) - 设计后导出

### 命令行工具
```bash
# 使用 ImageMagick
convert source-icon.png -resize 192x192 icons/icon-192x192.png
convert source-icon.png -resize 512x512 icons/icon-512x512.png
```

## 临时占位符

在正式图标完成前，可以使用以下方法生成临时占位符：

```bash
# 使用纯色占位符（蓝色）
convert -size 192x192 xc:#4f46e5 icons/icon-192x192.png
convert -size 512x512 xc:#4f46e5 icons/icon-512x512.png
```

## 截图要求

`/screenshots/game.png` - 1080x1920 像素 PNG 截图

截图应展示：
- 游戏主界面
- 清晰的 UI 元素
- 代表应用核心功能

## 验证

使用 Chrome DevTools 验证 PWA 配置：

1. 打开应用
2. F12 打开 DevTools
3. 前往 Application 标签
4. 检查 Manifest 和 Service Workers
