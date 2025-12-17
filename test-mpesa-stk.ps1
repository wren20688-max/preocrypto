# PowerShell script to test the M-PESA STK push endpoint

$body = @{
  phone = "254700000001"  # Replace with your test phone number
  amount = 100
  account_id = "testuser"
  token = "testtoken"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/payment/mpesa-stk" -Method Post -Body $body -ContentType "application/json"

Write-Host "Response from /api/payment/mpesa-stk:" -ForegroundColor Cyan
$response | ConvertTo-Json -Depth 5 | Write-Host
