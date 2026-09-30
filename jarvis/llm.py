"""
Cérebro do JARVIS — cliente LLM com function calling e memória de conversa.

Compatível com qualquer endpoint no formato OpenAI:
  - Groq (padrão, free tier)      -> https://api.groq.com/openai/v1
  - OpenAI                        -> https://api.openai.com/v1
  - OpenRouter                    -> https://openrouter.ai/api/v1
  - Ollama local                  -> http://localhost:11434/v1

A execução das ferramentas fica fora daqui: main.py injeta um "executor"
(callback) que roda a ação (pedindo confirmação por voz quando perigosa) e
devolve o resultado em texto para o modelo continuar o raciocínio.
"""

from __future__ import annotations

import json
import os
from collections.abc import Callable
from dataclasses import dataclass, field

import requests

from tools import TOOLS

# Personalidade: respostas curtas porque tudo é falado em voz alta.
PROMPT_SISTEMA = (
    "Você é o JARVIS, assistente de voz pessoal rodando no PC do usuário. "
    "Fale português brasileiro, de forma natural, breve e objetiva — suas "
    "respostas serão lidas em voz alta, então evite listas longas, markdown "
    "e emojis. Quando o pedido envolver uma ação no computador (abrir apps, "
    "ajustar volume/brilho, arquivos, mídia, comandos, energia, pesquisa na "
    "web, data/hora), use a ferramenta adequada em vez de explicar como fazer. "
    "Para ações perigosas (apagar_item, executar_comando, energia com "
    "desligar/reiniciar), apenas chame a ferramenta: o sistema pede "
    "confirmação por voz ao usuário. Se faltar informação essencial para "
    "chamar uma ferramenta, pergunte uma única pergunta curta."
)


@dataclass
class Conversa:
    """Memória do diálogo (contexto contínuo entre os turnos)."""

    historico: list[dict] = field(default_factory=list)
    limite: int = 16  # últimas N mensagens enviadas (economiza tokens)

    def __post_init__(self) -> None:
        if not self.historico:
            self.historico.append({"role": "system", "content": PROMPT_SISTEMA})

    def adicionar(self, papel: str, conteudo: str) -> None:
        self.historico.append({"role": papel, "content": conteudo})
        self._aparar()

    def adicionar_bruto(self, mensagem: dict) -> None:
        self.historico.append(mensagem)
        self._aparar()

    def _aparar(self) -> None:
        """Mantém a mensagem de sistema + as N mais recentes."""
        sistema = [m for m in self.historico if m["role"] == "system"]
        restantes = [m for m in self.historico if m["role"] != "system"]
        if len(restantes) > self.limite:
            restantes = restantes[-self.limite :]
        self.historico = sistema + restantes

    def mensagens(self) -> list[dict]:
        return self.historico


class Cerebro:
    def __init__(self) -> None:
        self.api_key = os.getenv("LLM_API_KEY", "").strip()
        self.base_url = os.getenv(
            "LLM_BASE_URL", "https://api.groq.com/openai/v1"
        ).rstrip("/")
        self.modelo = os.getenv("LLM_MODELO", "llama-3.3-70b-versatile")
        if not self.api_key:
            raise RuntimeError(
                "LLM_API_KEY ausente. Pegue uma chave grátis em "
                "https://console.groq.com e coloque no arquivo .env"
            )

    def _resolver_modelo(self) -> None:
        """
        O Groq troca nomes de modelos com o tempo. Se o configurado não
        existir (404 model_not_found), consulta a lista de modelos da conta
        e escolhe automaticamente o melhor Llama disponível.
        """
        resposta = requests.get(
            f"{self.base_url}/models",
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=15,
        )
        if resposta.status_code != 200:
            raise RuntimeError(
                f"Não consegui listar os modelos do provedor "
                f"({resposta.status_code}). Verifique LLM_MODELO no .env."
            )
        ids = [m.get("id", "") for m in resposta.json().get("data", [])]
        if not ids:
            raise RuntimeError("O provedor não devolveu nenhum modelo disponível.")

        # Preferência: Llama 70B 'versatile' -> qualquer Llama 3.3 -> qualquer Llama.
        for termo in (
            lambda i: "llama" in i and "70b" in i and "versatile" in i,
            lambda i: "llama-3.3" in i,
            lambda i: "llama" in i and "instruct" in i,
            lambda i: "llama" in i,
        ):
            escolhidos = [i for i in ids if termo(i)]
            if escolhidos:
                self.modelo = escolhidos[0]
                print(f"[jarvis] modelo do cérebro ajustado automaticamente: {self.modelo}")
                return
        self.modelo = ids[0]
        print(f"[jarvis] usando o modelo disponível: {self.modelo}")

    def _chamar_api(self, conversa: Conversa) -> dict:
        payload = {
            "model": self.modelo,
            "messages": conversa.mensagens(),
            "tools": TOOLS,
            "temperature": 0.4,
            "max_tokens": 500,
        }
        resposta = requests.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json=payload,
            timeout=30,
        )
        if resposta.status_code == 404 and "model_not_found" in resposta.text:
            # Nome do modelo defasado: resolve e tenta mais uma vez.
            self._resolver_modelo()
            payload["model"] = self.modelo
            resposta = requests.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json=payload,
                timeout=30,
            )
        if resposta.status_code != 200:
            raise RuntimeError(
                f"Erro do LLM ({resposta.status_code}): {resposta.text[:200]}"
            )
        return resposta.json()["choices"][0]["message"]

    def processar(
        self,
        conversa: Conversa,
        pergunta: str,
        executor: Callable[[str, dict], str],
        max_ferramentas: int = 3,
    ) -> tuple[str, list[dict]]:
        """
        Envia a conversa ao LLM e processa chamadas de ferramentas em ciclo:
        modelo chama -> executor roda -> resultado volta ao modelo -> resposta.
        Retorna (resposta_final, lista_de_chamadas_executadas).
        """
        conversa.adicionar("user", pergunta)
        chamadas: list[dict] = []

        for _ in range(max_ferramentas + 1):
            mensagem = self._chamar_api(conversa)

            # Caso 1: o modelo quer executar ferramentas.
            if mensagem.get("tool_calls"):
                conversa.adicionar_bruto(
                    {
                        "role": "assistant",
                        "content": mensagem.get("content") or "",
                        "tool_calls": mensagem["tool_calls"],
                    }
                )
                for chamada in mensagem["tool_calls"]:
                    nome = chamada["function"]["name"]
                    try:
                        argumentos = json.loads(
                            chamada["function"].get("arguments") or "{}"
                        )
                    except json.JSONDecodeError:
                        argumentos = {}
                    chamadas.append({"nome": nome, "argumentos": argumentos})

                    # Executa de verdade (com confirmação de perigosas em
                    # main.py) e devolve o resultado ao modelo.
                    try:
                        resultado_texto = executor(nome, argumentos)
                    except Exception as erro:  # nunca derruba o loop
                        resultado_texto = f"Erro ao executar: {erro}"
                    conversa.adicionar_bruto(
                        {
                            "role": "tool",
                            "tool_call_id": chamada["id"],
                            "content": resultado_texto[:1500],
                        }
                    )
                continue  # volta ao LLM com os resultados

            # Caso 2: resposta textual final.
            texto = (mensagem.get("content") or "").strip()
            conversa.adicionar("assistant", texto)
            return texto, chamadas

        return "Fiz as ações solicitadas.", chamadas
