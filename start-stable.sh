#!/bin/bash

# Script para executar DeepNote de forma estável no Arch Linux
# Resolve problemas de travamento e erros do GLib/Electron

echo "🚀 Iniciando DeepNote (modo estável para Arch Linux)..."

# Definir variáveis de ambiente para estabilidade
export ELECTRON_DISABLE_SECURITY_WARNINGS=true
export ELECTRON_ENABLE_LOGGING=false
export ELECTRON_NO_ATTACH_CONSOLE=true
export ELECTRON_DISABLE_GPU=false
export ELECTRON_ENABLE_GPU=true

# Configurações específicas para Arch Linux
export GDK_BACKEND=x11
export XDG_CURRENT_DESKTOP=GNOME
export DISPLAY=${DISPLAY:-:0}

# Limpar cache do Electron se necessário
if [ "$1" = "--clear-cache" ]; then
    echo "🧹 Limpando cache do Electron..."
    rm -rf ~/.config/deepnote
    rm -rf ~/.cache/deepnote
fi

# Compilar CSS primeiro
echo "🎨 Compilando CSS..."
npx tailwindcss -i ./src/style.css -o ./src/output.css --minify

# Verificar se a compilação foi bem-sucedida
if [ $? -ne 0 ]; then
    echo "❌ Erro na compilação do CSS"
    exit 1
fi

echo "✅ CSS compilado com sucesso"

# Executar Electron com configurações otimizadas
echo "🖥️  Iniciando aplicação..."
electron . \
    --no-sandbox \
    --disable-dev-shm-usage \
    --disable-gpu-sandbox \
    --disable-software-rasterizer \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-features=TranslateUI \
    --disable-ipc-flooding-protection \
    --disable-extensions \
    --disable-default-apps \
    --disable-web-security \
    --disable-features=VizDisplayCompositor \
    --enable-logging=stderr \
    --log-level=2 \
    2>/dev/null

echo "👋 DeepNote finalizado"
