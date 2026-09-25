# Stage 08 RBAC HTTP smoke — targeted verification only
$ErrorActionPreference = 'Continue'
$port = if ($env:SMOKE_API_PORT) { $env:SMOKE_API_PORT } else { '4000' }
$base = "http://localhost:$port/api/v1"
$users = @{
  ADMIN              = @{ email = 'demo.admin@example.local';     password = 'DemoAdmin1' }
  SALES_STAFF        = @{ email = 'demo.sales@example.local';     password = 'DemoSales1' }
  INVENTORY_MANAGER  = @{ email = 'demo.inventory@example.local'; password = 'DemoInv1' }
  CONTENT_MANAGER    = @{ email = 'demo.content@example.local';   password = 'DemoContent1' }
  CUSTOMER           = @{ email = 'demo.customer@example.local';  password = 'DemoCust1' }
}

function Login($email, $password) {
  $sess = $null
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $null = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body $body -SessionVariable sess
  return $sess
}

function StatusCode($sess, $method, $path, $bodyObj = $null) {
  try {
    $params = @{
      Uri = "$base$path"
      Method = $method
      WebSession = $sess
      UseBasicParsing = $true
    }
    if ($null -ne $bodyObj) {
      $params.ContentType = 'application/json'
      $params.Body = ($bodyObj | ConvertTo-Json -Depth 6)
    }
    $r = Invoke-WebRequest @params
    return [int]$r.StatusCode
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode) {
      return [int]$resp.StatusCode
    }
    # .NET Core style
    if ($_.ErrorDetails -and $_.ErrorDetails.Message -match '"statusCode"\s*:\s*(\d+)') {
      return [int]$Matches[1]
    }
    throw
  }
}

$script:results = New-Object System.Collections.Generic.List[string]
function Expect($label, $code, $okPattern) {
  $ok = $false
  if ($okPattern -eq '2xx') { $ok = ($code -ge 200 -and $code -lt 300) }
  elseif ($okPattern -eq '403') { $ok = ($code -eq 403) }
  elseif ($okPattern -eq '2xx_or_404') { $ok = (($code -ge 200 -and $code -lt 300) -or $code -eq 404) }
  $mark = if ($ok) { 'PASS' } else { 'FAIL' }
  $script:results.Add("$mark|$label|$code|$okPattern") | Out-Null
  Write-Output "$mark $label => $code (want $okPattern)"
}

try {
  $h = Invoke-WebRequest -Uri "$base/health" -UseBasicParsing
  if ([int]$h.StatusCode -ne 200) { throw "API not healthy: $($h.StatusCode)" }
} catch {
  Write-Output "SMOKE_RBAC_OVERALL=FAIL"
  Write-Output "REASON: API unreachable - $($_.Exception.Message)"
  exit 1
}

$sessions = @{}
foreach ($role in @('ADMIN','SALES_STAFF','INVENTORY_MANAGER','CONTENT_MANAGER','CUSTOMER')) {
  try {
    $sessions[$role] = Login $users[$role].email $users[$role].password
    Write-Output "LOGIN_OK $role"
  } catch {
    Write-Output "LOGIN_FAIL $role $($_.Exception.Message)"
    Write-Output "SMOKE_RBAC_OVERALL=FAIL"
    exit 1
  }
}

Expect 'ADMIN Dashboard' (StatusCode $sessions.ADMIN 'GET' '/admin/dashboard') '2xx'
Expect 'SALES Dashboard' (StatusCode $sessions.SALES_STAFF 'GET' '/admin/dashboard') '2xx'
Expect 'INV Dashboard' (StatusCode $sessions.INVENTORY_MANAGER 'GET' '/admin/dashboard') '2xx'
Expect 'CONTENT Dashboard' (StatusCode $sessions.CONTENT_MANAGER 'GET' '/admin/dashboard') '2xx'
Expect 'CUSTOMER Dashboard' (StatusCode $sessions.CUSTOMER 'GET' '/admin/dashboard') '403'

Expect 'ADMIN Orders' (StatusCode $sessions.ADMIN 'GET' '/admin/orders') '2xx'
Expect 'SALES Orders' (StatusCode $sessions.SALES_STAFF 'GET' '/admin/orders') '2xx'
Expect 'INV Orders' (StatusCode $sessions.INVENTORY_MANAGER 'GET' '/admin/orders') '2xx'
Expect 'CONTENT Orders' (StatusCode $sessions.CONTENT_MANAGER 'GET' '/admin/orders') '403'
Expect 'CUSTOMER Orders' (StatusCode $sessions.CUSTOMER 'GET' '/admin/orders') '403'

Expect 'ADMIN Audit' (StatusCode $sessions.ADMIN 'GET' '/admin/audit') '2xx'
Expect 'SALES Audit' (StatusCode $sessions.SALES_STAFF 'GET' '/admin/audit') '403'
Expect 'INV Audit' (StatusCode $sessions.INVENTORY_MANAGER 'GET' '/admin/audit') '403'
Expect 'CONTENT Audit' (StatusCode $sessions.CONTENT_MANAGER 'GET' '/admin/audit') '403'
Expect 'CUSTOMER Audit' (StatusCode $sessions.CUSTOMER 'GET' '/admin/audit') '403'

Expect 'ADMIN Inventory' (StatusCode $sessions.ADMIN 'GET' '/admin/inventory') '2xx'
Expect 'INV Inventory' (StatusCode $sessions.INVENTORY_MANAGER 'GET' '/admin/inventory') '2xx'
Expect 'SALES Inventory' (StatusCode $sessions.SALES_STAFF 'GET' '/admin/inventory') '403'
Expect 'CONTENT Inventory' (StatusCode $sessions.CONTENT_MANAGER 'GET' '/admin/inventory') '403'
Expect 'CUSTOMER Inventory' (StatusCode $sessions.CUSTOMER 'GET' '/admin/inventory') '403'

# Documented RBAC: SALES/INV may READ categories (R); only ADMIN/CONTENT manage (F)
Expect 'ADMIN Categories GET' (StatusCode $sessions.ADMIN 'GET' '/admin/categories') '2xx'
Expect 'CONTENT Categories GET' (StatusCode $sessions.CONTENT_MANAGER 'GET' '/admin/categories') '2xx'
Expect 'SALES Categories GET' (StatusCode $sessions.SALES_STAFF 'GET' '/admin/categories') '2xx'
Expect 'INV Categories GET' (StatusCode $sessions.INVENTORY_MANAGER 'GET' '/admin/categories') '2xx'
Expect 'CUSTOMER Categories GET' (StatusCode $sessions.CUSTOMER 'GET' '/admin/categories') '403'
$catBody = @{ name = 'Smoke Cat'; slug = "smoke-cat-$(Get-Random)" }
Expect 'ADMIN Category POST' (StatusCode $sessions.ADMIN 'POST' '/admin/categories' $catBody) '2xx'
Expect 'CONTENT Category POST' (StatusCode $sessions.CONTENT_MANAGER 'POST' '/admin/categories' @{ name = 'Smoke Cat 2'; slug = "smoke-cat2-$(Get-Random)" }) '2xx'
Expect 'SALES Category POST' (StatusCode $sessions.SALES_STAFF 'POST' '/admin/categories' $catBody) '403'
Expect 'INV Category POST' (StatusCode $sessions.INVENTORY_MANAGER 'POST' '/admin/categories' $catBody) '403'
Expect 'CUSTOMER Category POST' (StatusCode $sessions.CUSTOMER 'POST' '/admin/categories' $catBody) '403'

$fakeId = '00000000-0000-0000-0000-000000000001'
$weightBody = @{ weightPerCartonKg = '40' }
Expect 'CUSTOMER weight PATCH' (StatusCode $sessions.CUSTOMER 'PATCH' "/admin/products/$fakeId/inventory" $weightBody) '403'
Expect 'CONTENT weight PATCH' (StatusCode $sessions.CONTENT_MANAGER 'PATCH' "/admin/products/$fakeId/inventory" $weightBody) '403'
Expect 'SALES weight PATCH' (StatusCode $sessions.SALES_STAFF 'PATCH' "/admin/products/$fakeId/inventory" $weightBody) '403'
Expect 'INV weight PATCH authz' (StatusCode $sessions.INVENTORY_MANAGER 'PATCH' "/admin/products/$fakeId/inventory" $weightBody) '2xx_or_404'
Expect 'ADMIN weight PATCH authz' (StatusCode $sessions.ADMIN 'PATCH' "/admin/products/$fakeId/inventory" $weightBody) '2xx_or_404'

$fails = @($script:results | Where-Object { $_.StartsWith('FAIL') })
if ($fails.Count -gt 0) {
  Write-Output "SMOKE_RBAC_OVERALL=FAIL"
  $fails | ForEach-Object { Write-Output $_ }
  exit 1
}
Write-Output "SMOKE_RBAC_OVERALL=PASS"
exit 0
