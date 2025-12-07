#!/bin/bash

# Script para iniciar o DeepNote em modo desenvolvimento
# com configurações otimizadas para Linux

# Configurações de ambiente para resolver problemas do GLib
export ELECTRON_DISABLE_SECURITY_WARNINGS=true
export ELECTRON_ENABLE_LOGGING=false
export ELECTRON_NO_ATTACH_CONSOLE=true

# Configurações específicas para sistemas Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    export GDK_BACKEND=x11
    export ELECTRON_OZONE_PLATFORM_HINT=auto
    export DISABLE_WAYLAND=1
fi

# Executar o comando de desenvolvimento
npm run dev
