# Test Resend Edge Function
$body = @{
    to = 'kurisuuuchannn@gmail.com'
    subject = 'MedCure Resend Test - Edge Function'
    html = '<h1>✅ Resend Integration Working!</h1><p>Your MedCure Resend email system via Supabase Edge Function is now properly configured and working perfectly!</p><ul><li>✅ Edge Function deployed</li><li>✅ API keys configured</li><li>✅ CORS handled</li><li>✅ Professional email delivery</li></ul>'
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZmZwa2xxc2NwenFjdWxmZm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTYxMjAsImV4cCI6MjA3Mjc5MjEyMH0.Ngqvdx1pR-Y8inZVgj-uHMBi3c9ZFUlsz_Fc3kDqyN4'
}

try {
    Write-Host "🧪 Testing Resend Edge Function..."
    $result = Invoke-RestMethod -Uri 'https://ccffpklqscpzqculffnd.supabase.co/functions/v1/send-notification-email' -Method Post -Headers $headers -Body $body
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host $result | ConvertTo-Json
}
catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}