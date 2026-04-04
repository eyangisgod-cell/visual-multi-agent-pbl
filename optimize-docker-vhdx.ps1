# Docker VHDX 优化脚本
# 清理 Docker 资源并压缩 WSL VHDX 文件以释放磁盘空间

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker VHDX 优化和空间清理工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 显示当前磁盘使用情况
Write-Host "[1/7] 检查当前磁盘使用情况..." -ForegroundColor Yellow
$vhdxPath = "D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx"
if (Test-Path $vhdxPath) {
    $size = (Get-Item $vhdxPath).Length / 1GB
    Write-Host "  Docker VHDX 文件：$vhdxPath" -ForegroundColor Gray
    Write-Host "  当前大小：$([math]::Round($size, 2)) GB" -ForegroundColor $(if ($size -gt 50) {"Red"} else {"Green"})
}
Write-Host ""

# 步骤 2: 清理 Docker 资源
Write-Host "[2/7] 清理 Docker 未使用的资源..." -ForegroundColor Yellow
docker system prune -a -f --volumes
Write-Host "✓ Docker 清理完成" -ForegroundColor Green
Write-Host ""

# 步骤 3: 停止 Docker 和 WSL
Write-Host "[3/7] 停止 Docker Desktop 和 WSL..." -ForegroundColor Yellow
Stop-Process -Name "Docker Desktop", "com.docker.backend", "com.docker.frontend", "docker-desktop" -Force -ErrorAction SilentlyContinue
wsl --shutdown
Start-Sleep -Seconds 5
Write-Host "✓ 服务已停止" -ForegroundColor Green
Write-Host ""

# 步骤 4: 使用 WSL 命令优化 VHDX
Write-Host "[4/7] 优化 WSL 虚拟磁盘..." -ForegroundColor Yellow
Write-Host "注意：WSL 2 VHDX 文件不会自动收缩，需要手动优化" -ForegroundColor Yellow
Write-Host ""

# 创建 DiskPart 脚本
$diskpartScript = @"
select vdisk file="$vhdxPath"
attach vdisk readonly
compact vdisk
detach vdisk
"@
$scriptPath = "$env:TEMP\docker_compact_$((Get-Date).ToString('yyyyMMddHHmmss')).txt"
$diskpartScript | Out-File -FilePath $scriptPath -Encoding UTF8

Write-Host "执行 DiskPart 压缩命令..." -ForegroundColor Gray
Write-Host "这可能需要几分钟时间，请耐心等待..." -ForegroundColor Gray
diskpart /s $scriptPath

Write-Host ""
Write-Host "✓ DiskPart 压缩完成" -ForegroundColor Green

# 清理临时文件
Remove-Item -Path $scriptPath -Force -ErrorAction SilentlyContinue

# 步骤 5: 显示优化后大小
Write-Host ""
Write-Host "[5/7] 检查优化后大小..." -ForegroundColor Yellow
if (Test-Path $vhdxPath) {
    $newSize = (Get-Item $vhdxPath).Length / 1GB
    Write-Host "  VHDX 文件新大小：$([math]::Round($newSize, 2)) GB" -ForegroundColor Green
}
Write-Host ""

# 步骤 6: 重启 Docker Desktop
Write-Host "[6/7] 重启 Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Write-Host "正在等待 Docker Desktop 启动..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# 步骤 7: 验证 Docker 状态
Write-Host "[7/7] 验证 Docker 状态..." -ForegroundColor Yellow
try {
    $result = docker ps
    Write-Host "✓ Docker 运行正常" -ForegroundColor Green
} catch {
    Write-Host "⚠ Docker 可能还未完全启动，请稍后再试" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "优化完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "重要提示：" -ForegroundColor Cyan
Write-Host "1. WSL 2 VHDX 文件会自动增长但不会自动收缩" -ForegroundColor Gray
Write-Host "2. 定期运行此脚本保持磁盘空间整洁" -ForegroundColor Gray
Write-Host "3. 如需彻底压缩，可在 Windows 磁盘管理中操作：" -ForegroundColor Gray
Write-Host "   - 右键点击开始菜单 -> 磁盘管理" -ForegroundColor Gray
Write-Host "   - 找到 WSL 的虚拟磁盘" -ForegroundColor Gray
Write-Host "   - 右键 -> 压缩卷" -ForegroundColor Gray
Write-Host ""
Write-Host "或者使用以下命令手动压缩 VHDX：" -ForegroundColor Cyan
Write-Host "diskpart /s $env:TEMP\compact_docker.txt" -ForegroundColor White
Write-Host ""
