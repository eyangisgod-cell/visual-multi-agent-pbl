# Docker 空间管理和 VHDX 文件压缩完全指南

## 📊 当前问题

**VHDX 文件位置**: `D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx`  
**当前大小**: 64.29 GB  
**问题**: 即使删除了所有 Docker 数据，VHDX 文件也不会自动缩小

---

## 🔧 解决方案

### 方案一：完全重置 Docker 数据（推荐）

**适用场景**: 
- 所有 Docker 容器已清除
- 想要彻底清理，从零开始
- 可以接受重新下载需要的镜像

**执行步骤**:

1. **以管理员身份打开 PowerShell**

2. **运行重置脚本**:
```powershell
cd e:\my-project\visual-multi-agent-pbl
.\reset-docker-data.ps1
```

3. **按照提示操作**:
   - 确认删除 VHDX 文件
   - 选择是否备份
   - 等待 Docker 重新启动

**效果**: 
- ✅ 删除 64GB 的旧 VHDX 文件
- ✅ Docker 会创建新的、小的 VHDX 文件（初始约 1-2GB）
- ✅ 新文件会按需增长，不会预分配大量空间

---

### 方案二：手动删除 VHDX 文件

**执行步骤**:

```powershell
# 1. 停止 Docker 和 WSL
wsl --shutdown
Stop-Process -Name "Docker Desktop", "com.docker.*" -Force

# 2. 删除 VHDX 文件
Remove-Item "D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx" -Force

# 3. 重启 Docker
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

---

## ⚙️ 配置磁盘限制（防止未来占用过多空间）

### 步骤 1: 打开 Docker Desktop 设置

1. 右键点击任务栏的 Docker 图标
2. 选择 **Settings**（设置）

### 步骤 2: 配置磁盘限制

1. 进入 **Resources** 标签
2. 找到 **Disk image size** 滑块
3. 拖动到合适的大小：
   - **30GB** - 轻度使用
   - **50GB** - 中度使用（推荐）
   - **80GB** - 重度使用
   - **100GB** - 非常重度使用
4. 点击 **Apply & Restart**

### 步骤 3: 运行配置脚本（可选）

```powershell
.\configure-docker-disk-limit.ps1
```

此脚本会：
- 显示当前配置
- 指导你设置磁盘限制
- 可选创建每周自动清理任务

---

## 🔄 日常维护最佳实践

### 1. 定期清理命令

**每周清理**（推荐）:
```powershell
# 清理所有未使用的资源
docker system prune -a -f --volumes

# 清理构建缓存
docker builder prune -a -f
```

**每月深度清理**:
```powershell
# 运行优化脚本
.\optimize-docker-vhdx.ps1
```

### 2. 使用 .dockerignore 文件

在项目根目录创建 `.dockerignore` 文件，避免不必要的文件进入镜像：

```
# 示例：.dockerignore
.git
node_modules
*.log
.env
dist
build
```

### 3. 监控磁盘使用

**查看当前使用情况**:
```powershell
docker system df
```

**查看可回收空间**:
```powershell
docker system df -v
```

### 4. 自动化清理

创建计划任务，每周自动清理：

```powershell
# 创建每周清理任务
.\configure-docker-disk-limit.ps1
# 选择创建自动清理任务
```

---

## 📋 清理脚本说明

项目中有三个清理脚本：

| 脚本 | 用途 | 执行频率 |
|------|------|----------|
| `reset-docker-data.ps1` | 完全重置 Docker 数据 | 偶尔（出问题时） |
| `optimize-docker-vhdx.ps1` | 清理并压缩 VHDX | 每周/每月 |
| `configure-docker-disk-limit.ps1` | 配置磁盘限制 | 一次配置 |

---

## 🎯 推荐操作流程

### 现在（立即执行）

```powershell
# 1. 完全重置 Docker 数据
.\reset-docker-data.ps1

# 2. 配置磁盘限制
.\configure-docker-disk-limit.ps1
```

### 每周维护

```powershell
# 运行快速清理
docker system prune -a -f --volumes
docker builder prune -a -f
```

### 每月维护

```powershell
# 运行完整优化
.\optimize-docker-vhdx.ps1
```

---

## ⚠️ 注意事项

1. **备份重要数据**: 删除 VHDX 文件前，确保重要数据已备份
2. **管理员权限**: 所有脚本需要以管理员身份运行
3. **Docker 重启时间**: 首次启动可能需要几分钟
4. **镜像重新下载**: 重置后需要重新下载常用镜像

---

## 📞 故障排除

### 问题 1: VHDX 文件无法删除

**解决**:
```powershell
# 确保所有 Docker 进程已停止
Get-Process | Where-Object {$_.Name -like "*docker*"} | Stop-Process -Force
wsl --shutdown

# 等待 10 秒后重试
Start-Sleep -Seconds 10

# 再次删除
Remove-Item "D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx" -Force
```

### 问题 2: Docker 启动后 VHDX 文件仍然很大

**原因**: WSL 2 VHDX 文件不会自动收缩

**解决**: 使用 DiskPart 手动压缩
```powershell
diskpart
# 在 DiskPart 中执行:
SELECT VDISK FILE="D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx"
ATTACH VDISK READONLY
COMPACT VDISK
DETACH VDISK
EXIT
```

### 问题 3: 磁盘空间仍然不足

**检查其他 WSL 发行版**:
```powershell
wsl --list --verbose
wsl --shutdown
```

**清理 WSL 空间**:
```powershell
# 查看 WSL 磁盘使用
wsl df -h

# 清理 Ubuntu（如果使用）
wsl -d Ubuntu -e sudo apt clean
wsl -d Ubuntu -e sudo apt autoremove -y
```

---

## 📊 预期效果

执行完全重置后：

| 项目 | 重置前 | 重置后 | 释放空间 |
|------|--------|--------|----------|
| VHDX 文件 | 64.29 GB | ~2 GB | **~62 GB** |
| Docker 镜像 | 19.83 GB | 0 GB | **~20 GB** |
| 构建缓存 | 6.15 GB | 0 GB | **~6 GB** |
| **总计** | **~90 GB** | **~2 GB** | **~88 GB** |

---

## ✅ 总结

1. **立即执行**: 运行 `reset-docker-data.ps1` 删除 64GB VHDX 文件
2. **配置限制**: 在 Docker Desktop 中设置 50GB 磁盘限制
3. **定期维护**: 每周运行清理命令，每月运行优化脚本
4. **自动化**: 创建计划任务自动清理

遵循此指南，你的 Docker 将保持轻量且高效运行！🚀
