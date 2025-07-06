import React, { createContext, useState, useEffect, useContext } from 'react';
import { X, Palette, Trash2 } from 'lucide-react';

export const defaultTheme = {
  light: {
    'bg-primary': '#f3f4f6',
    'bg-alt': '#e5e7eb',
    'bg-hover': '#e5e7eb',
    'card-bg': '#ffffff',
    'card-bg-alt': '#f9fafb',
    'text-primary': '#1f2937',
    'text-secondary': '#6b7280',
    'text-header': '#111827',
    'text-placeholder': '#9ca3af',
    'border': '#d1d5db',
    'input-bg': '#ffffff',
    'primary': '#3b82f6',
    'primary-hover': '#2563eb',
    'accent': '#8b5cf6',
    'accent-bg': '#ede9fe',
    'success': '#16a34a',
    'success-hover': '#15803d',
    'success-bg': '#dcfce7',
    'danger': '#dc2626',
    'danger-hover-bg': '#fee2e2',
    'button-secondary-bg': '#e5e7eb',
    'button-secondary-hover-bg': '#d1d5db',
    'tab-active-bg': '#e5e7eb',
    'tab-active-text': '#111827',
    'tab-inactive-text': '#6b7280',
    'tab-inactive-hover-bg': '#f3f4f6',
  },
  dark: {
    'bg-primary': '#111827',
    'bg-alt': '#1f2937',
    'bg-hover': '#374151',
    'card-bg': '#1f2937',
    'card-bg-alt': '#111827',
    'text-primary': '#d1d5db',
    'text-secondary': '#9ca3af',
    'text-header': '#f9fafb',
    'text-placeholder': '#6b7280',
    'border': '#374151',
    'input-bg': '#374151',
    'primary': '#60a5fa',
    'primary-hover': '#3b82f6',
    'accent': '#a78bfa',
    'accent-bg': '#4c1d95',
    'success': '#4ade80',
    'success-hover': '#22c55e',
    'success-bg': '#14532d',
    'danger': '#f87171',
    'danger-hover-bg': '#450a0a',
    'button-secondary-bg': '#4b5563',
    'button-secondary-hover-bg': '#6b7280',
    'tab-active-bg': '#374151',
    'tab-active-text': '#ffffff',
    'tab-inactive-text': '#9ca3af',
    'tab-inactive-hover-bg': '#1f2937',
  }
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(defaultTheme);
    const [darkMode, setDarkMode] = useState(false);

    // Carregar tema do localStorage ao iniciar (apenas se não houver sincronização na nuvem)
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem('prismaCryptoTheme');
            if (savedTheme) {
                const parsedTheme = JSON.parse(savedTheme);
                // Validação simples para garantir que o objeto de tema não está malformado
                if(parsedTheme.light && parsedTheme.dark) {
                    setTheme(parsedTheme);
                }
            }
        } catch {
             // Se houver erro no parse, mantém o tema padrão
            console.error("Falha ao carregar tema do localStorage.");
        }
    }, []);

    // Salvar tema no localStorage (será sobrescrito pela sincronização da nuvem se ativa)
    useEffect(() => {
        try {
            localStorage.setItem('prismaCryptoTheme', JSON.stringify(theme));
        } catch (error) {
            console.error("Falha ao salvar tema:", error);
        }
    }, [theme]);

    const value = { theme, setTheme, darkMode, setDarkMode, defaultTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

export const generateThemeStyle = (theme, darkMode) => {
    const currentTheme = darkMode ? theme.dark : theme.light;
    const cssVars = Object.entries(currentTheme)
        .map(([key, value]) => `--color-${key}: ${value};`)
        .join('\n');
    return `:root {\n${cssVars}\n}`;
};

const labelTranslations = {
  'bg-primary': 'Fundo Primário',
  'bg-alt': 'Fundo Alternativo',
  'bg-hover': 'Fundo (Hover)',
  'card-bg': 'Fundo do Card',
  'card-bg-alt': 'Fundo do Card (Alt)',
  'text-primary': 'Texto Primário',
  'text-secondary': 'Texto Secundário',
  'text-header': 'Texto do Cabeçalho',
  'text-placeholder': 'Texto Placeholder',
  'border': 'Borda',
  'input-bg': 'Fundo do Input',
  'primary': 'Cor Primária',
  'primary-hover': 'Cor Primária (Hover)',
  'accent': 'Cor de Destaque',
  'accent-bg': 'Fundo de Destaque',
  'success': 'Cor de Sucesso',
  'success-hover': 'Cor de Sucesso (Hover)',
  'success-bg': 'Fundo de Sucesso',
  'danger': 'Cor de Perigo',
  'danger-hover-bg': 'Fundo de Perigo (Hover)',
  'button-secondary-bg': 'Fundo Botão Secundário',
  'button-secondary-hover-bg': 'Fundo Botão Secundário (Hover)',
  'tab-active-bg': 'Fundo Aba Ativa',
  'tab-active-text': 'Texto Aba Ativa',
  'tab-inactive-text': 'Texto Aba Inativa',
  'tab-inactive-hover-bg': 'Fundo Aba Inativa (Hover)',
};

const ColorInput = ({ label, color, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--color-text-secondary)] capitalize">{labelTranslations[label] || label.replace(/-/g, ' ')}</label>
        <div className="flex items-center gap-2 border border-[var(--color-border)] rounded">
             <input
                type="text"
                value={color}
                onChange={e => onChange(e.target.value)}
                className="w-20 text-xs px-1 py-0.5 bg-transparent outline-none text-[var(--color-text-primary)]"
                title={`Mudar valor da cor (hex, rgb, etc.) para '${labelTranslations[label] || label}'`}
            />
            <input
                type="color"
                value={color}
                onChange={e => onChange(e.target.value)}
                className="w-6 h-6 p-0 border-none appearance-none cursor-pointer bg-transparent"
                style={{'backgroundColor': 'transparent'}}
                title={`Selecionar cor visualmente para '${labelTranslations[label] || label}'`}
            />
        </div>
    </div>
);

export const ThemePanel = ({ show, onClose, theme, onThemeUpdate, onReset, darkMode }) => {
    if (!show) return null;

    const handleColorChange = (mode, key, value) => {
        const newTheme = {
            ...theme,
            [mode]: {
                ...theme[mode],
                [key]: value,
            },
        };
        onThemeUpdate(newTheme);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className={`w-full max-w-lg h-full max-h-[90vh] flex flex-col rounded-lg shadow-xl bg-[var(--color-card-bg)]`}>
                <div className={`flex items-center justify-between p-4 border-b border-[var(--color-border)]`}>
                    <h2 className={`text-lg font-semibold flex items-center gap-2 text-[var(--color-text-header)]`}>
                        <Palette className="w-5 h-5" /> Personalizar Tema
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={onReset} title="Restaurar o tema para as cores padrão" className={`flex items-center justify-center p-1 rounded transition-colors hover:bg-[var(--color-bg-hover)] text-[var(--color-danger)]`}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                         <button onClick={onClose} className={`flex items-center justify-center p-1 rounded-full transition-colors hover:bg-[var(--color-bg-hover)]`} title="Fechar painel de personalização do tema">
                            <X className={`w-4 h-4 text-[var(--color-text-secondary)]`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Light Theme */}
                    <div className="space-y-3">
                        <h3 className={`font-semibold text-center pb-2 border-b border-[var(--color-border)] ${!darkMode ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-header)]'}`}>
                            Tema Claro
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(theme.light).map(([key, value]) => (
                                <ColorInput
                                    key={`light-${key}`}
                                    label={key}
                                    color={value as string}
                                    onChange={(color) => handleColorChange('light', key, color)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Dark Theme */}
                     <div className="space-y-3">
                        <h3 className={`font-semibold text-center pb-2 border-b border-[var(--color-border)] ${darkMode ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-header)]'}`}>
                            Tema Escuro
                        </h3>
                        <div className="space-y-2">
                             {Object.entries(theme.dark).map(([key, value]) => (
                                <ColorInput
                                    key={`dark-${key}`}
                                    label={key}
                                    color={value as string}
                                    onChange={(color) => handleColorChange('dark', key, color)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-[var(--color-border)] text-center">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        As alterações de tema são salvas automaticamente na nuvem.
                    </p>
                </div>
            </div>
        </div>
    );
};