"""
Texto -> voz em português brasileiro com edge-tts (grátis, vozes neurais
da Microsoft) + reprodução com suporte a barge-in (interromper a fala
do assistente apenas falando mais alto).
"""

from __future__ import annotations

import asyncio
import os
import tempfile
import wave

import numpy as np
import sounddevice as sd

VOZ_PADRAO = "pt-BR-AntonioNeural"  # masculina; alternativa: pt-BR-FranciscaNeural


class Locutor:
    def __init__(
        self,
        voz: str | None = None,
        limiar_barge_in: float = 0.05,
        barge_in: bool = True,
    ) -> None:
        self.voz = voz or os.getenv("TTS_VOZ", VOZ_PADRAO)
        # Energia RMS acima da qual consideramos que o usuário está falando
        # por cima (barge-in).
        self.limiar_barge_in = limiar_barge_in
        self.barge_in_ativo = barge_in

    def sintetizar(self, texto: str) -> str:
        """Gera o MP3 do texto e devolve o caminho (função síncrona)."""
        import edge_tts

        caminho = os.path.join(tempfile.gettempdir(), "jarvis_voz.mp3")
        comunicar = edge_tts.Communicate(texto, self.voz)
        asyncio.run(comunicar.save(caminho))
        return caminho

    def _tocar_mp3_com_barge_in(self, caminho_mp3: str) -> bool:
        """
        Decodifica o MP3 para PCM e toca em blocos, monitorando o microfone.
        Retorna True se o usuário interrompeu (barge-in).
        """
        import miniaudio

        decodificado = miniaudio.decode_file(caminho_mp3)
        amostras = np.frombuffer(decodificado.samples, dtype=np.int16)
        if decodificado.nchannels > 1:
            amostras = amostras.reshape(-1, decodificado.nchannels).mean(axis=1)
        amostras = amostras.astype(np.int16)

        taxa = decodificado.sample_rate
        bloco = taxa // 10  # 100 ms
        interrompido = False
        # Exige fala sustentada (~400 ms acima do limiar) para não se
        # interromper com o próprio eco nas caixas de som.
        blocos_loudos_necessarios = 4
        blocos_loudos = 0

        # Stream de saída (fala) + entrada (microfone p/ detectar barge-in).
        with sd.OutputStream(samplerate=taxa, channels=1, dtype="int16") as saida, \
             sd.InputStream(samplerate=16000, channels=1, dtype="int16",
                            blocksize=512) as entrada:
            for inicio in range(0, len(amostras), bloco):
                trecho = amostras[inicio : inicio + bloco]
                saida.write(trecho.reshape(-1, 1))

                if self.barge_in_ativo:
                    # Lê ~100 ms do microfone e mede a energia.
                    mic, _ = entrada.read(512 * 3)
                    mono = mic.flatten().astype(np.float32) / 32768.0
                    energia = float(np.sqrt(np.mean(mono**2)))
                    if energia > self.limiar_barge_in:
                        blocos_loudos += 1
                        if blocos_loudos >= blocos_loudos_necessarios:
                            interrompido = True
                            saida.stop()  # corta a fala imediatamente
                            break
                    else:
                        blocos_loudos = 0
        return interrompido

    def falar(self, texto: str) -> bool:
        """Sintetiza e fala. Retorna True se foi interrompido (barge-in)."""
        if not texto.strip():
            return False
        try:
            caminho = self.sintetizar(texto)
        except Exception:
            # Sem internet o edge-tts falha; segue o baile em silêncio.
            return False
        try:
            return self._tocar_mp3_com_barge_in(caminho_mp3=caminho)
        except Exception:
            # Fallback: toca sem monitorar microfone (usa player do sistema).
            os.startfile(caminho)
            import time
            time.sleep(min(10, len(texto) / 15))
            return False
