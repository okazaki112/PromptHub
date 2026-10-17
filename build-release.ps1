# PromptHub 发布版构建脚本
# 用法：直接双击 build-release.cmd（推荐），或终端执行：
#   powershell -ExecutionPolicy Bypass -File .\build-release.ps1
#   pwsh -File .\build-release.ps1
# 流程：自检 NSIS 工具缓存 -> vite 构建 -> electron-builder 打 Windows x64 包
#       -> 瞬断自动重试 -> 复制到 .\发布版\<实际版本号>\
# 注意：本文件必须保存为 UTF-8 with BOM，否则 Windows PowerShell 5.1 无法解析中文

$ErrorActionPreference = 'Stop'

function Pause-IfInteractive {
    if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) {
        Read-Host '按回车键退出' | Out-Null
    }
}

# winCodeSign 缓存自愈：rcedit 工具缺失时从 npmmirror 下载并解压补齐。
# （app-builder 下载该工具直连 GitHub 不吃镜像；断网时图标写入静默失败，
# 产物保持 Electron 默认图标——见 2026-10 图标回归分析。）
function Invoke-WinCodeSignCacheSelfHeal {
    $root = Join-Path $env:LOCALAPPDATA 'electron-builder\Cache\winCodeSign'
    $dir = Join-Path $root 'winCodeSign-2.6.0'
    $rcedit = Join-Path $dir 'rcedit-x64.exe'
    if (Test-Path $rcedit) { return $true }

    Write-Host '==> 自检：winCodeSign 缓存缺失 rcedit，开始从 npmmirror 自愈' -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $sevenZip = Get-ChildItem (Join-Path $PSScriptRoot 'node_modules\.pnpm') -Recurse -Filter 7za.exe -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '\\x64\\' } | Select-Object -First 1
    if (-not $sevenZip) {
        Write-Host '   未找到 node_modules 内置 7za.exe，请先 pnpm install 后重跑' -ForegroundColor Red
        return $false
    }
    $pkg = Join-Path $env:TEMP 'winCodeSign-2.6.0.7z'
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri 'https://npmmirror.com/mirrors/electron-builder-binaries/winCodeSign-2.6.0/winCodeSign-2.6.0.7z' -OutFile $pkg -UseBasicParsing
        # darwin/ 内符号链接在 Windows 无特权下必失败且与 win 构建无关，排除之
        & $sevenZip.FullName x $pkg "-o$dir" '-y' '-x!darwin' | Out-Null
        if (Test-Path $rcedit) {
            Write-Host ('==> winCodeSign 自愈完成（rcedit-x64.exe ' + (Get-Item $rcedit).Length + ' 字节）') -ForegroundColor Green
            return $true
        }
        Write-Host '   解压后仍未见 rcedit-x64.exe，请手动清理该缓存目录后重试' -ForegroundColor Red
        return $false
    } catch {
        Write-Host ('   winCodeSign 自愈失败：' + $_.Exception.Message) -ForegroundColor Red
        return $false
    }
}

function Invoke-NsisCacheSelfHeal {
    # NSIS 工具缓存缺关键文件（典型：elevate.exe 被杀毒软件移走）时，
    # electron-builder 不会自动重建缓存、构建必然 ENOENT。
    # 处置：把残破版本目录改名移走（不删除，可回滚），触发下次构建重新下载。
    $cacheRoot = Join-Path $env:LOCALAPPDATA 'electron-builder\Cache\nsis'
    if (-not (Test-Path $cacheRoot)) { return $false }

    # 每个缓存目录按类型探活关键文件：主包看 elevate.exe，
    # 插件资源包看 plugins\x86-unicode\UAC.dll——任一缺失都会导致
    # 构建 ENOENT / Plugin not found，且 electron-builder 不自愈。
    function script:Get-NsisKeyFile($dirName) {
        if ($dirName -like 'nsis-resources-*') { return 'plugins\x86-unicode\UAC.dll' }
        if ($dirName -like 'nsis-*') { return 'elevate.exe' }
        return $null
    }
    $badDirs = @(
        Get-ChildItem $cacheRoot -Directory |
            Where-Object { $_.Name -like 'nsis-*' -and $_.Name -notlike '*.broken-*' } |
            Where-Object {
                $key = script:Get-NsisKeyFile $_.Name
                $key -and -not (Test-Path (Join-Path $_.FullName $key))
            }
    )
    foreach ($dir in $badDirs) {
        $stamp = Get-Date -Format 'yyyyMMddHHmmss'
        $movedName = $dir.FullName + ".broken-$stamp"
        Move-Item $dir.FullName $movedName -Force
        Write-Host ("==> 自检：NSIS 缓存 " + $dir.Name + " 缺少 elevate.exe，已移走待重建（备份名 " + $movedName + '）') -ForegroundColor Yellow
    }
    return ($badDirs.Count -gt 0)
}

try {
    Set-Location $PSScriptRoot

    # 1) 读取实际版本号（以 package.json 为准）
    $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
    Write-Host "==> 构建发布版 v$version" -ForegroundColor Cyan

    # 2) 前置工具检查
    foreach ($cmd in 'node', 'npx', 'pnpm') {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            throw "缺少命令 $cmd ，请确认已安装 Node.js / pnpm 并加入 PATH"
        }
    }

    # 3) 国内镜像源（Electron 与 builder 二进制）
    $env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
    $env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'

    # 3.5) winCodeSign 缓存自检（图标/版本信息写入依赖 rcedit，app-builder 拉取
    # 该工具时硬编码走 GitHub，不吃镜像环境变量；断网时构建会"成功"但 exe
    # 保持 Electron 默认图标。缺失时从 npmmirror 手动补齐。）
    Invoke-WinCodeSignCacheSelfHeal | Out-Null

    # 4) NSIS 缓存自检 + 构建 + 打包（瞬断自动重试一次）
    Invoke-NsisCacheSelfHeal | Out-Null

    $builderArgs = @(
        'electron-builder',
        '--config', 'electron-builder.config.cjs',
        '--win', '--x64', '--publish', 'never'
    )
    # 注意：曾长期携带 --config.win.signAndEditExecutable=false 用于绕开
    # winCodeSign 下载断网，但它同时禁用了 exe 图标/版本信息写入（装后
    # 程序显示 Electron 默认图标的根因）。winCodeSign 自愈函数已覆盖该
    # 断点，禁止再加回此参数。

    Push-Location apps/desktop
    try {
        npx vite build
        if ($LASTEXITCODE -ne 0) { throw "vite build 失败（退出码 $LASTEXITCODE）" }

        npx $builderArgs
        if ($LASTEXITCODE -ne 0) {
            Write-Host '==> 首次打包失败，执行缓存自检后重试一次...' -ForegroundColor Yellow
            Invoke-WinCodeSignCacheSelfHeal | Out-Null
            Invoke-NsisCacheSelfHeal | Out-Null
            npx $builderArgs
            if ($LASTEXITCODE -ne 0) {
                throw "electron-builder 打包失败（退出码 $LASTEXITCODE，已自动重试一次）"
            }
        }
    }
    finally {
        Pop-Location
    }

    # 5) 交付到 .\发布版\<版本号>\
    $outDir = Join-Path $PSScriptRoot "发布版\$version"
    New-Item -ItemType Directory -Force $outDir | Out-Null
    Get-ChildItem apps/desktop/dist -File |
        Where-Object { $_.Name -like "PromptHub-Setup-$version*" } |
        ForEach-Object { Copy-Item $_.FullName -Destination $outDir -Force }

    Write-Host "==> 完成，产物已放入：$outDir" -ForegroundColor Green
    Get-ChildItem $outDir | ForEach-Object { "    {0,8:N1} MB  {1}" -f ($_.Length / 1MB), $_.Name }
}
catch {
    Write-Host ('==> 构建失败：' + $_.Exception.Message) -ForegroundColor Red
    if ($_.Exception.Message -match 'elevate\.exe|electron-builder\\Cache|winCodeSign|rcedit') {
        Write-Host '   本脚本已自带 NSIS/winCodeSign 缓存自愈仍未恢复时，请手动清理缓存目录后重跑：' -ForegroundColor Yellow
        Write-Host ("   rd /s /q `"$env:LOCALAPPDATA\electron-builder\Cache\nsis`"") -ForegroundColor Yellow
        Write-Host ("   rd /s /q `"$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign`"") -ForegroundColor Yellow
        Write-Host '   并把 %LOCALAPPDATA%\electron-builder 加入 Windows 安全中心排除项（根治隔离问题）。' -ForegroundColor Yellow
    }
    if ($_.InvocationInfo.PositionMessage) {
        Write-Host $_.InvocationInfo.PositionMessage -ForegroundColor DarkGray
    }
    exit 1
}
finally {
    Pause-IfInteractive
}
