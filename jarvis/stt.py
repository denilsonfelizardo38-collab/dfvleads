"""
Voz -> texto local com faster-whisper.

Grava o microfone até o silêncio (VAD por energia) e transcreve em
português. O modelo 'small' equilibra precisão e velocidade em CPUs comuns.
"""

from __future__ import annotations

import os
import wave

import numpy as np
import sounddevice as sd

SAMPLE_RATE = 16000
CANALIS = 1
LARGURA = 2  # int16


class Transcritor:
    def __init__(self, modelo: str = "small", idioma: str = "pt") -> None:
        from faster_whisper import WhisperModel

        # device="auto" usa GPU se houver; compute_type="int8" reduz
        # memória e mantém boa precisão também em CPU.
        self.modelo = WhisperModel(modelo, device="auto", compute_type="int8")
        self.idioma = idioma

    def gravar_fala(self, silencio_ms: int = 1200, max_seg: int = 12) -> str:
        """
        Grava até detectar ~1,2s de silêncio (ou max_seg segundos) e
        devolve o caminho do WAV temporário. VAD simples por energia RMS.
        """
        import tempfile

        limiar = float(os.getenv("VAD_LIMIAR", "0.008"))
        blocos_silencio = int(silencio_ms / 1000 * SAMPLE_RATE / 512)
        max_blocos = int(max_seg * SAMPLE_RATE / 512)

        gravados: list[np.ndarray] = []
        silencio_seguido = 0
        ja_falou = False

        with sd.InputStream(
            samplerate=SAMPLE_RATE, channels=CANALIS, dtype="int16", blocksize=512
        ) as stream:
            while len(gravados) < max_blocos:
                audio, _ = stream.read(512)
                amostras = audio.flatten().astype(np.float32) / 32768.0
                energia = float(np.sqrt(np.mean(amostras**2)))

                gravados.append(audio.flatten().copy())
                if energia > limiar:
                    silencio_seguido = 0
                    ja_falou = True
                else:
                    silencio_seguido += 1
                    # Para ao completar o silêncio depois de ter ouvido fala.
                    if ja_falou and silencio_seguido >= blocos_silencio:
                        break

        if not ja_falou:
            return ""

        wav_path = os.path.join(tempfile.gettempdir(), "jarvis_fala.wav")
        with wave.open(wav_path, "wb") as wav:
            wav.setnchannels(CANALIS)
            wav.setsampwidth(LARGURA)
            wav.setframerate(SAMPLE_RATE)
            wav.writeframes(np.concatenate(gravados).tobytes())
        return wav_path

    def transcrever(self, wav_path: str) -> str:
        if not wav_path:
            return ""
        segmentos, _info = self.modelo.transcribe(
            wav_path, language=self.idioma, beam_size=1  # beam=1 = mais rápido
        )
        return " ".join(s.text.strip() for s in segmentos).strip()

    def escutar_comando(self) -> str:
        """Fluxo completo: grava a fala e devolve o texto."""
        caminho = self.gravar_fala()
        return self.transcrever(caminho)
