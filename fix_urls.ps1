$srcDir = "d:\Semester5\SWP391\SWP_Project\frontEnd\src"
$oldUrl = "http://localhost:8081"
$newUrl = '${import.meta.env.VITE_API_URL}'

Get-ChildItem -Path $srcDir -Recurse -Include "*.jsx","*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match [regex]::Escape($oldUrl)) {
        $newContent = $content.Replace($oldUrl, $newUrl)
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.Name)"
    }
}
