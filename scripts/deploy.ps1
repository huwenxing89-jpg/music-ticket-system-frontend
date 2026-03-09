param(
    [string]$Server = $env:DEPLOY_SERVER,
    [string]$User = $env:DEPLOY_USER,
    [string]$DeployPath = $env:DEPLOY_PATH_PRODUCTION,
    [string]$Password = $env:DEPLOY_PASSWORD,
    [string]$LocalPath = ".\dist"
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "===== 静态文件部署到 Windows Server =====" "Cyan"
Write-ColorOutput ""

# 验证本地构建目录
if (-not (Test-Path $LocalPath)) {
    Write-ColorOutput "错误: 构建目录不存在: $LocalPath" "Red"
    Write-ColorOutput "请先运行: pnpm build" "Yellow"
    exit 1
}

Write-ColorOutput "部署配置:" "Green"
Write-ColorOutput "  服务器: $Server" "Gray"
Write-ColorOutput "  用户: $User" "Gray"
Write-ColorOutput "  路径: $DeployPath" "Gray"
Write-ColorOutput "  本地: $LocalPath" "Gray"
Write-ColorOutput ""

# 构建 SCP 命令（使用密码认证）
$scpCommand = "scp -o StrictHostKeyChecking=no -r $LocalPath/* ${User}@${Server}:`"$DeployPath`""

Write-ColorOutput "开始上传文件..." "Yellow"

# 使用密码执行 SCP（需要 sshpass 或手动输入密码）
if ($Password) {
    # Windows 上使用 plink (PuTTY) 或直接使用 SSH 密钥
    # 这里假设已配置 SSH 密钥
    $scpCommand = "scp -o StrictHostKeyChecking=no -r `$((Get-ChildItem -Path $LocalPath -Recurse -File).FullName -join ' ') ${User}@${Server}:`"$DeployPath`""
} else {
    # 没有密码，使用已配置的 SSH 密钥
    Invoke-Expression $scpCommand
}

Write-ColorOutput "文件上传完成!" "Green"
Write-ColorOutput ""
Write-ColorOutput "===== 部署完成 =====" "Cyan"
