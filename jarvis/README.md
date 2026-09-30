# JARVIS — assistente de voz para Windows

Assistente estilo "Homem de Ferro": ouve **"Jarvis"**, entende português, executa ações no PC e responde falado. 100% gratuito (Groq + Whisper local + edge-tts + Porcupine free).

```
"Jarvis" (bip) -> você fala -> Whisper transcreve -> LLM decide -> ação executa -> JARVIS responde em voz
```

## O que ele faz

| Comando (exemplo) | O que acontece |
|---|---|
| "Jarvis… abre o Chrome" | Abre o navegador |
| "Jarvis… que horas são?" | Responde falado |
| "Jarvis… volume em trinta" | Ajusta o volume |
| "Jarvis… aumenta o brilho" | Brilho +15 |
| "Jarvis… pesquisa quem ganhou o jogo ontem" | Busca na web e resume em voz |
| "Jarvis… lista os arquivos da pasta Documentos" | Lê o conteúdo em voz |
| "Jarvis… crie uma pasta teste" | Cria pasta |
| "Jarvis… toca música" | Play/pause/próxima (teclas de mídia) |
| "Jarvis… execute ipconfig" | **Pede confirmação por voz** -> roda e resume |
| "Jarvis… desliga o PC" | **Confirma por voz** -> desliga em 60s ("Jarvis, cancela" aborta) |
| "Jarvis… bloqueia a tela" | Bloqueia o Windows |

Conversa contínua: depois da primeira chamada, você continua falando **sem repetir "Jarvis"** até o diálogo esfriar. Fale por cima dele (barge-in) para interromper.

---

## Instalação no Windows (passo a passo)

### 1. Python 3.11 ou 3.12

```powershell
winget install Python.Python.3.12
```
Feche e reabra o PowerShell. Teste: `python --version`.

### 2. Criar a pasta do projeto e o ambiente virtual

```powershell
cd caminho\para\jarvis
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

> Se o PowerShell bloquear a ativação: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` e tente de novo.

### 3. Instalar as dependências

```powershell
pip install -r requirements.txt
```

*(A primeira instalação do `faster-whisper` baixa também o `ctranslate2` — pode levar alguns minutos.)*

### 4. Chaves de API

**Wake word — 3 opções automáticas (sem configuração, usa a 1ª disponível):**
1. **Porcupine 'Jarvis'** — se você tiver a chave grátis do [Picovoice](https://console.picovoice.ai) (às vezes o cadastro recusa emails pessoais; nesse caso ignore)
2. **openWakeWord 'Hey Jarvis'** — **padrão sem chave nenhuma**, open source; baixa o modelo na 1ª execução ✅ *recomendado se o Picovoice recusar seu email*
3. **Teclado (ENTER)** — fallback final se nenhuma anterior instalar

> Você só precisa configurar algo se quiser o Porcupine; sem chave, o sistema usa o openWakeWord sozinho.

**a) (Opcional) Picovoice:**
1. Crie conta em [console.picovoice.ai](https://console.picovoice.ai)
2. Em **Access Key** -> copie a chave

**b) Cérebro (Groq):**
1. Crie conta em [console.groq.com](https://console.groq.com)
2. **API Keys** -> **Create API Key** -> copie

**c) Configure o `.env`:**
```powershell
copy .env.example .env
notepad .env
```
Cole as duas chaves nos campos indicados e salve.

### 5. Microfone (permissão do Windows)

Configurações -> Privacidade e segurança -> Microfone -> permitir apps clássicos.

### 6. Rodar!

```powershell
python main.py
```

Na primeira execução o Whisper baixa o modelo (~460 MB, uma vez só). Quando aparecer "aguardando a wake word", diga **"Jarvis"** — você ouvirá um bip — e fale o comando. **Ctrl+C** encerra.

---

## Solução de problemas

| Problema | Solução |
|---|---|
| `PICOVOICE_ACCESS_KEY ausente` | Preencheu o `.env`? Ele está na pasta `jarvis/`? |
| **Picovoice nega meu email / não chega verificação** | Sem problema: o JARVIS entra automaticamente no **modo teclado** (ENTER acorda ele). Para tentar de novo: use "Sign up with Google", confira o spam do Outlook, ou use um Gmail |
| Não acorda com "Jarvis" | Fale a ~30 cm do microfone; teste o mic no Windows; verifique se o dispositivo padrão é o correto |
| Corta o fim das frases | Em `.env`, aumente `VAD_LIMIAR` (ex.: 0.004) |
| Demora a parar de gravar | Diminua `VAD_LIMIAR` (ex.: 0.012) |
| Resposta lenta | Em `config.json`, use `"whisper_modelo": "base"` (mais rápido, menos preciso) |
| Sem som na resposta | edge-tts precisa de internet (só a síntese; o resto continua local) |
| Erro de volume/brilho | Confirme que os drivers de áudio/vídeo estão atualizados |

## Custo total: R$ 0,00

- openWakeWord: open source, sem cadastro ✅
- Groq: free tier generoso ✅
- Whisper: local ✅
- edge-tts: grátis ✅

---

## Fase 2 — voz fluida estilo ChatGPT (roadmap)

- **Streaming duplo**: trocar o ciclo gravar->transcrever->pensar->falar por pipelines em streaming (Whisper streaming + TTS por frases), reduzindo a latência para <1s.
- **Realtime API** (OpenAI) ou **Gemini Live**: voz-em-voz nativa com interrupção instantânea — a experiência exata do modo de voz do ChatGPT.
- **VAD neural** (`silero-vad`): substitui o limiar de energia, robusto em ambientes barulhentos.
- **Echo cancellation**: permitir que o JARVIS ouça enquanto fala sem se "auto-interrupmir".

## Fase 3 — controle do celular Android

- **Tasker + AutoRemote**: o JARVIS faz requisições HTTP para o Tasker do celular -> abrir apps, enviar SMS, tocar alarme, localizar o aparelho.
- **ADB via Wi-Fi**: comandos diretos (`adb shell input …`) para automação sem instalar nada no celular.
- **Notificações espelhadas**: notificações do Android aparecem e são lidas pelo JARVIS no PC (KDE Connect protocol).
