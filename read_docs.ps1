Add-Type -AssemblyName System.IO.Compression.FileSystem

function Extract-DocxText($filePath) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()
    $xml = $xml -replace '<[^>]+>', ' '
    $xml = $xml -replace '&amp;', '&'
    $xml = $xml -replace '&lt;', '<'
    $xml = $xml -replace '&gt;', '>'
    $xml = $xml -replace '&quot;', '"'
    $xml = $xml -replace '\s+', ' '
    return $xml.Trim()
}

$conceptNote = Extract-DocxText 'C:\Users\hp\Desktop\National Training week\Concept Note for HU National Training Week.docx'
$conceptNote | Out-File -FilePath 'C:\Users\hp\Desktop\National Training week\concept_note.txt' -Encoding UTF8

$sysSpec = Extract-DocxText 'C:\Users\hp\Desktop\National Training week\HU_National_Training_Week_System_Professional_Updated.docx'
$sysSpec | Out-File -FilePath 'C:\Users\hp\Desktop\National Training week\sys_spec.txt' -Encoding UTF8

Write-Host "Done. Concept note length: $($conceptNote.Length), Sys spec length: $($sysSpec.Length)"
