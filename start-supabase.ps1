$env:Path = [System.Environment]::GetEnvironmentVariable('Path','User') + ';' + [System.Environment]::GetEnvironmentVariable('Path','Machine')
Set-Location "G:\Daniel Rabi\Dev\Clientes\Ouse Passar\ouse-passar-monorepo"
supabase start
