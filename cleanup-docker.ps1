# Docker WSL 数据清理和压缩脚本
# 此脚本将清理 Docker 数据并压缩 VHDX 文件以释放磁盘空间

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker WSL 数据清理和压缩工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 停止 Docker Desktop 和 WSL
Write-Host "[1/6] 停止 Docker Desktop 和相关服务..." -ForegroundColor Yellow
Stop-Process -Name "Docker Desktop", "com.docker.backend", "com.docker.frontend", "docker-desktop" -Force -ErrorAction SilentlyContinue
wsl --shutdown
Start-Sleep -Seconds 5
Write-Host "✓ 服务已停止" -ForegroundColor Green
Write-Host ""

# 2. 显示当前磁盘使用情况
$vhdxPath = "D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx"
$ext4Path = "D:\DockerDesktopWSL\DockerDesktopWSL\main\ext4.vhdx"

Write-Host "[2/6] 检查当前磁盘使用情况..." -ForegroundColor Yellow
if (Test-Path $vhdxPath) {
    $size = (Get-Item $vhdxPath).Length / 1GB
    Write-Host "  Docker 数据文件：$vhdxPath" -ForegroundColor Gray
    Write-Host "  当前大小：$([math]::Round($size, 2)) GB" -ForegroundColor $(if ($size -gt 50) {"Red"} else {"Green"})
}
if (Test-Path $ext4Path) {
    $size = (Get-Item $ext4Path).Length / 1GB
    Write-Host "  主系统文件：$ext4Path" -ForegroundColor Gray
    Write-Host "  当前大小：$([math]::Round($size, 2)) GB" -ForegroundColor $(if ($size -gt 10) {"Red"} else {"Green"})
}
Write-Host ""

# 3. 询问清理方式
Write-Host "[3/6] 选择清理方式:" -ForegroundColor Yellow
Write-Host "  1. 完全清理 - 删除所有 Docker 容器、镜像和数据（释放最多空间）" -ForegroundColor White
Write-Host "  2. 保守清理 - 仅压缩 VHDX 文件，保留数据" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选项 (1 或 2，默认为 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

if ($choice -eq "1") {
    # 完全清理
    Write-Host ""
    Write-Host "⚠ 警告：此操作将删除所有 Docker 数据！" -ForegroundColor Red
    $confirm = Read-Host "确定要继续吗？(y/n)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Host ""
        Write-Host "正在删除 Docker 数据文件..." -ForegroundColor Yellow
        
        # 创建备份（可选）
        $backupChoice = Read-Host "是否创建备份？(y/n)"
        if ($backupChoice -eq "y" -or $backupChoice -eq "Y") {
            $backupPath = "D:\DockerDesktopWSL\DockerDesktopWSL\disk\docker_data.vhdx.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
            Write-Host "创建备份到：$backupPath" -ForegroundColor Gray
            Copy-Item -Path $vhdxPath -Destination $backupPath -Force
            Write-Host "✓ 备份完成" -ForegroundColor Green
        }
        
        # 删除 VHDX 文件
        if (Test-Path $vhdxPath) {
            Remove-Item -Path $vhdxPath -Force
            Write-Host "✓ Docker 数据文件已删除" -ForegroundColor Green
            Write-Host "✓ 释放空间：约 $([math]::Round($size, 2)) GB" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "正在重置 Docker Desktop..." -ForegroundColor Yellow
        # 删除 Docker Desktop 配置（可选，更彻底的清理）
        $resetChoice = Read-Host "是否重置 Docker Desktop 设置？(y/n)"
        if ($resetChoice -eq "y" -or $resetChoice -eq "Y") {
            $appDataPath = "$env:APPDATA\Docker"
            $localAppDataPath = "$env:LOCALAPPDATA\Docker"
            if (Test-Path $appDataPath) { Remove-Item -Path $appDataPath -Recurse -Force -ErrorAction SilentlyContinue }
            if (Test-Path $localAppDataPath) { Remove-Item -Path $localAppDataPath -Recurse -Force -ErrorAction SilentlyContinue }
            Write-Host "✓ Docker 设置已重置" -ForegroundColor Green
        }
    } else {
        Write-Host "操作已取消" -ForegroundColor Yellow
    }
} else {
    # 保守清理 - 仅压缩
    Write-Host ""
    Write-Host "正在压缩 VHDX 文件..." -ForegroundColor Yellow
    
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
    Write-Host "✓ 压缩完成" -ForegroundColor Green
    
    # 显示压缩后大小
    if (Test-Path $vhdxPath) {
        $newSize = (Get-Item $vhdxPath).Length / 1GB
        Write-Host "压缩后大小：$([math]::Round($newSize, 2)) GB" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[4/6] 清理临时文件..." -ForegroundColor Yellow
Remove-Item -Path "$env:TEMP\docker_compact_*.txt" -Force -ErrorAction SilentlyContinue
Write-Host "✓ 临时文件已清理" -ForegroundColor Green

Write-Host ""
Write-Host "[5/6] 重启 Docker Desktop..." -ForegroundColor Yellow
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Write-Host "正在等待 Docker Desktop 启动..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "[6/6] 验证 Docker 状态..." -ForegroundColor Yellow
try {
    $result = docker ps
    Write-Host "✓ Docker 运行正常" -ForegroundColor Green
} catch {
    Write-Host "⚠ Docker 可能还未完全启动，请稍后再试" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "清理完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示：" -ForegroundColor Cyan
Write-Host "- 定期运行此脚本可以保持 Docker 占用空间较小" -ForegroundColor Gray
Write-Host "- 可以使用 'docker system prune' 命令清理未使用的容器和镜像" -ForegroundColor Gray
Write-Host "- 建议在 Docker Desktop 设置中限制最大磁盘使用量" -ForegroundColor Gray
Write-Host ""
