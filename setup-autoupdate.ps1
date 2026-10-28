# Для работы без интернет-хостинга: регистрирует задачи в Планировщике Windows (без окна консоли).
#   «Навигатор: новости» — update-news.mjs при входе и каждые 30 минут
#   «Навигатор: сайты»   — check-pages.mjs раз в день
# Если сайт выложен на GitHub Pages, это не нужно: всё делает .github/workflows/update.yml
# Удалить: Unregister-ScheduledTask -TaskName "Навигатор: новости","Навигатор: сайты" -Confirm:$false
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = (Get-Command node -ErrorAction Stop).Source
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
function Task($name, $script, $triggers) {
  $action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument "--headless `"$node`" `"$dir\$script`"" -WorkingDirectory $dir
  Register-ScheduledTask -TaskName $name -Action $action -Trigger $triggers -Settings $settings -Description "Навигатор поступления: $script" -Force | Out-Null
  Start-ScheduledTask -TaskName $name
}
Task "Навигатор: новости" "update-news.mjs" @(
  (New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)),
  (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME))
Task "Навигатор: сайты" "check-pages.mjs" @((New-ScheduledTaskTrigger -Daily -At 9am))
Write-Output "Готово: новости каждые 30 минут, проверка сайтов приёма каждый день в 9:00"
