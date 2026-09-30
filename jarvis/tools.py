"""
Schemas das ferramentas (function calling / tool use) que o LLM pode chamar.

Formato padrão OpenAI "tools" — aceito por Groq, OpenAI, OpenRouter e Ollama.
A execução real de cada uma está em actions.py.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "abrir_app",
            "description": "Abre um programa instalado ou um site no PC. Ex.: 'chrome', 'spotify', 'youtube.com'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "alvo": {
                        "type": "string",
                        "description": "Nome do programa ou endereço do site (ex.: 'chrome', 'calculadora', 'youtube.com').",
                    }
                },
                "required": ["alvo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fechar_app",
            "description": "Fecha um programa que está rodando (força o encerramento).",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome": {"type": "string", "description": "Nome do programa, ex.: 'chrome', 'spotify'."}
                },
                "required": ["nome"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pesquisar_web",
            "description": "Pesquisa na internet e devolve títulos e resumos dos resultados. Use antes de responder perguntas sobre fatos atuais.",
            "parameters": {
                "type": "object",
                "properties": {
                    "consulta": {"type": "string", "description": "Termos da busca."}
                },
                "required": ["consulta"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "volume",
            "description": "Controla o volume do sistema: definir nível, mudo, ativar som ou consultar status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "acao": {
                        "type": "string",
                        "enum": ["definir", "mudo", "ativar_som", "status"],
                        "description": "O que fazer com o volume.",
                    },
                    "nivel": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 100,
                        "description": "Nível de 0 a 100 (obrigatório para 'definir').",
                    },
                },
                "required": ["acao"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "brilho",
            "description": "Controla o brilho da tela: definir valor absoluto, aumentar ou diminuir.",
            "parameters": {
                "type": "object",
                "properties": {
                    "acao": {
                        "type": "string",
                        "enum": ["definir", "aumentar", "diminuir"],
                        "description": "Operação de brilho.",
                    },
                    "nivel": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 100,
                        "description": "Valor absoluto (definir) ou delta (aumentar/diminuir, padrão 15).",
                    },
                },
                "required": ["acao"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "listar_pasta",
            "description": "Lista arquivos e pastas de um diretório.",
            "parameters": {
                "type": "object",
                "properties": {
                    "caminho": {
                        "type": "string",
                        "description": "Caminho da pasta. Use '.' para a pasta atual do projeto.",
                    }
                },
                "required": ["caminho"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_pasta",
            "description": "Cria uma pasta (e as pastas do caminho, se não existirem).",
            "parameters": {
                "type": "object",
                "properties": {
                    "caminho": {"type": "string", "description": "Caminho completo da nova pasta."}
                },
                "required": ["caminho"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "mover_item",
            "description": "Move ou renomeia um arquivo/pasta.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origem": {"type": "string", "description": "Caminho atual do item."},
                    "destino": {
                        "type": "string",
                        "description": "Caminho final (se for uma pasta existente, move para dentro dela).",
                    },
                },
                "required": ["origem", "destino"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "apagar_item",
            "description": "Apaga um arquivo ou pasta (vai para a lixeira). AÇÃO PERIGOSA — o sistema pedirá confirmação por voz.",
            "parameters": {
                "type": "object",
                "properties": {
                    "caminho": {"type": "string", "description": "Caminho do item a apagar."}
                },
                "required": ["caminho"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "executar_comando",
            "description": "Executa um comando no Windows (PowerShell/cmd) e devolve a saída. AÇÃO PERIGOSA — o sistema pedirá confirmação por voz.",
            "parameters": {
                "type": "object",
                "properties": {
                    "comando": {"type": "string", "description": "Comando a executar."}
                },
                "required": ["comando"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "tocar_midia",
            "description": "Controla mídia: tocar um arquivo/URL, pausar/continuar, próxima ou anterior.",
            "parameters": {
                "type": "object",
                "properties": {
                    "acao": {
                        "type": "string",
                        "enum": ["tocar", "pausar", "continuar", "proxima", "anterior"],
                        "description": "Operação de mídia.",
                    },
                    "alvo": {
                        "type": "string",
                        "description": "Caminho do arquivo ou URL para 'tocar' (opcional — sem alvo, alterna play/pause).",
                    },
                },
                "required": ["acao"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "energia",
            "description": "Desligar/reiniciar o PC (AÇÃO PERIGOSA com confirmação por voz), bloquear a tela ou cancelar um desligamento agendado.",
            "parameters": {
                "type": "object",
                "properties": {
                    "acao": {
                        "type": "string",
                        "enum": ["desligar", "reiniciar", "bloquear", "cancelar_desligamento"],
                        "description": "Operação de energia.",
                    }
                },
                "required": ["acao"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "data_hora",
            "description": "Retorna a data e a hora atuais. Use quando o usuário perguntar que horas são ou que dia é hoje.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]
