"""
Execução real das ações no Windows.

Cada função devolve um ActionResult com mensagem em português pronta para
ser falada. Ações perigosas (apagar, comando de sistema, desligar/reiniciar)
passam antes por uma confirmação falada tratada no main.py.
"""

from __future__ import annotations

import ctypes
import os
import subprocess
import webbrowser
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ActionResult:
    ok: bool
    mensagem: str          # frase curta para falar em voz alta
    dados: str = ""        # texto extra para o LLM (ex.: saída de comando, resultados)


# ── Aplicativos ────────────────────────────────────────────────────────

# Apelidos reconhecidos -> comando/URI do Windows.
APPS: dict[str, str] = {
    "chrome": "start chrome",
    "google": "start https://www.google.com",
    "youtube": "start https://www.youtube.com",
    "whatsapp": "start https://web.whatsapp.com",
    "spotify": "start spotify:",
    "netflix": "start https://www.netflix.com",
    "calculadora": "start calc",
    "calc": "start calc",
    "bloco de notas": "start notepad",
    "notepad": "start notepad",
    "explorador": "start explorer",
    "configuracoes": "start ms-settings:",
    "configurações": "start ms-settings:",
    "vscode": "start code",
    "visual studio code": "start code",
    "discord": "start discord:",
    "steam": "start steam:",
}


def abrir_app(alvo: str) -> ActionResult:
    alvo = alvo.strip().lower()
    # Se parece com um endereço/site, abre no navegador padrão.
    if "." in alvo and " " not in alvo and "\\" not in alvo:
        url = alvo if alvo.startswith("http") else f"https://{alvo}"
        webbrowser.open(url)
        return ActionResult(True, f"Abrindo {alvo} no navegador.")
    comando = APPS.get(alvo, f"start {alvo}")
    os.system(comando)  # 'start' resolve apps instalados pelo Windows
    return ActionResult(True, f"Abrindo {alvo}.")


def fechar_app(nome: str) -> ActionResult:
    nome = nome.strip().lower().replace(".exe", "")
    codigo = subprocess.run(
        ["taskkill", "/f", "/im", f"{nome}.exe"],
        capture_output=True, text=True,
    )
    if codigo.returncode == 0:
        return ActionResult(True, f"Fechando {nome}.")
    return ActionResult(False, f"Não encontrei o programa {nome} rodando.")


# ── Pesquisa na web ────────────────────────────────────────────────────

def pesquisar_web(consulta: str) -> ActionResult:
    """Busca no DuckDuckGo (sem API key) e devolve resultados para o LLM resumir."""
    try:
        try:
            from duckduckgo_search import DDGS  # pacote antigo
        except ImportError:
            from ddgs import DDGS  # pacote renomeado nas versões novas

        with DDGS() as buscador:
            resultados = list(
                buscador.text(consulta, max_results=5, region="br-pt")
            )
    except Exception as erro:  # sem internet, pacote ausente, rate limit...
        return ActionResult(False, "Tive um problema para pesquisar na internet.",
                             dados=str(erro))

    if not resultados:
        return ActionResult(True, "Não encontrei resultados para essa pesquisa.")

    # Monta bloco de texto que vai para o LLM montar o resumo falado.
    partes = [
        f"{i+1}. {r.get('title', '')} — {r.get('body', '')} ({r.get('href', '')})"
        for i, r in enumerate(resultados)
    ]
    return ActionResult(
        True,
        f"Encontrei {len(resultados)} resultados sobre {consulta}.",
        dados="\n".join(partes),
    )


# ── Volume (pycaw) ─────────────────────────────────────────────────────

def _controlador_volume():
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume

    alto_falantes = AudioUtilities.GetSpeakers()
    interface = alto_falantes.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    return cast(interface, POINTER(IAudioEndpointVolume))


def volume(acao: str, nivel: int | None = None) -> ActionResult:
    try:
        controlador = _controlador_volume()
    except Exception:
        return ActionResult(False, "Não consegui acessar o controle de volume.")

    if acao == "definir":
        if nivel is None:
            return ActionResult(False, "Diga também o nível do volume.")
        controlador.SetMasterVolumeLevelScalar(max(0, min(100, nivel)) / 100, None)
        return ActionResult(True, f"Volume em {nivel} por cento.")

    if acao == "mudo":
        controlador.SetMute(1, None)
        return ActionResult(True, "Som mudo.")

    if acao == "ativar_som":
        controlador.SetMute(0, None)
        return ActionResult(True, "Som ativado.")

    if acao == "status":
        atual = round(controlador.GetMasterVolumeLevelScalar() * 100)
        mudo = bool(controlador.GetMute())
        estado = "mudo" if mudo else f"{atual} por cento"
        return ActionResult(True, f"Volume está em {estado}.")

    return ActionResult(False, "Ação de volume desconhecida.")


# ── Brilho da tela ─────────────────────────────────────────────────────

def brilho(acao: str, nivel: int | None = None) -> ActionResult:
    try:
        import screen_brightness_control as sbc
    except Exception:
        return ActionResult(False,
                            "Controle de brilho não disponível neste computador.")

    try:
        if acao == "definir":
            if nivel is None:
                return ActionResult(False, "Diga também o nível do brilho.")
            sbc.set_brightness(max(0, min(100, nivel)))
            return ActionResult(True, f"Brilho em {nivel} por cento.")

        if acao in ("aumentar", "diminuir"):
            delta = nivel if nivel else 15
            atual = sbc.get_brightness()
            valor = atual[0] if isinstance(atual, list) else atual
            novo = valor + delta if acao == "aumentar" else valor - delta
            novo = max(0, min(100, novo))
            sbc.set_brightness(novo)
            verbo = "Aumentei" if acao == "aumentar" else "Diminuí"
            return ActionResult(True, f"{verbo} o brilho para {novo} por cento.")
    except Exception as erro:
        return ActionResult(False, "Falha ao ajustar o brilho.", dados=str(erro))

    return ActionResult(False, "Ação de brilho desconhecida.")


# ── Arquivos e pastas ──────────────────────────────────────────────────

def listar_pasta(caminho: str) -> ActionResult:
    caminho = os.path.expanduser(caminho)
    if not os.path.isdir(caminho):
        return ActionResult(False, f"A pasta {caminho} não existe.")
    try:
        nomes = sorted(os.listdir(caminho), key=str.lower)
    except PermissionError:
        return ActionResult(False, "Sem permissão para acessar essa pasta.")

    pastas = [n for n in nomes if os.path.isdir(os.path.join(caminho, n))]
    arquivos = [n for n in nomes if n not in pastas]

    linhas = [f"[pasta] {p}/" for p in pastas]
    for a in arquivos:
        try:
            kb = os.path.getsize(os.path.join(caminho, a)) // 1024
            linhas.append(f"[arquivo] {a} ({kb} KB)")
        except OSError:
            linhas.append(f"[arquivo] {a}")

    visiveis = linhas[:40]
    if len(linhas) > 40:
        visiveis.append(f"… e mais {len(linhas) - 40} itens")

    resumo = f"{len(pastas)} pasta(s) e {len(arquivos)} arquivo(s)."
    return ActionResult(True, resumo, dados="\n".join(visiveis))


def criar_pasta(caminho: str) -> ActionResult:
    try:
        os.makedirs(os.path.expanduser(caminho), exist_ok=True)
        return ActionResult(True, f"Pasta {caminho} pronta.")
    except Exception as erro:
        return ActionResult(False, "Não consegui criar a pasta.", dados=str(erro))


def mover_item(origem: str, destino: str) -> ActionResult:
    import shutil
    origem, destino = os.path.expanduser(origem), os.path.expanduser(destino)
    if not os.path.exists(origem):
        return ActionResult(False, f"O item {origem} não existe.")
    try:
        final = destino
        if os.path.isdir(destino):
            final = os.path.join(destino, os.path.basename(origem))
        shutil.move(origem, final)
        return ActionResult(True, f"Movido para {final}.")
    except Exception as erro:
        return ActionResult(False, "Não consegui mover o item.", dados=str(erro))


def apagar_item(caminho: str) -> ActionResult:
    """Apaga mandando para a lixeira (send2trash) — mais seguro que deletar."""
    try:
        from send2trash import send2trash
    except ImportError:
        return ActionResult(False, "Biblioteca send2trash não instalada.")

    caminho = os.path.expanduser(caminho)
    if not os.path.exists(caminho):
        return ActionResult(False, f"O item {caminho} não existe.")
    try:
        send2trash(caminho)
        return ActionResult(True, f"{os.path.basename(caminho)} foi para a lixeira.")
    except Exception as erro:
        return ActionResult(False, "Não consegui apagar o item.", dados=str(erro))


# ── Comandos de sistema ────────────────────────────────────────────────

def executar_comando(comando: str) -> ActionResult:
    """Roda um comando no shell do Windows e devolve a saída truncada."""
    try:
        resultado = subprocess.run(
            comando, shell=True, capture_output=True, text=True,
            timeout=30, encoding="utf-8", errors="replace",
        )
        saida = (resultado.stdout or "") + (resultado.stderr or "")
        saida = saida.strip()[:1500]
        return ActionResult(True, "Comando executado.", dados=saida or "(sem saída)")
    except subprocess.TimeoutExpired:
        return ActionResult(False, "O comando demorou demais e foi cancelado.")
    except Exception as erro:
        return ActionResult(False, "Falha ao executar o comando.", dados=str(erro))


# ── Mídia (teclas multimídia virtuais) ─────────────────────────────────

VK_MEDIA = {"tocar": 0xB3, "pausar": 0xB3, "proxima": 0xB0, "anterior": 0xB1}


def tocar_midia(acao: str, alvo: str | None = None) -> ActionResult:
    if acao == "tocar" and alvo:
        alvo = alvo.strip()
        if alvo.startswith("http") or ("." in alvo and " " not in alvo):
            url = alvo if alvo.startswith("http") else f"https://{alvo}"
            webbrowser.open(url)
            return ActionResult(True, f"Tocando {alvo}.")
        caminho = os.path.expanduser(alvo)
        if os.path.exists(caminho):
            os.startfile(caminho)  # abre no player padrão
            return ActionResult(True, "Tocando agora.")
        return ActionResult(False, f"Não encontrei {alvo}.")

    tecla = VK_MEDIA.get(acao)
    if tecla is None:
        return ActionResult(False, "Ação de mídia desconhecida.")
    # Pressiona e solta a tecla multimídia virtual (funciona com Spotify etc.)
    ctypes.windll.user32.keybd_event(tecla, 0, 0, 0)
    ctypes.windll.user32.keybd_event(tecla, 0, 2, 0)  # 2 = KEYEVENTF_KEYUP

    frases = {"tocar": "Tocando.", "pausar": "Pausado.",
              "proxima": "Próxima música.", "anterior": "Voltando."}
    return ActionResult(True, frases.get(acao, "Feito."))


# ── Energia / tela ─────────────────────────────────────────────────────

def energia(acao: str) -> ActionResult:
    if acao == "desligar":
        os.system("shutdown /s /t 60")  # 60s para dar tempo de cancelar
        return ActionResult(True, "Desligando em sessenta segundos. Diga 'Jarvis, cancela' para abortar.")
    if acao == "reiniciar":
        os.system("shutdown /r /t 60")
        return ActionResult(True, "Reiniciando em sessenta segundos. Diga 'Jarvis, cancela' para abortar.")
    if acao == "cancelar_desligamento":
        os.system("shutdown /a")
        return ActionResult(True, "Desligamento cancelado.")
    if acao == "bloquear":
        ctypes.windll.user32.LockWorkStation()
        return ActionResult(True, "Tela bloqueada.")
    return ActionResult(False, "Ação de energia desconhecida.")


# ── Data e hora ────────────────────────────────────────────────────────

DIAS = ["segunda-feira", "terça-feira", "quarta-feira",
        "quinta-feira", "sexta-feira", "sábado", "domingo"]


def data_hora() -> ActionResult:
    agora = datetime.now()
    frase = f"São {agora:%H:%M} de {DIAS[agora.weekday()]}, {agora:%d/%m/%Y}."
    return ActionResult(True, frase, dados=agora.isoformat())


# ── Despachante geral ──────────────────────────────────────────────────

def executar_acao(nome: str, argumentos: dict) -> ActionResult:
    """Chama a ação correspondente aos argumentos decididos pelo LLM."""
    try:
        if nome == "abrir_app":
            return abrir_app(argumentos["alvo"])
        if nome == "fechar_app":
            return fechar_app(argumentos["nome"])
        if nome == "pesquisar_web":
            return pesquisar_web(argumentos["consulta"])
        if nome == "volume":
            return volume(argumentos["acao"], argumentos.get("nivel"))
        if nome == "brilho":
            return brilho(argumentos["acao"], argumentos.get("nivel"))
        if nome == "listar_pasta":
            return listar_pasta(argumentos["caminho"])
        if nome == "criar_pasta":
            return criar_pasta(argumentos["caminho"])
        if nome == "mover_item":
            return mover_item(argumentos["origem"], argumentos["destino"])
        if nome == "apagar_item":
            return apagar_item(argumentos["caminho"])
        if nome == "executar_comando":
            return executar_comando(argumentos["comando"])
        if nome == "tocar_midia":
            return tocar_midia(argumentos["acao"], argumentos.get("alvo"))
        if nome == "energia":
            return energia(argumentos["acao"])
        if nome == "data_hora":
            return data_hora()
        return ActionResult(False, f"Ação {nome} não implementada.")
    except Exception as erro:
        return ActionResult(False, "Deu um erro ao executar a ação.", dados=str(erro))
