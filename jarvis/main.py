"""
JARVIS — assistente de voz pessoal (estilo Homem de Ferro) para Windows.

Fluxo:
  wake word "Jarvis" -> grava comando (fala) -> transcreve (Whisper local)
  -> LLM com function calling decide/executa ações -> responde por voz
  (edge-tts) -> ouve continuação sem precisar da wake word (conversa fluida,
  com barge-in ao falar por cima).

Execute:  python main.py      (Ctrl+C para sair)
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

from dotenv import load_dotenv

from actions import ActionResult, executar_acao
from llm import Conversa, Cerebro
from stt import Transcritor
from tts import Locutor
from wake_word import DetectorTeclado, criar_detector

ARQUIVO_CONFIG = "config.json"

# Ferramentas que exigem confirmação por voz antes de rodar.
ACOES_PERIGOSAS = {"apagar_item", "executar_comando"}
ENERGIA_PERIGOSA = {"desligar", "reiniciar"}

CONFIRMAR_SIM = ("sim", "claro", "pode", "confirmo", "isso", "manda", "ok")
CONFIRMAR_NAO = ("não", "nao", "cancela", "cancelar", "para", "negativo")


def carregar_config() -> dict:
    """Lê config.json e aplica valores no ambiente (VAD_LIMIAR, TTS_VOZ)."""
    padrao: dict = {}
    if os.path.exists(ARQUIVO_CONFIG):
        with open(ARQUIVO_CONFIG, encoding="utf-8") as arquivo:
            padrao = json.load(arquivo)
    if padrao.get("vad_limiar") is not None:
        os.environ["VAD_LIMIAR"] = str(padrao["vad_limiar"])
    if padrao.get("wake_limiar") is not None:
        os.environ["OWW_LIMIAR"] = str(padrao["wake_limiar"])
    return padrao


def bip(freq_hz: int = 880, duracao_s: float = 0.09) -> None:
    """Feedback sonoro curto (o PC 'entendeu' que você chamou)."""
    import numpy as np
    import sounddevice as sd

    taxa = 44100
    tempos = np.linspace(0, duracao_s, int(taxa * duracao_s), False)
    onda = (np.sin(freq_hz * 2 * np.pi * tempos) * 32767 * 0.4).astype("int16")
    try:
        sd.play(onda, taxa)
        sd.wait()
    except Exception:
        pass  # sem áudio de feedback, segue o jogo


def valor_ou_falha(resultado: ActionResult) -> str:
    """Serializa o resultado da ação para o LLM continuar o raciocínio."""
    partes = [f"ok={resultado.ok}", f"fala='{resultado.mensagem}'"]
    if resultado.dados:
        partes.append(f"dados='{resultado.dados}'")
    return "; ".join(partes)


class Jarvis:
    def __init__(self, config: dict) -> None:
        self.config = config
        self.locutor = Locutor(
            voz=config.get("tts_voz"),
            barge_in=bool(config.get("barge_in", True)),
        )
        print("[jarvis] carregando Whisper (primeira vez baixa o modelo)…")
        self.transcritor = Transcritor(
            modelo=config.get("whisper_modelo", "small")
        )
        print("[jarvis] conectando ao cérebro (LLM)…")
        self.cerebro = Cerebro()
        self.conversa = Conversa()
        self.detector: DetectorWakeWord | None = None

    # ── Voz ───────────────────────────────────────────────────────────

    def falar(self, texto: str) -> bool:
        """Fala o texto; retorna True se o usuário interrompeu (barge-in)."""
        print(f"JARVIS: {texto}")
        return self.locutor.falar(texto)

    def escutar(self) -> str:
        """Grava e transcreve um comando de voz."""
        return self.transcritor.escutar_comando()

    # ── Confirmação de ações perigosas ────────────────────────────────

    def _confirmar_por_voz(self, descricao: str) -> bool:
        self.falar(f"Você tem certeza que deseja {descricao}? Diga sim ou não.")
        resposta = self.escutar().lower()
        print(f"você (confirmação): {resposta!r}")
        if any(palavra in resposta for palavra in CONFIRMAR_SIM):
            return True
        if any(palavra in resposta for palavra in CONFIRMAR_NAO):
            return False
        self.falar("Não entendi a confirmação. Vou cancelar por segurança.")
        return False

    def executor(self, nome: str, argumentos: dict) -> str:
        """Chamado pelo LLM para executar uma ferramenta (com segurança)."""
        perigosa = nome in ACOES_PERIGOSAS
        if nome == "energia" and argumentos.get("acao") in ENERGIA_PERIGOSA:
            perigosa = True

        if perigosa:
            descricao = json.dumps(argumentos, ensure_ascii=False)
            if not self._confirmar_por_voz(f"executar {nome}: {descricao}"):
                return valor_ou_falha(
                    ActionResult(False, "Ação cancelada pelo usuário.")
                )

        resultado = executar_acao(nome, argumentos)
        return valor_ou_falha(resultado)

    # ── Um turno de conversa ──────────────────────────────────────────

    async def processar_comando(self, texto: str) -> None:
        # Intenções locais que não precisam do LLM.
        if any(palavra in texto.lower() for palavra in ("cancela", "cancelar desligamento")):
            resultado = executar_acao("energia", {"acao": "cancelar_desligamento"})
            await asyncio.to_thread(self.falar, resultado.mensagem)
            return

        try:
            resposta, chamadas = await asyncio.to_thread(
                self.cerebro.processar, self.conversa, texto, self.executor
            )
        except Exception as erro:
            print(f"[jarvis] erro no cérebro: {erro}")
            await asyncio.to_thread(
                self.falar, "Tive um problema para pensar agora. Repita, por favor."
            )
            return

        if chamadas:
            for chamada in chamadas:
                print(f"ação: {chamada['nome']} {chamada['argumentos']}")
        elif not resposta:
            resposta = "Não entendi, repita por favor."

        if resposta:
            # Se o usuário interromper a resposta, já cai na escuta direta
            # abaixo (conversa contínua, sem exigir "Jarvis" de novo).
            interrompido = await asyncio.to_thread(self.falar, resposta)
            if interrompido:
                print("[jarvis] barge-in! ouvindo de imediato…")
                seguimento = await asyncio.to_thread(self.escutar)
                if seguimento:
                    print(f"você: {seguimento}")
                    await self.processar_comando(seguimento)

    # ── Loop principal ────────────────────────────────────────────────

    async def rodar(self) -> None:
        self.detector = criar_detector()
        self.detector.iniciar()
        await asyncio.to_thread(
            self.falar, "Jarvis online. Diga Jarvis quando precisar de mim."
        )
        gatilho = getattr(self.detector, "descricao_gatilho", "'Jarvis'")
        if isinstance(self.detector, DetectorTeclado):
            gatilho = "ENTER (modo teclado)"
        print(f"[jarvis] aguardando {gatilho} (Ctrl+C para sair)…")

        while True:
            # Bloqueia (em thread separada) até a thread do Porcupine sinalizar.
            await asyncio.to_thread(self.detector.aguardar)

            # Fica "surdo" enquanto atende: drena o buffer e evita que o eco
            # da própria voz ou áudio antigo dispare uma nova detecção.
            self.detector.pausar()

            bip()
            print("[jarvis] acordei — ouvindo o comando…")

            # Escuta o comando (gravação + Whisper) fora do event loop.
            comando = await asyncio.to_thread(self.escutar)
            print(f"você: {comando or '(silêncio)'}")

            if not comando:
                await asyncio.to_thread(
                    self.falar, "Não escutei nada. Diga Jarvis quando quiser falar."
                )
            else:
                await self.processar_comando(comando)

            # Terminou o turno: volta a escutar a wake word.
            self.detector.retomar()
            print("[jarvis] aguardando…")

    def encerrar(self) -> None:
        if self.detector:
            self.detector.fechar()


async def principal() -> None:
    load_dotenv()
    config = carregar_config()

    try:
        jarvis = Jarvis(config)
    except RuntimeError as erro:  # chaves ausentes — mensagem clara
        print(f"\n[jarvis] {erro}")
        sys.exit(1)

    try:
        await jarvis.rodar()
    except KeyboardInterrupt:
        print("\n[jarvis] encerrando… até mais!")
    finally:
        jarvis.encerrar()


if __name__ == "__main__":
    asyncio.run(principal())
