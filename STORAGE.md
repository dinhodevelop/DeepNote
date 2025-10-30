# Armazenamento de Dados - DeepNote

## Onde as notas são salvas?

O DeepNote usa um sistema de armazenamento personalizado baseado em **arquivos JSON** para armazenar as notas localmente no seu sistema.

### Localização dos dados:

**Linux:** `~/.config/deepnote/`
**Windows:** `%APPDATA%/deepnote/`
**macOS:** `~/Library/Application Support/deepnote/`

### Arquivo de configuração:

As notas são salvas no arquivo: `deepnote-notes.json`

### Estrutura dos dados:

```json
{
  "notes": [
    {
      "id": "unique-id",
      "title": "Título da nota",
      "content": "Conteúdo da nota...",
      "created": 1698765432000,
      "updated": 1698765432000
    }
  ]
}
```

### Como funciona:

1. **Persistência**: Os dados são salvos automaticamente no disco
2. **Segurança**: Arquivos ficam na pasta do usuário com permissões adequadas
3. **Backup**: Você pode fazer backup copiando o arquivo JSON
4. **Restauração**: Cole o arquivo de backup na pasta para restaurar notas

### Comandos úteis:

```bash
# Ver onde estão os dados (Linux)
ls -la ~/.config/deepnote/

# Fazer backup das notas
cp ~/.config/deepnote/deepnote-notes.json ~/backup-notas.json

# Restaurar backup
cp ~/backup-notas.json ~/.config/deepnote/deepnote-notes.json
```

### Desenvolvimento:

Durante o desenvolvimento (`npm run dev`), as notas são salvas no mesmo local e persistem entre execuções do aplicativo.
