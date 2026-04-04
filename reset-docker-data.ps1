# Docker 数据完全重置脚本
# 删除旧的 VHDX 文件并重新初始化，避免旧数据占用空间

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker 数据完全重置工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠ 警告：此操作将删除所有 Docker 数据！" -ForegroundColor Red
Write-Host "包括：所有容器、镜像、卷、构建缓存" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "确定要继续吗？这将删除约 64GB 的 VHDX 文件 (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "[1/6] 停止 Docker Desktop 和相关服务..." -ForegroundColor Yellow
Stop-Process -Name "Docker Desktop", "com.docker.backend", "com.docker.frontend", "docker-desktop" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "✓ 进程已停止" -ForegroundColor Green

Write-Host ""
Write-Host "[2/6] 关闭所有 WSL 发行版..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5
Write-Host "✓ WSL 已关闭" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] 检查并删除旧的 VHDX 文件..." -ForegroundColor Yellow
$vhdxPath = "D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx"
$backupPath = "D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"

if (Test-Path $vhdxPath) {
    $oldSize = (Get-Item $vhdxPath).Length / 1GB
    Write-Host "  找到 VHDX 文件：$vhdxPath" -ForegroundColor Gray
    Write-Host "  当前大小：$([math]::Round($oldSize, 2)) GB" -ForegroundColor Gray
    
    $backupChoice = Read-Host "是否创建备份？(y/n, 建议选 y 以防万一)"
    if ($backupChoice -eq "y" -or $backupChoice -eq "Y") {
        Write-Host "  创建备份到：$backupPath" -ForegroundColor Gray
        Copy-Item -Path $vhdxPath -Destination $backupPath -Force
        Write-Host "  ✓ 备份完成" -ForegroundColor Green
    }
    
    Write-Host "  正在删除 VHDX 文件..." -ForegroundColor Gray
    Remove-Item -Path $vhdxPath -Force
    Write-Host "  ✓ VHDX 文件已删除" -ForegroundColor Green
    Write-Host "  ✓ 释放空间：约 $([math]::Round($oldSize, 2)) GB" -ForegroundColor Green
} else {
    Write-Host "  VHDX 文件不存在，跳过删除" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/6] 清理 Docker Desktop 配置（可选）..." -ForegroundColor Yellow
$resetChoice = Read-Host "是否重置 Docker Desktop 设置？(y/n, 选 n 保留设置)"
if ($resetChoice -eq "y" -or $resetChoice -eq "Y") {
    $appDataPath = "$env:APPDATA\Docker"
    $localAppDataPath = "$env:LOCALAPPDATA\Docker"
    
    if (Test-Path $appDataPath) {
        Write-Host "  删除：$appDataPath" -ForegroundColor Gray
        Remove-Item -Path $appDataPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $localAppDataPath) {
        Write-Host "  删除：$localAppDataPath" -ForegroundColor Gray
        Remove-Item -Path $localAppDataPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✓ Docker 设置已重置" -ForegroundColor Green
} else {
    Write-Host "  保留 Docker 设置" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/6] 重启 Docker Desktop..." -ForegroundColor Yellow
Write-Host "首次启动会重新创建 VHDX 文件，这可能需要几分钟..." -ForegroundColor Gray
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Write-Host "等待 Docker Desktop 完全启动..." -ForegroundColor Gray

# 等待 Docker 启动
for ($i = 1; $i -le 10; $i++) {
    Start-Sleep -Seconds 5
    try {
        $null = docker ps -a 2>$null
        Write-Host "  Docker 已就绪 (尝试 $i/10)" -ForegroundColor Green
        break
    } catch {
        Write-Host "  等待中... ($i/10)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[6/6] 验证 Docker 状态..." -ForegroundColor Yellow
try {
    $result = docker ps
    Write-Host "✓ Docker 运行正常" -ForegroundColor Green
    
    $df = docker system df
    Write-Host ""
    Write-Host "当前 Docker 资源使用：" -ForegroundColor Cyan
    $df | Out-String | Write-Host
} catch {
    Write-Host "⚠ Docker 可能还未完全启动，请稍后手动检查" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "重置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "新的 VHDX 文件将按需增长，不会预分配大量空间" -ForegroundColor Green
Write-Host ""
Write-Host "💡 建议的配置和最佳实践：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 在 Docker Desktop 中限制磁盘使用量：" -ForegroundColor White
Write-Host "   - 打开 Docker Desktop 设置" -ForegroundColor Gray
Write-Host "   - 进入 Resources → Disk image size" -ForegroundColor Gray
Write-Host "   - 设置合适的最大值（如 50GB）" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 定期清理未使用的资源：" -ForegroundColor White
Write-Host "   - docker system prune -a -f --volumes" -ForegroundColor Gray
Write-Host "   - docker builder prune -a -f" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 使用 .dockerignore 文件避免不必要的文件进入镜像" -ForegroundColor White
Write-Host ""
Write-Host "4. 定期运行清理脚本保持空间整洁" -ForegroundColor White
Write-Host ""
