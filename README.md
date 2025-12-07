# DeepNote 📝

**Gerenciador local de notas com timer de produtividade e sistema de tarefas integrado**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 Visão Geral

DeepNote é uma aplicação desktop desenvolvida em **Electron** que combina um editor de notas com um sistema avançado de gerenciamento de tarefas e timer Pomodoro. Cada nota possui sua própria seção de tarefas com controle de tempo individual, oferecendo uma experiência integrada e profissional.

## ✨ Funcionalidades Principais

### 📝 **Sistema de Notas**
- **Editor de texto** com auto-save configurável
- **Tema escuro/claro** com sincronização automática
- **Lixeira** com restauração de notas excluídas
- **Armazenamento local** seguro em JSON
- **Interface responsiva** adaptável a qualquer tela

### ⏱️ **Timer Pomodoro Integrado**
- **Timer de 25 minutos** com indicador visual circular
- **Controle global** no cabeçalho da aplicação
- **Estados**: Trabalho → Pausa → Repetição
- **Notificações** sonoras e visuais

### 🏗️ **Sistema de Tarefas Kanban**
- **Tarefas específicas por nota** com contexto integrado
- **Três colunas**: Backlog → Em Progresso → Concluído
- **Drag & Drop** entre colunas
- **Timer individual** para cada tarefa
- **Tempo manual** adicional com histórico
- **Persistência** entre sessões

### 🎨 **Interface Profissional**
- **Design Notion-style** com ícones Lucide
- **Cards expansíveis/recolhidos** para otimização de espaço
- **Animações suaves** e feedback visual
- **Responsividade completa** (Mobile/Tablet/Desktop)
- **Modais interativos** para configurações avançadas

## 🚀 Como Executar

### **Pré-requisitos**
- **Node.js** >= 18.0.0
- **npm** ou **yarn**
- **Sistema operacional**: Linux ou Windows

### **Instalação e Execução**

```bash
# Clone o repositório
git clone <repository-url>
cd deepnote

# Instale as dependências
npm install

# Modo desenvolvimento (recomendado)
npm run dev
# ou use o script otimizado para Linux
./start-dev.sh

# Modo produção
npm start
```

### **Scripts Disponíveis**

```bash
# Desenvolvimento com hot-reload CSS
npm run dev

# Desenvolvimento com logs detalhados
npm run dev:verbose

# Compilação CSS apenas
npm run dev:css

# Produção
npm start

# Build para distribuição
npm run dist
```

## 🏗️ Estrutura do Projeto

```
deepnote/
├── src/                    # Código fonte principal
│   ├── index.html         # Interface principal
│   ├── renderer.js        # Lógica do frontend
│   ├── task-manager.js    # Sistema de tarefas
│   ├── icons.js          # Ícones Lucide
│   ├── style.css         # Estilos base
│   └── output.css        # CSS compilado (Tailwind)
├── build/                 # Recursos de build
│   └── icons/            # Ícones da aplicação
├── dist/                 # Arquivos de distribuição
├── main.js               # Processo principal Electron
├── preload.js            # Script de ponte segura
├── package.json          # Configurações e dependências
├── tailwind.config.js    # Configuração Tailwind CSS
└── start-dev.sh          # Script de desenvolvimento Linux
```

## 🐧 Build no Linux

### **Desenvolvimento**
```bash
# Configurações automáticas para Linux
export GDK_BACKEND=x11
export ELECTRON_DISABLE_SECURITY_WARNINGS=true
export DISABLE_WAYLAND=1

# Executar
./start-dev.sh
```

### **Build de Distribuição**
```bash
# Gerar executáveis Linux
npm run dist

# Arquivos gerados em dist/:
# - DeepNote-1.0.0.AppImage    (Executável universal)
# - deepnote_1.0.0_amd64.deb   (Pacote Debian/Ubuntu)
# - linux-unpacked/            (Arquivos descompactados)
```

### **Instalação no Sistema**
```bash
# Via AppImage (recomendado)
chmod +x DeepNote-1.0.0.AppImage
./DeepNote-1.0.0.AppImage

# Via pacote .deb
sudo dpkg -i deepnote_1.0.0_amd64.deb
sudo apt-get install -f  # Resolver dependências se necessário
```

## 💾 Armazenamento de Dados

- **Localização**: `~/.config/deepnote/deepnote-notes.json`
- **Formato**: JSON estruturado
- **Backup automático**: Recomendado backup manual do arquivo
- **Estrutura**:
  ```json
  {
    "notes": [...],     // Notas ativas
    "trash": [...]      // Notas excluídas
  }
  ```

## 🔧 Tecnologias Utilizadas

- **[Electron](https://electronjs.org/)** - Framework desktop multiplataforma
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário
- **[Lucide](https://lucide.dev/)** - Biblioteca de ícones
- **[UUID](https://www.npmjs.com/package/uuid)** - Geração de IDs únicos
- **[Electron Store](https://github.com/sindresorhus/electron-store)** - Persistência de dados

## 📱 Responsividade

- **Mobile** (≤768px): Layout de coluna única, sidebar full-width
- **Tablet** (769-1024px): Grid de 2 colunas, sidebar 250px
- **Desktop** (≥1025px): Grid de 3 colunas, sidebar 280px

## 🎯 Atalhos de Teclado

- **Ctrl + N**: Nova tarefa
- **Ctrl + T**: Ver tarefas
- **Enter**: Salvar tarefa
- **Esc**: Cancelar/Fechar modal

## 📄 Licença

Este projeto está licenciado sob a **MIT License**.

## 👨‍💻 Autor

**Bernardo** - Desenvolvedor principal

---

**DeepNote** - Produtividade e organização em uma única aplicação! 🚀
