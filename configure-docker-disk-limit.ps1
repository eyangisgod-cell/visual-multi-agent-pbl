# Docker 磁盘限制配置脚本
# 配置 Docker Desktop 磁盘使用上限，避免 VHDX 文件无限增长

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker 磁盘限制配置工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Docker Desktop 的配置文件路径
$settingsPath = "$env:APPDATA\Docker\settings.json"

Write-Host "[1/3] 检查 Docker Desktop 配置..." -ForegroundColor Yellow

if (Test-Path $settingsPath) {
    Write-Host "  配置文件：$settingsPath" -ForegroundColor Gray
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    Write-Host "✓ 配置文件已找到" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "当前配置：" -ForegroundColor Cyan
    
    if ($settings.settings) {
        $currentSettings = $settings.settings
        
        # 显示磁盘限制
        if ($null -ne $currentSettings.diskSizeMiB) {
            $diskSizeGB = [math]::Round($currentSettings.diskSizeMiB / 1024, 2)
            Write-Host "  磁盘大小限制：${diskSizeGB}GB" -ForegroundColor $(if ($diskSizeGB -gt 50) {"Yellow"} else {"Green"})
        } else {
            Write-Host "  磁盘大小限制：未设置（默认无限制）" -ForegroundColor Red
        }
        
        # 显示其他相关配置
        if ($null -ne $currentSettings.diskPath) {
            Write-Host "  磁盘路径：$($currentSettings.diskPath)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  未找到 settings 节点" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ 配置文件不存在，Docker Desktop 可能还未初始化" -ForegroundColor Yellow
    Write-Host "  路径：$settingsPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/3] 配置磁盘限制..." -ForegroundColor Yellow
Write-Host ""
Write-Host "推荐的磁盘大小限制：" -ForegroundColor White
Write-Host "  1. 30GB - 轻度使用（开发环境，少量镜像）" -ForegroundColor Gray
Write-Host "  2. 50GB - 中度使用（常规开发，多个项目）" -ForegroundColor Gray
Write-Host "  3. 80GB - 重度使用（大量镜像和容器）" -ForegroundColor Gray
Write-Host "  4. 100GB - 非常重度使用" -ForegroundColor Gray
Write-Host ""

$sizeChoice = Read-Host "选择磁盘限制 (输入数字 30/50/80/100，或自定义 GB 数，按 Enter 跳过)"
$diskSizeGB = $null

if ([string]::IsNullOrWhiteSpace($sizeChoice)) {
    Write-Host "  跳过配置" -ForegroundColor Yellow
} elseif ([int]::TryParse($sizeChoice, [ref]$null)) {
    $diskSizeGB = [int]$sizeChoice
} else {
    Write-Host "  无效输入，跳过配置" -ForegroundColor Yellow
}

if ($null -ne $diskSizeGB) {
    Write-Host ""
    Write-Host "注意：Docker Desktop 的设置需要通过 GUI 修改" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请按照以下步骤手动设置：" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. 打开 Docker Desktop" -ForegroundColor White
    Write-Host "  2. 点击右上角的 ⚙️ 设置图标" -ForegroundColor White
    Write-Host "  3. 选择 'Resources' 标签" -ForegroundColor White
    Write-Host "  4. 找到 'Disk image size' 滑块" -ForegroundColor White
    Write-Host "  5. 拖动到 ${diskSizeGB}GB" -ForegroundColor White
    Write-Host "  6. 点击 'Apply & Restart'" -ForegroundColor White
    Write-Host ""
    
    $openDocker = Read-Host "现在打开 Docker Desktop 设置？(y/n)"
    if ($openDocker -eq "y" -or $openDocker -eq "Y") {
        # 尝试打开 Docker Desktop 设置
        Start-Process "docker://settings/resources"
        Write-Host "  已尝试打开设置，如果未打开请手动操作" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[3/3] 创建自动清理任务（可选）..." -ForegroundColor Yellow
Write-Host ""

$scheduleChoice = Read-Host "是否创建每周自动清理任务？(y/n)"
if ($scheduleChoice -eq "y" -or $scheduleChoice -eq "Y") {
    $taskName = "Docker Weekly Cleanup"
    $scriptPath = "e:\my-project\visual-multi-agent-pbl\optimize-docker-vhdx.ps1"
    
    Write-Host "  创建计划任务：$taskName" -ForegroundColor Gray
    Write-Host "  执行脚本：$scriptPath" -ForegroundColor Gray
    Write-Host "  频率：每周日凌晨 2 点" -ForegroundColor Gray
    
    # 创建计划任务
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2am
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -ErrorAction Stop
        Write-Host "  ✓ 计划任务已创建" -ForegroundColor Green
        Write-Host ""
        Write-Host "  提示：可以在 '任务计划程序' 中查看和管理此任务" -ForegroundColor Gray
    } catch {
        Write-Host "  ✗ 创建失败：$($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  请确保以管理员身份运行此脚本" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 最佳实践总结：" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 已配置/建议的配置：" -ForegroundColor Green
Write-Host "  • 设置磁盘大小限制（防止 VHDX 无限增长）" -ForegroundColor White
Write-Host "  • 定期清理未使用的镜像和容器" -ForegroundColor White
Write-Host "  • 使用 .dockerignore 文件" -ForegroundColor White
Write-Host "  • 定期运行优化脚本" -ForegroundColor White
Write-Host ""
Write-Host "🔄 日常清理命令：" -ForegroundColor Cyan
Write-Host "  docker system prune -a -f --volumes" -ForegroundColor White
Write-Host "  docker builder prune -a -f" -ForegroundColor White
Write-Host ""
Write-Host "📊 查看磁盘使用：" -ForegroundColor Cyan
Write-Host "  docker system df" -ForegroundColor White
Write-Host ""
