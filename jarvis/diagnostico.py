"""
Diagnóstico de microfone e wake word do JARVIS.

Rode:  python diagnostico.py

Faz 3 testes em sequência:
  1. Lista os dispositivos de áudio (mostra qual microfone está em uso)
  2. Grava 3 segundos e toca de volta (você ouve se o mic funciona)
  3. Monitor ao vivo: fale "Hey Jarvis" e veja a pontuação (score) subindo
     — use esse número para ajustar o limiar no config.json (wake_limiar).
"""

from __future__ import annotations

import wave

import numpy as np
import sounddevice as sd

TAXA = 16000
FRAME = 1280  # 80 ms — passo da openWakeWord


def teste_1_dispositivos() -> None:
    print("=" * 60)
    print("TESTE 1 — dispositivos de áudio")
    print("=" * 60)
    try:
        padrao = sd.default.device[0]
        nome = sd.query_devices(padrao)["name"]
        print(f"Microfone padrão [{padrao}]: {nome}")
        outros = [
            f"  [{i}] {d['name']} (entradas: {d['max_input_channels']})"
            for i, d in enumerate(sd.query_devices())
            if d["max_input_channels"] > 0
        ]
        print("Outros dispositivos com entrada:")
        print("\n".join(outros) or "  (nenhum)")
    except Exception as erro:
        print(f"Erro ao listar dispositivos: {erro}")


def teste_2_grava_e_toca() -> None:
    print()
    print("=" * 60)
    print("TESTE 2 — gravação de 3 segundos e reprodução")
    print("=" * 60)
    print("Fale alguma coisa agora (3 segundos)…")
    with sd.InputStream(samplerate=TAXA, channels=1, dtype="int16") as stream:
        gravado, _ = stream.read(TAXA * 3)
    audio = gravado.flatten()
    energia = np.sqrt(np.mean((audio.astype("float32") / 32768) ** 2))
    print(f"Energia média da gravação: {energia:.4f} "
          f"({'OK, tem sinal' if energia > 0.005 else 'MUITO BAIXO — microfone baixo ou truncado'})")
    print("▶️  Tocando de volta… (você deve ouvir a própria voz)")
    sd.play(audio, TAXA)
    sd.wait()
    # Salva para inspeção manual, se quiser ouvir depois.
    with wave.open("teste_mic.wav", "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(TAXA)
        wav.writeframes(audio.tobytes())
    print("Salvei em teste_mic.wav (pode abrir e ouvir).")


def teste_3_wake_word(limiar: float) -> None:
    print()
    print("=" * 60)
    print(f"TESTE 3 — monitor da wake word (limiar atual: {limiar})")
    print("=" * 60)
    from openwakeword.model import Model
    from openwakeword.utils import download_models

    print("Baixando/verificando o modelo 'hey_jarvis'…")
    download_models(model_names=["hey_jarvis"])
    modelo = Model(wakeword_models=["hey_jarvis"], inference_framework="onnx")
    print("✅ Modelo carregado! Fale 'Hey Jarvis' algumas vezes (Ctrl+C para sair).")

    maior = 0.0
    with sd.InputStream(samplerate=TAXA, channels=1, dtype="int16", blocksize=FRAME) as stream:
        while True:
            audio, _ = stream.read(FRAME)
            pcm = audio.flatten().astype("float32") / 32768.0
            pontuacoes = modelo.predict(pcm)
            score = max(pontuacoes.values()) if pontuacoes else 0.0
            maior = max(maior, score)
            barra = "#" * int(min(50, score * 50))
            print(
                f"score={score:.2f} | maior={maior:.2f} | {barra:<50}",
                end="\r",
                flush=True,
            )
            if score >= limiar:
                print(f"\n✅ ACORDARIA! score={score:.2f} ≥ limiar {limiar}")
                maior = 0.0


def main() -> None:
    import json
    import os

    limiar = float(os.getenv("OWW_LIMIAR", "0.35"))
    if os.path.exists("config.json"):
        with open("config.json", encoding="utf-8") as arquivo:
            config = json.load(arquivo)
        limiar = float(config.get("wake_limiar", limiar))

    teste_1_dispositivos()
    teste_2_grava_e_toca()
    try:
        teste_3_wake_word(limiar)
    except KeyboardInterrupt:
        print("\n\nDiagnóstico encerrado.")


if __name__ == "__main__":
    main()
