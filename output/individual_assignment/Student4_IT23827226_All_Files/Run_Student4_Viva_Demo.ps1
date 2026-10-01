param(
    [switch]$Full
)

$ErrorActionPreference = "Stop"

$packageRoot = $PSScriptRoot
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $packageRoot "..\..\..")).Path
$python = Join-Path $repositoryRoot "backend\.venv\Scripts\python.exe"
$auditScript = Join-Path $packageRoot "05_Audit_Tools\student4_audit_runner.py"

if (-not (Test-Path -LiteralPath $python)) {
    throw "Backend Python environment was not found at: $python"
}

if (-not (Test-Path -LiteralPath $auditScript)) {
    throw "Student 4 audit script was not found at: $auditScript"
}

Write-Host ""
Write-Host "Midnight Intelligence Student 4 Viva Demonstration" -ForegroundColor Cyan
Write-Host "Information Retrieval and Security Assessment" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: local FastAPI TestClient with deterministic demo data"
Write-Host "External services: Supabase and OpenAI disabled"
Write-Host ""

if ($Full) {
    Write-Host "Step 1: Running the selected regression suite..." -ForegroundColor Yellow
    $tests = @(
        (Join-Path $repositoryRoot "backend\tests\test_grounding_contract.py"),
        (Join-Path $repositoryRoot "backend\tests\test_assignment_security_flow.py"),
        (Join-Path $repositoryRoot "backend\tests\test_scenario_routes.py"),
        (Join-Path $repositoryRoot "backend\tests\test_auth_routes.py"),
        (Join-Path $repositoryRoot "backend\tests\test_knowledge_datasets.py")
    )
    & $python -m pytest @tests -q
    if ($LASTEXITCODE -ne 0) {
        throw "Regression tests failed with exit code $LASTEXITCODE"
    }
    Write-Host ""
}

Write-Host "Running the 23-case Student 4 audit..." -ForegroundColor Yellow
& $python $auditScript
if ($LASTEXITCODE -ne 0) {
    throw "Student 4 audit failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Demonstration complete." -ForegroundColor Green
Write-Host "Note: FAIL and PARTIAL are expected audit findings, not script errors."
Write-Host "The updated JSON evidence is in 03_Evidence\student4_audit_results.json."
