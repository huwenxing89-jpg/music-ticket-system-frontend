param(
    [string]$HealthUrl = $env:HEALTH_URL,
    [int]$MaxRetries = 10,
    [int]$RetryInterval = 5
)

# 颜色输出
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "===== 健康检查 =====" "Cyan"
Write-ColorOutput "检查 URL: $HealthUrl" "Gray"
Write-ColorOutput ""

# 使用 PowerShell 进行 HTTP 请求
for ($i = 1; $i -le $MaxRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 10
        $statusCode = $response.StatusCode

        if ($statusCode -eq 200) {
            Write-ColorOutput "健康检查通过! (HTTP $statusCode)" "Green"
            exit 0
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }

    Write-ColorOutput "尝试 $i/$MaxRetries: HTTP $statusCode，重试中..." "Yellow"
    Start-Sleep -Seconds $RetryInterval
}

Write-ColorOutput "健康检查失败!" "Red"
exit 1
