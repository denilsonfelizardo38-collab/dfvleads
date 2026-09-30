"""
Wake word do JARVIS — três modos, escolhidos automaticamente:

Modo 1 (preferido): Porcupine "Jarvis" — precisão alta, requer chave grátis
  do Picovoice no .env (PICOVOICE_ACCESS_KEY).

Modo 2 (padrão sem chave): openWakeWord "Hey Jarvis" — open source, SEM
  conta e SEM chave; baixa o modelo pré-treinado na primeira execução.

Modo 3 (fallback): teclado — ENTER acorda o JARVIS, para nunca bloquear.

Design comum: UMA thread com escuta contínua.
  - pausar()/retomar() -> surdo temporário (JARVIS não se auto-ativa com a
    própria voz nem dispara com áudio antigo do buffer).
  - aguardar()         -> bloqueia até uma detecção (usar com asyncio.to_thread).
"""

from __future__ import annotations

import os
import threading
import time

import sounddevice as sd


# ═══════════════════════════════════════════════════════════════════════
# Modo 1 — Porcupine ("Jarvis" por voz)
# ═══════════════════════════════════════════════════════════════════════

class DetectorWakeWord:
    def __init__(self) -> None:
        import pvporcupine

        access_key = os.getenv("PICOVOICE_ACCESS_KEY", "").strip()
        if not access_key:
            raise RuntimeError(
                "PICOVOICE_ACCESS_KEY ausente. Crie uma grátis em "
                "https://console.picovoice.ai e coloque no arquivo .env"
            )
        self.porcupine = pvporcupine.create(
            access_key=access_key,
            keywords=["jarvis"],  # modelo embutido, sem treinamento
        )
        self.descricao_gatilho = "'Jarvis'"
        self.frame_length = self.porcupine.frame_length
        self.sample_rate = self.porcupine.sample_rate  # sempre 16000

        self.pausado = False
        self._detectado = threading.Event()
        self._parar = threading.Event()
        self._thread: threading.Thread | None = None

    # ── Ciclo de vida ──────────────────────────────────────────────────

    def iniciar(self) -> None:
        self._thread = threading.Thread(target=self._loop_escuta, daemon=True)
        self._thread.start()

    def fechar(self) -> None:
        self._parar.set()
        if self._thread:
            self._thread.join(timeout=2)
        self.porcupine.delete()

    # ── Controle ───────────────────────────────────────────────────────

    def pausar(self) -> None:
        self.pausado = True

    def retomar(self) -> None:
        self.pausado = False

    def aguardar(self) -> None:
        self._detectado.wait()
        self._detectado.clear()

    # ── Loop interno ───────────────────────────────────────────────────

    def _loop_escuta(self) -> None:
        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype="int16",
            blocksize=self.frame_length,
        ) as stream:
            while not self._parar.is_set():
                audio, _ = stream.read(self.frame_length)
                if self.pausado:
                    continue  # descarta o áudio sem processar
                pcm = audio.flatten()
                if self.porcupine.process(pcm) >= 0:
                    self._detectado.set()


# ═══════════════════════════════════════════════════════════════════════
# Modo 3 — Teclado (ENTER acorda o JARVIS; sem conta, sem chave)
# ═══════════════════════════════════════════════════════════════════════

class DetectorOpenWakeWord:
    """Usa o modelo pré-treinado 'hey_jarvis' da openWakeWord (open source)."""

    def __init__(self, limiar: float | None = None) -> None:
        from openwakeword.model import Model
        from openwakeword.utils import download_models

        if limiar is None:
            # Ajustável pelo config.json (wake_limiar) ou variável OWW_LIMIAR.
            limiar = float(os.getenv("OWW_LIMIAR", "0.35"))

        # O modelo 'hey_jarvis' NÃO vem na instalação: baixa agora (uma vez,
        # ~2 MB, direto do repositório oficial da openWakeWord).
        try:
            download_models(model_names=["hey_jarvis"])
        except Exception as erro:
            print(f"[jarvis] aviso ao baixar modelo da wake word: {erro}")

        self.modelo = Model(
            wakeword_models=["hey_jarvis"], inference_framework="onnx"
        )
        self.limiar = limiar
        self.sample_rate = 16000
        self.frame_length = 1280  # 80 ms — passo recomendado da openWakeWord
        self.descricao_gatilho = "'Hey Jarvis'"

        self.pausado = False
        self._detectado = threading.Event()
        self._parar = threading.Event()
        self._thread: threading.Thread | None = None

    def iniciar(self) -> None:
        self._thread = threading.Thread(target=self._loop_escuta, daemon=True)
        self._thread.start()

    def fechar(self) -> None:
        self._parar.set()
        if self._thread:
            self._thread.join(timeout=2)

    def pausar(self) -> None:
        self.pausado = True

    def retomar(self) -> None:
        self.pausado = False

    def aguardar(self) -> None:
        self._detectado.wait()
        self._detectado.clear()

    def _loop_escuta(self) -> None:
        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype="int16",
            blocksize=self.frame_length,
        ) as stream:
            while not self._parar.is_set():
                audio, _ = stream.read(self.frame_length)
                if self.pausado:
                    continue
                # openWakeWord recebe float32 (-1..1) por frame.
                pcm = audio.flatten().astype("float32") / 32768.0
                pontuacoes = self.modelo.predict(pcm)
                if pontuacoes and max(pontuacoes.values()) >= self.limiar:
                    self.modelo.reset()  # evita disparos em cadeia
                    self._detectado.set()


class DetectorTeclado:
    """Mesma interface dos demais, mas acorda com ENTER."""

    def __init__(self) -> None:
        self.pausado = False
        self._detectado = threading.Event()
        self._parar = threading.Event()
        self._thread: threading.Thread | None = None

    def iniciar(self) -> None:
        self._thread = threading.Thread(target=self._loop_teclas, daemon=True)
        self._thread.start()

    def fechar(self) -> None:
        self._parar.set()
        if self._thread:
            self._thread.join(timeout=2)

    def pausar(self) -> None:
        self.pausado = True

    def retomar(self) -> None:
        self.pausado = False

    def aguardar(self) -> None:
        self._detectado.wait()
        self._detectado.clear()

    def _loop_teclas(self) -> None:
        try:
            import msvcrt  # exclusivo do Windows

            usa_msvcrt = True
        except ImportError:
            usa_msvcrt = False

        if usa_msvcrt:
            while not self._parar.is_set():
                if msvcrt.kbhit():
                    tecla = msvcrt.getch()
                    if self.pausado:
                        continue  # descarta teclas apertadas fora de hora
                    if tecla in (b"\r", b"\n"):  # ENTER
                        self._detectado.set()
                time.sleep(0.05)
        else:
            # Fallback multiplataforma: lê linhas do terminal.
            while not self._parar.is_set():
                entrada = input()
                if not self.pausado and entrada.strip() == "":
                    self._detectado.set()


# ═══════════════════════════════════════════════════════════════════════
# Fábrica — escolhe o modo disponível
# ═══════════════════════════════════════════════════════════════════════

def criar_detector():
    """
    Ordem de preferência:
      1. Porcupine (voz, precisa de chave)  -> se PICOVOICE_ACCESS_KEY existir
      2. openWakeWord (voz, sem chave)      -> padrão sem chave
      3. Teclado (ENTER)                    -> se a biblioteca não instalar
    """
    if os.getenv("PICOVOICE_ACCESS_KEY", "").strip():
        print("[jarvis] wake word: Porcupine ('Jarvis')")
        return DetectorWakeWord()

    try:
        detector = DetectorOpenWakeWord()
        print("[jarvis] wake word: openWakeWord ('Hey Jarvis') — sem chave, open source")
        return detector
    except Exception as erro:
        print(
            f"[jarvis] openWakeWord indisponível ({erro}) — usando MODO TECLADO.\n"
            "         Pressione ENTER para acordar o JARVIS."
        )
        return DetectorTeclado()
