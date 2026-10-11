export type Theme = 'light' | 'dark';

const KEY = 'dfvleads-theme';

/** Tema guardado (omissão: claro, como na imagem showcase). */
export function getTheme(): Theme {
  try {
    return window.localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Aplica o tema à raiz e persiste a escolha. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // armazenamento indisponível: segue sem persistir
  }
}
