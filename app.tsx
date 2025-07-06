/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- ELECTRON-SPECIFIC SETUP ---
// This interface defines the API that will be exposed by the preload script
// to the renderer process.
interface ElectronAPI {
    closeWindow: () => void;
    minimizeWindow: () => void;
    setAlwaysOnTop: (isPinned: boolean) => void;
    resizeWindow: (width: number, height: number) => void;
    getAppVersion: () => Promise<string>;
    onUpdateDownloaded: (callback: () => void) => () => void; // Returns a cleanup function
    restartApp: () => void;
}

// Extend the window object to include our API
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}


import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, useLayoutEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Sun, Moon, Pin, PinOff, Eye, EyeOff, Info, Menu, X, ExternalLink, History, RefreshCw, Calendar, Palette, Minimize2, Maximize2, User, LogOut, ShieldAlert, KeyRound, Loader2, Zap, BarChart, ListPlus, Pilcrow, BookOpen, Minus, ArrowUpCircle } from 'lucide-react';
import { ThemePanel, defaultTheme, generateThemeStyle, ThemeProvider, useTheme } from './theme.tsx';
import { API_BASE_URL } from './config.tsx';
import Tutorial from './tutorial.tsx';


// --- CONTEXTO DE AUTENTICAÇÃO ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('prisma-token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('prisma-token');
        localStorage.removeItem('prisma-user');
    }, []);

    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                        setIsAuthenticated(true);
                        localStorage.setItem('prisma-user', JSON.stringify(data.user));
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error("Erro de conexão ao validar token", error);
                    logout(); // Faz logout se API estiver offline
                }
            }
            setIsLoading(false);
        };
        validateToken();
    }, [token, logout]);

    const login = async (username, password) => {
        setIsLoading(true);
        setAuthError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('prisma-token', data.token);
                localStorage.setItem('prisma-user', JSON.stringify(data.user));
            } else {
                setAuthError(data.message || 'Erro ao fazer login.');
                setIsAuthenticated(false);
            }
        } catch (error) {
            setAuthError('Falha na conexão com o servidor.');
            console.error("Erro de conexão no login", error);
        } finally {
            setIsLoading(false);
        }
    };

    const authContextValue = {
        user,
        token,
        isAuthenticated,
        isLoading,
        authError,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// --- TELA DE LOGIN ---
const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const { login, authError, isLoading } = useAuth();

    const handleClose = () => {
        // This function leverages Electron's IPC to close the window.
        // It calls a function exposed by the preload script.
        if (window.electronAPI) {
            window.electronAPI.closeWindow();
        }
    };

    useEffect(() => {
        try {
            const rememberedUser = localStorage.getItem('prisma-remember-user');
            if (rememberedUser) {
                const { username: savedUser, password: savedPass } = JSON.parse(rememberedUser);
                setUsername(savedUser);
                setPassword(savedPass);
                setRememberMe(true);
            }
        } catch (error) {
            console.error("Falha ao carregar usuário lembrado:", error);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!username || !password) return;

        if (rememberMe) {
            try {
                localStorage.setItem('prisma-remember-user', JSON.stringify({ username, password }));
            } catch (error) {
                console.error("Falha ao salvar usuário lembrado:", error);
            }
        } else {
            localStorage.removeItem('prisma-remember-user');
        }
        login(username, password);
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-primary)]">
            <div className="w-full max-w-xs rounded-lg shadow-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] relative">
                <button 
                    onClick={handleClose} 
                    className="absolute top-2 right-2 flex items-center justify-center p-1 rounded-full transition-colors hover:bg-[var(--color-bg-hover)]"
                    title="Fechar o aplicativo"
                    aria-label="Fechar o aplicativo"
                >
                    <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
                <div className="p-6 text-center border-b border-[var(--color-border)]">
                    <div className="inline-flex items-center gap-2">
                        <Calculator className={`w-6 h-6 text-[var(--color-primary)]`} />
                        <h1 className={`text-xl font-semibold text-[var(--color-text-header)]`}>
                            Prisma 💎
                        </h1>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">Acesso à Calculadora</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="username">Usuário</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm rounded-md border outline-none transition-colors bg-[var(--color-input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                            title="Seu nome de usuário"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm rounded-md border outline-none transition-colors bg-[var(--color-input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                            title="Sua senha de acesso"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-3.5 w-3.5 rounded cursor-pointer border-[var(--color-border)] bg-[var(--color-input-bg)] text-[var(--color-primary)] focus:ring-0 focus:ring-offset-0"
                            title="Marque para salvar seu usuário e senha neste navegador"
                        />
                        <label htmlFor="remember-me" className="text-xs select-none cursor-pointer text-[var(--color-text-secondary)]">
                            Lembrar-me
                        </label>
                    </div>
                    {authError && <p className="text-xs text-center text-[var(--color-danger)] pt-2">{authError}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-opacity-50 disabled:cursor-wait" title="Acessar a calculadora com as credenciais fornecidas">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- TELA DE PLANO INVÁLIDO ---
const SubscriptionGate = () => {
    const { user, logout } = useAuth();
    return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-primary)]">
            <div className="w-full max-w-xs text-center rounded-lg shadow-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-8">
                <ShieldAlert className="w-16 h-16 mx-auto text-[var(--color-danger)]" />
                <h2 className="mt-4 text-xl font-bold text-[var(--color-text-header)]">Acesso Negado</h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    Olá, <span className="font-semibold text-[var(--color-text-primary)]">{user?.username}</span>.
                    Seu plano atual é <span className="font-semibold text-[var(--color-accent)]">{user?.plan}</span>.
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Para utilizar a calculadora, é necessário um plano 'Premium'.
                </p>
                <button onClick={logout} className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors bg-[var(--color-button-secondary-bg)] hover:bg-[var(--color-button-secondary-hover-bg)] text-[var(--color-text-primary)]" title="Voltar para a tela de login">
                    <LogOut className="w-4 h-4" />
                    Sair
                </button>
            </div>
        </div>
    );
};


// --- TYPE DEFINITIONS ---
interface Purchase {
    id: number;
    value: string;
}

interface ArbitrageCalculatorState {
    id: number;
    type: 'arbitrage';
    name: string;
    openingExch1: string;
    openingExch2: string;
    closingExch1: string;
    closingExch2: string;
    totalCoins: string;
    purchases: Purchase[];
    showAverage: boolean;
}

interface FundingLogEntry {
    id: number;
    timestamp: string;
    profit: number;
    rate: number;
}

interface FundingCalculatorState {
    id: number;
    type: 'funding';
    name: string;
    positionSize: string;
    leverage: string;
    fundingInterval: string;
    shortExchangeName: string;
    shortExchangeFR: string;
    longExchangeName: string;
    longExchangeFR: string;
    log: FundingLogEntry[];
}

type CalculatorState = ArbitrageCalculatorState | FundingCalculatorState;


// Componentes externos ao render principal
const CompactInput = ({ label, value, onChange, placeholder, type = "number", step = "any", title }) => (
  <div className="space-y-0.5">
    <label className={`block text-xs text-[var(--color-text-secondary)]`}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-1.5 py-0.5 text-xs rounded border outline-none transition-colors bg-[var(--color-input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] border-[var(--color-border)] focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]`}
      step={step}
      title={title}
    />
  </div>
);

interface CompactCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  'data-tutorial-id'?: string;
}

const CompactCard = ({ title, icon: Icon, children, actionButton, ...props }: CompactCardProps) => (
  <div className={`rounded border p-1.5 shadow-sm bg-[var(--color-card-bg)] border-[var(--color-border)]`} {...props}>
    <div className="flex items-center justify-between mb-1.5">
       <div className="flex items-center gap-1">
        <Icon className={`w-3 h-3 text-[var(--color-primary)]`} />
        <h3 className={`text-xs font-medium text-[var(--color-text-header)]`}>
          {title}
        </h3>
      </div>
      {actionButton}
    </div>
    {children}
  </div>
);

const CompactResult = ({ value, label }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 600);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className={`text-center p-1 rounded transition-colors ${isAnimating ? 'animate-flash' : 'bg-[var(--color-card-bg-alt)]'}`} title={`Diferença percentual: ${value}%`}>
            <p className={`text-xs mb-0.5 text-[var(--color-text-secondary)]`}>
                {label}
            </p>
            <div className="flex items-center justify-center gap-0.5">
                {parseFloat(value) > 0 ? (
                    <TrendingUp className={`w-2.5 h-2.5 text-[var(--color-success)]`} />
                ) : parseFloat(value) < 0 ? (
                    <TrendingDown className={`w-2.5 h-2.5 text-[var(--color-danger)]`} />
                ) : null}
                <span className={`text-xs font-bold ${
                    parseFloat(value) > 0 
                        ? 'text-[var(--color-success)]'
                        : parseFloat(value) < 0 
                            ? 'text-[var(--color-danger)]'
                            : 'text-[var(--color-text-secondary)]'
                }`}>
                    {value}%
                </span>
            </div>
        </div>
    );
};


const HistoryPanel = ({ show, onClose, history, onDelete, onClear }) => {
    if (!show) return null;

    const [filterDate, setFilterDate] = useState('');
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    useEffect(() => {
        if (!show) {
            setIsConfirmingClear(false);
        }
    }, [show]);

    const handleDateChange = (e) => {
        setFilterDate(e.target.value);
    };
    
    const filteredHistory = useMemo(() => {
      if (!filterDate) return history;
      const selectedDate = new Date(filterDate + 'T00:00:00'); // Adjust for timezone
      return history.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate.getFullYear() === selectedDate.getFullYear() &&
               itemDate.getMonth() === selectedDate.getMonth() &&
               itemDate.getDate() === selectedDate.getDate();
      });
    }, [filterDate, history]);

    const renderInputs = (item) => {
      const inputs = item.inputs;
      switch(item.type) {
        case 'Abertura':
          return `Ex1: ${inputs.openingExch1}, Ex2: ${inputs.openingExch2}`;
        case 'Fechamento':
          return `Ex1: ${inputs.closingExch1}, Ex2: ${inputs.closingExch2}`;
        case 'Médio':
          const totalValue = inputs.purchases.reduce((acc, p) => acc + parseFloat(p.value || 0), 0);
          return `Moedas: ${inputs.totalCoins}, Total USD: ${totalValue.toFixed(2)}`;
        case 'Funding':
            return `Pos: $${inputs.positionSize}, Short FR: ${inputs.shortExchangeFR}%, Long FR: ${inputs.longExchangeFR}%`;
        default:
          return '';
      }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className={`w-full max-w-md h-full max-h-[90vh] flex flex-col rounded-lg shadow-xl bg-[var(--color-card-bg)]`}>
                <div className={`flex items-center justify-between p-4 border-b border-[var(--color-border)]`}>
                    <h2 className={`text-lg font-semibold flex items-center gap-2 text-[var(--color-text-header)]`}>
                        <History className="w-5 h-5" /> Histórico de Cálculos
                    </h2>
                    <span title="Fechar painel de histórico">
                        <button onClick={onClose} className={`flex items-center justify-center p-1 rounded-full transition-colors hover:bg-[var(--color-bg-hover)]`}>
                            <X className={`w-4 h-4 text-[var(--color-text-secondary)]`} />
                        </button>
                    </span>
                </div>
                
                <div className="p-4">
                    <div className="relative">
                        <Calendar className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]`} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={handleDateChange}
                            className={`w-full pl-8 pr-2 py-1.5 text-sm rounded border outline-none transition-colors bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-1 focus:ring-[var(--color-primary)]`}
                            title="Filtrar histórico por data"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map(item => (
                            <div key={item.id} className={`p-2 rounded border bg-[var(--color-bg-alt)] border-[var(--color-border)]`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold text-sm text-[var(--color-primary)]`}>{item.type}</p>
                                            {item.tabName && (
                                                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-card-bg-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)] truncate max-w-[100px]" title={item.tabName}>
                                                    {item.tabName}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-1 text-[var(--color-text-secondary)]`}>
                                            {new Date(item.timestamp).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onDelete(item.id)} title="Excluir este registro do histórico" className={`flex items-center justify-center p-1 rounded text-[var(--color-danger)] hover:bg-[var(--color-danger-hover-bg)]`}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className={`mt-2 p-2 rounded text-xs bg-[var(--color-card-bg-alt)] text-[var(--color-text-primary)]`}>
                                    <p><span className="font-semibold">Entradas:</span> {renderInputs(item)}</p>
                                    <p><span className="font-semibold">Resultado:</span> {item.result}{item.type !== 'Médio' && item.type !== 'Funding' ? '%' : ''}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className={`text-[var(--color-text-secondary)]`}>Nenhum registro encontrado.</p>
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                     <div className={`p-4 border-t border-[var(--color-border)]`}>
                        {!isConfirmingClear ? (
                            <button onClick={() => setIsConfirmingClear(true)} className={`w-full text-center py-2 text-sm rounded transition-colors bg-[var(--color-danger)]/80 hover:bg-[var(--color-danger)] text-white`} title="Limpar todo o histórico de cálculos">
                                Limpar Histórico
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <p className={`text-center text-sm text-[var(--color-text-primary)]`}>Tem certeza?</p>
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => setIsConfirmingClear(false)} className={`w-full py-2 text-sm rounded transition-colors bg-[var(--color-button-secondary-bg)] hover:bg-[var(--color-button-secondary-hover-bg)] text-[var(--color-text-primary)]`} title="Cancelar a limpeza do histórico">
                                        Cancelar
                                    </button>
                                    <button onClick={onClear} className={`w-full py-2 text-sm rounded transition-colors bg-[var(--color-danger)]/80 hover:bg-[var(--color-danger)] text-white`} title="Confirmar a limpeza de todo o histórico">
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const getNewCalculator = (id: number, count: number): ArbitrageCalculatorState => ({
  id,
  type: 'arbitrage',
  name: `C ${count}`,
  openingExch1: '',
  openingExch2: '',
  closingExch1: '',
  closingExch2: '',
  totalCoins: '',
  purchases: [{ value: '', id: Date.now() }],
  showAverage: false,
});

const getNewFundingCalculator = (id: number, count: number): FundingCalculatorState => ({
    id,
    type: 'funding',
    name: `FR ${count}`,
    positionSize: '',
    leverage: '10',
    fundingInterval: '8',
    shortExchangeName: 'Ex A (Short)',
    shortExchangeFR: '',
    longExchangeName: 'Ex B (Long)',
    longExchangeFR: '',
    log: [],
});

const AnimatedStat = ({ label, value, valuePrefix = '', valueSuffix = '', bgColor, textColor, title }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 600);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className={`text-center p-1 rounded transition-colors ${isAnimating ? 'animate-flash' : bgColor}`} title={title}>
            <p className={`text-xs ${textColor}`}>{label}</p>
            <p className={`text-xs font-bold ${textColor}`}>{valuePrefix}{value}{valueSuffix}</p>
        </div>
    );
};

const CompactCalculatorInstance = ({ instanceData, onUpdate }) => {
    const { openingExch1, openingExch2, closingExch1, closingExch2 } = instanceData;

    const setOpeningExch1 = (value) => onUpdate({ openingExch1: value });
    const setOpeningExch2 = (value) => onUpdate({ openingExch2: value });
    const setClosingExch1 = (value) => onUpdate({ closingExch1: value });
    const setClosingExch2 = (value) => onUpdate({ closingExch2: value });

    const calculateDifference = (val1, val2) => {
        const num1 = parseFloat(val1);
        const num2 = parseFloat(val2);
        if (!isNaN(num1) && !isNaN(num2) && num2 !== 0) {
            return ((num1 - num2) / num2 * 100).toFixed(2);
        }
        return '0.00';
    };

    const openingDifference = calculateDifference(openingExch1, openingExch2);
    const closingDifference = calculateDifference(closingExch1, closingExch2);

    return (
        <div className="p-2 space-y-2">
            <div className={`rounded border p-2 shadow-sm bg-[var(--color-card-bg)] border-[var(--color-border)]`}>
                <h3 className="text-xs font-medium text-center mb-2 text-[var(--color-text-header)]">Arbitragem Rápida</h3>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <CompactInput label="Abertura Ex1" value={openingExch1} onChange={setOpeningExch1} placeholder="50000" title="Preço de abertura na Exchange 1" />
                    <CompactInput label="Abertura Ex2" value={openingExch2} onChange={setOpeningExch2} placeholder="49500" title="Preço de abertura na Exchange 2" />
                    <CompactInput label="Fechamento Ex1" value={closingExch1} onChange={setClosingExch1} placeholder="51000" title="Preço de fechamento na Exchange 1" />
                    <CompactInput label="Fechamento Ex2" value={closingExch2} onChange={setClosingExch2} placeholder="50200" title="Preço de fechamento na Exchange 2" />
                </div>
                 <div className="grid grid-cols-2 gap-1.5">
                    <CompactResult value={openingDifference} label="Abertura" />
                    <CompactResult value={closingDifference} label="Fechamento" />
                </div>
            </div>
        </div>
    );
}

const CalculatorInstance = ({ instanceData, onUpdate, onAddToHistory }) => {
  const { id, name, openingExch1, openingExch2, closingExch1, closingExch2, totalCoins, purchases, showAverage } = instanceData;

  const setOpeningExch1 = (value) => onUpdate({ openingExch1: value });
  const setOpeningExch2 = (value) => onUpdate({ openingExch2: value });
  const setClosingExch1 = (value) => onUpdate({ closingExch1: value });
  const setClosingExch2 = (value) => onUpdate({ closingExch2: value });
  const setTotalCoins = (value) => onUpdate({ totalCoins: value });
  const setPurchases = (value) => onUpdate({ purchases: value });

  const calculateDifference = (val1, val2) => {
    const num1 = parseFloat(val1);
    const num2 = parseFloat(val2);
    if (!isNaN(num1) && !isNaN(num2) && num2 !== 0) {
      return ((num1 - num2) / num2 * 100).toFixed(2);
    }
    return '0.00';
  };

  const openingDifference = calculateDifference(openingExch1, openingExch2);
  const closingDifference = calculateDifference(closingExch1, closingExch2);
  
  const totalPurchases = useMemo(() => purchases.reduce((sum, purchase) => sum + parseFloat(purchase.value || '0'), 0), [purchases]);
  
  const averagePrice = useMemo(() => {
    const coins = parseFloat(totalCoins);
    if (!isNaN(coins) && coins !== 0 && totalPurchases > 0) {
      return (totalPurchases / coins).toFixed(4);
    }
    return '0.0000';
  }, [totalCoins, totalPurchases]);

  const addPurchase = () => setPurchases([...purchases, { value: '', id: Date.now() + Math.random() }]);
  const removePurchase = (purchaseId) => setPurchases(purchases.length > 1 ? purchases.filter(p => p.id !== purchaseId) : purchases);
  const updatePurchase = (purchaseId, value) => setPurchases(purchases.map(p => p.id === purchaseId ? { ...p, value } : p));
  
  const handleSaveOpening = () => {
    const result = calculateDifference(openingExch1, openingExch2);
    if (result !== '0.00' && openingExch1 && openingExch2) {
      onAddToHistory('Abertura', { openingExch1, openingExch2 }, result, name);
    }
  };

  const handleSaveClosing = () => {
    const result = calculateDifference(closingExch1, closingExch2);
    if (result !== '0.00' && closingExch1 && closingExch2) {
      onAddToHistory('Fechamento', { closingExch1, closingExch2 }, result, name);
    }
  };

  const handleSaveAverage = () => {
    const result = averagePrice;
    const coins = parseFloat(totalCoins);
    const total = purchases.reduce((s, p) => s + parseFloat(p.value || '0'), 0);
    if (result !== '0.0000' && coins > 0 && total > 0) {
      onAddToHistory('Médio', { totalCoins, purchases: purchases.filter(p => p.value) }, result, name);
    }
  };

  return (
    <div className="p-2 space-y-1.5">
        <CompactCard 
          title="Abertura" 
          icon={TrendingUp} 
          data-tutorial-id="arbitrage-opening"
          actionButton={
            <button data-tutorial-id="arbitrage-save" onClick={handleSaveOpening} className={`w-6 h-6 flex items-center justify-center text-white rounded transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]`} title="Registrar cálculo de Abertura no histórico">
              <Calendar className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-1 mb-1.5">
            <CompactInput label="Ex1" value={openingExch1} onChange={setOpeningExch1} placeholder="50000" title="Preço de abertura na Exchange 1" />
            <CompactInput label="Ex2" value={openingExch2} onChange={setOpeningExch2} placeholder="49500" title="Preço de abertura na Exchange 2" />
          </div>
          <CompactResult value={openingDifference} label="%" />
        </CompactCard>

        <CompactCard 
          title="Fechamento" 
          icon={TrendingDown} 
           data-tutorial-id="arbitrage-closing"
          actionButton={
            <button onClick={handleSaveClosing} className={`w-6 h-6 flex items-center justify-center text-white rounded transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]`} title="Registrar cálculo de Fechamento no histórico">
              <Calendar className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-1 mb-1.5">
            <CompactInput label="Ex1" value={closingExch1} onChange={setClosingExch1} placeholder="51000" title="Preço de fechamento na Exchange 1" />
            <CompactInput label="Ex2" value={closingExch2} onChange={setClosingExch2} placeholder="50200" title="Preço de fechamento na Exchange 2" />
          </div>
          <CompactResult value={closingDifference} label="%" />
        </CompactCard>

        {showAverage && (
          <CompactCard 
            title="Médio" 
            icon={DollarSign} 
             data-tutorial-id="arbitrage-average"
            actionButton={
              <button onClick={handleSaveAverage} className={`w-6 h-6 flex items-center justify-center text-white rounded transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]`} title="Registrar cálculo de Preço Médio no histórico">
                <Calendar className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-1.5">
              <CompactInput label="Moedas" value={totalCoins} onChange={setTotalCoins} placeholder="1.5" title="Quantidade total de moedas compradas" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs text-[var(--color-text-secondary)]`}>USD</label>
                  <button onClick={addPurchase} className={`w-6 h-6 flex items-center justify-center text-white rounded transition-colors bg-[var(--color-success)] hover:bg-[var(--color-success-hover)]`} title="Adicionar um novo campo de compra em dólar">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex gap-1">
                      <input
                        type="number" value={purchase.value} onChange={(e) => updatePurchase(purchase.id, e.target.value)} placeholder="5000"
                        className={`flex-1 px-1.5 py-0.5 text-xs rounded border outline-none transition-colors bg-[var(--color-input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] border-[var(--color-border)] focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]`}
                        step="any"
                        title="Valor em dólar desta compra individual"
                      />
                      <button onClick={() => removePurchase(purchase.id)} disabled={purchases.length === 1} className={`w-6 h-6 flex items-center justify-center rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[var(--color-danger)] hover:bg-[var(--color-danger-hover-bg)]`} title="Remover esta compra da lista">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                 <AnimatedStat
                    label="Total"
                    value={totalPurchases.toFixed(0)}
                    valuePrefix="$"
                    bgColor="bg-[var(--color-success-bg)]"
                    textColor="text-[var(--color-success)]"
                    title="Soma de todos os valores de compra em dólar."
                />
                <AnimatedStat
                    label="Preço"
                    value={averagePrice}
                    valuePrefix="$"
                    bgColor="bg-[var(--color-accent-bg)]"
                    textColor="text-[var(--color-accent)]"
                    title="Preço médio de compra (Total em dólar / Total de moedas)."
                />
              </div>
            </div>
          </CompactCard>
        )}
      </div>
  )
}

const FundingRateInstance = ({ instanceData, onUpdate, onAddToHistory }) => {
    const { positionSize, leverage, fundingInterval, shortExchangeName, shortExchangeFR, longExchangeName, longExchangeFR, log, name } = instanceData;

    const calculations = useMemo(() => {
        const posSize = parseFloat(positionSize) || 0;
        const rA = parseFloat(shortExchangeFR) / 100 || 0; // Short position rate
        const rB = parseFloat(longExchangeFR) / 100 || 0;  // Long position rate
        const lev = parseFloat(leverage) || 1;
        const interval = parseFloat(fundingInterval) || 0;

        if (posSize === 0) {
            return { netProfitRate: 0, netProfitUSD: 0, dailyProfitUSD: 0, monthlyProfitUSD: 0, annualProfitUSD: 0, margin: 0, apy: 0 };
        }

        // Profit from a short position is `Position * Rate`
        // Profit from a long position is `Position * -Rate`
        // Total Profit = (posSize * rA) + (posSize * -rB) = posSize * (rA - rB)
        const netProfitRate = rA - rB;
        const netProfitUSD = posSize * netProfitRate;

        const periodsPerDay = interval > 0 ? 24 / interval : 0;
        const dailyProfitUSD = netProfitUSD * periodsPerDay;
        const monthlyProfitUSD = dailyProfitUSD * 30;
        const annualProfitUSD = dailyProfitUSD * 365;
        
        const margin = (lev > 0 && posSize > 0) ? posSize / lev : 0;
        const apy = margin > 0 ? (annualProfitUSD / margin) * 100 : 0;

        return { netProfitRate, netProfitUSD, dailyProfitUSD, monthlyProfitUSD, annualProfitUSD, margin, apy };
    }, [positionSize, leverage, fundingInterval, shortExchangeFR, longExchangeFR]);

    const totalLoggedProfit = useMemo(() => {
        return log.reduce((acc, entry) => acc + entry.profit, 0);
    }, [log]);

    const handleLogPeriod = () => {
        if (calculations.netProfitUSD === 0) return;
        const newLogEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            profit: calculations.netProfitUSD,
            rate: calculations.netProfitRate,
        };
        onUpdate({ log: [newLogEntry, ...log].slice(0, 100) });
    };

    const handleRemoveLogEntry = (id) => {
        onUpdate({ log: log.filter(entry => entry.id !== id) });
    };
    
    const handleSaveToHistory = () => {
        if (calculations.netProfitUSD === 0) return;
        onAddToHistory(
            'Funding', 
            { positionSize, shortExchangeFR, longExchangeFR }, 
            `${(calculations.netProfitRate * 100).toFixed(4)}% ($${calculations.netProfitUSD.toFixed(2)})`, 
            name
        );
    };

    return (
        <div className="p-2 space-y-1.5">
            <CompactCard title="Posição" icon={DollarSign} data-tutorial-id="funding-position">
                <div className="grid grid-cols-3 gap-1">
                    <CompactInput label="Tamanho ($)" value={positionSize} onChange={v => onUpdate({ positionSize: v })} placeholder="1000" title="Valor total da posição em dólar (Ex: 1000)" />
                    <CompactInput label="Alavancagem" value={leverage} onChange={v => onUpdate({ leverage: v })} placeholder="10" title="Alavancagem usada (Ex: 10 para 10x)" />
                    <CompactInput label="Intervalo (h)" value={fundingInterval} onChange={v => onUpdate({ fundingInterval: v })} placeholder="8" title="Intervalo em horas para cada pagamento de funding (Ex: 8)" />
                </div>
            </CompactCard>

            <CompactCard title="Exchanges & Taxas" icon={BarChart} data-tutorial-id="funding-rates"
                actionButton={
                    <button onClick={handleSaveToHistory} className={`w-6 h-6 flex items-center justify-center text-white rounded transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]`} title="Salvar projeção atual no Histórico">
                        <Calendar className="w-3.5 h-3.5" />
                    </button>
                }
            >
                <div className="grid grid-cols-2 gap-1">
                    <CompactInput label="Nome (Short)" value={shortExchangeName} onChange={v => onUpdate({ shortExchangeName: v })} type="text" placeholder="Ex. Binance" title="Nome da exchange da posição SHORT"/>
                    <CompactInput label="Taxa FR (%)" value={shortExchangeFR} onChange={v => onUpdate({ shortExchangeFR: v })} placeholder="-0.18" title="Taxa de Funding da posição SHORT (%). Use negativo para taxas negativas."/>
                    <CompactInput label="Nome (Long)" value={longExchangeName} onChange={v => onUpdate({ longExchangeName: v })} type="text" placeholder="Ex. Bybit" title="Nome da exchange da posição LONG"/>
                    <CompactInput label="Taxa FR (%)" value={longExchangeFR} onChange={v => onUpdate({ longExchangeFR: v })} placeholder="-1.17" title="Taxa de Funding da posição LONG (%). Use negativo para taxas negativas."/>
                </div>
            </CompactCard>
            
            <CompactCard title="Resultados e Projeções" icon={TrendingUp} data-tutorial-id="funding-results">
                 <div className="grid grid-cols-3 gap-1 mb-1.5">
                    <AnimatedStat label="Lucro/Período" value={calculations.netProfitUSD.toFixed(4)} valuePrefix="$" bgColor="bg-[var(--color-card-bg-alt)]" textColor="text-[var(--color-text-primary)]" title="Lucro ou prejuízo estimado para cada intervalo de funding." />
                    <AnimatedStat label="Lucro/Dia" value={calculations.dailyProfitUSD.toFixed(2)} valuePrefix="$" bgColor="bg-[var(--color-card-bg-alt)]" textColor="text-[var(--color-text-primary)]" title="Projeção de lucro ou prejuízo diário com base na taxa atual." />
                    <AnimatedStat label="Lucro/Mês" value={calculations.monthlyProfitUSD.toFixed(2)} valuePrefix="$" bgColor="bg-[var(--color-card-bg-alt)]" textColor="text-[var(--color-text-primary)]" title="Projeção de lucro ou prejuízo mensal (30 dias) com base na taxa atual." />
                 </div>
                 <div className="grid grid-cols-3 gap-1">
                    <AnimatedStat label="Net %" value={(calculations.netProfitRate * 100).toFixed(4)} valueSuffix="%" bgColor="bg-[var(--color-accent-bg)]" textColor="text-[var(--color-accent)]" title="Diferença percentual líquida entre a taxa de funding short e long." />
                    <AnimatedStat label="Margem" value={calculations.margin.toFixed(2)} valuePrefix="$" bgColor="bg-[var(--color-card-bg-alt)]" textColor="text-[var(--color-text-primary)]" title="Valor da sua margem (colateral) com base no tamanho da posição e alavancagem." />
                    <AnimatedStat label="APY s/ Margem" value={calculations.apy.toFixed(2)} valueSuffix="%" bgColor="bg-[var(--color-success-bg)]" textColor="text-[var(--color-success)]" title="Retorno Percentual Anual (APY) estimado com base na sua margem e no lucro anual projetado." />
                </div>
            </CompactCard>

            <div data-tutorial-id="funding-log" className={`rounded border p-1.5 shadow-sm bg-[var(--color-card-bg)] border-[var(--color-border)]`}>
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                        <ListPlus className={`w-3 h-3 text-[var(--color-primary)]`} />
                        <h3 className={`text-xs font-medium text-[var(--color-text-header)]`}>
                          Log de Funding (Total: <span className="text-[var(--color-success)]">${totalLoggedProfit.toFixed(2)}</span>)
                        </h3>
                    </div>
                    <button onClick={handleLogPeriod} className={`flex items-center gap-1 text-xs px-1.5 py-0.5 text-white rounded transition-colors bg-[#16a34a] hover:bg-[#15803d]`} title="Adiciona o lucro/prejuízo do período atual ao log">
                        <Plus className="w-2.5 h-2.5" /> Registrar Funding
                    </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                    {log.length > 0 ? log.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-1 rounded bg-[var(--color-bg-alt)] text-xs">
                           <div className="flex items-center gap-2">
                                <span className="text-[var(--color-text-secondary)]">{new Date(entry.timestamp).toLocaleTimeString('pt-BR')}</span>
                                <span className={`font-mono text-[var(--color-text-primary)]`}>{(entry.rate * 100).toFixed(4)}%</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <span className={`font-bold ${entry.profit > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                                    ${entry.profit.toFixed(4)}
                                </span>
                                <button onClick={() => handleRemoveLogEntry(entry.id)} className="flex items-center justify-center p-0.5 rounded text-[var(--color-danger)] hover:bg-[var(--color-danger-hover-bg)]" title="Remover este registro do log">
                                    <X className="w-2.5 h-2.5" />
                                </button>
                           </div>
                        </div>
                    )) : (
                        <p className="text-center text-xs py-2 text-[var(--color-text-secondary)]">Nenhum período logado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const useDebouncedSave = (callback, delay) => {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedFunction = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);
    
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedFunction;
};

const ShortcutsPanel = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`w-80 rounded-lg p-6 shadow-xl bg-[var(--color-card-bg)]`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold flex items-center gap-2 text-[var(--color-text-header)]`}>
                        <KeyRound className="w-5 h-5 text-[var(--color-primary)]" /> Atalhos de Teclado
                    </h2>
                    <span title="Fechar janela 'Atalhos'">
                        <button onClick={onClose} className={`flex items-center justify-center p-1 rounded-full transition-colors hover:bg-[var(--color-bg-hover)]`}>
                            <X className={`w-4 h-4 text-[var(--color-text-secondary)]`} />
                        </button>
                    </span>
                </div>
                <div className={`text-xs space-y-1 text-[var(--color-text-secondary)]`}>
                    <div className="flex justify-between"><span>Nova Aba (Arbitragem):</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>Ctrl+T</span></div>
                    <div className="flex justify-between"><span>Fechar Aba:</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>Ctrl+W</span></div>
                    <div className="flex justify-between"><span>Modo escuro:</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>Ctrl+D</span></div>
                    <div className="flex justify-between"><span>Fixar janela:</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>Ctrl+P</span></div>
                    <div className="flex justify-between"><span>Modo Compacto:</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>Ctrl+M</span></div>
                    <div className="flex justify-between"><span>Toggle médio (Arbitragem):</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>Ctrl+H</span></div>
                    <div className="flex justify-between"><span>Fechar modais:</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>ESC</span></div>
                    <div className="flex justify-between"><span>Abrir sobre:</span><span className={`font-mono px-1 rounded bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}>F1</span></div>
                </div>
            </div>
        </div>
    );
};

const CryptoCalculator = () => {
  const { user, logout, token } = useAuth();
  const { theme, setTheme, darkMode, setDarkMode } = useTheme();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [dollarRate, setDollarRate] = useState(null);
  const [lastDollarUpdate, setLastDollarUpdate] = useState<Date | null>(null);
  const [dollarLoading, setDollarLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [history, setHistory] = useState([]);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  const [calculators, setCalculators] = useState<CalculatorState[]>([getNewCalculator(Date.now(), 1)]);
  const [activeTabId, setActiveTabId] = useState(calculators[0].id);
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const isInitialLoad = useRef(true);

  const activeCalculator = useMemo(() => calculators.find(c => c.id === activeTabId), [calculators, activeTabId]);

  const calculatorStructure = useMemo(() =>
    calculators.map(({ id, name, type }) => `${id}-${name}-${type}`).join(','),
  [calculators]);

  // Sincroniza o estado de `isPinned` e gerencia a notificação de atualização
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setAlwaysOnTop(isPinned);
      
      window.electronAPI.getAppVersion().then(setAppVersion);

      const removeUpdateListener = window.electronAPI.onUpdateDownloaded(() => {
        setUpdateAvailable(true);
      });
      
      // Função de limpeza para remover o listener quando o componente for desmontado
      return () => {
        if (removeUpdateListener) removeUpdateListener();
      };
    }
  }, [isPinned]);

  // Programmatically resize window when content changes
  useLayoutEffect(() => {
    // This effect dynamically resizes the window based on the content's size.
    if (window.electronAPI?.resizeWindow && containerRef.current) {
        const NORMAL_WIDTH = 384; // Corresponds to max-w-sm
        const COMPACT_WIDTH = 320; // Corresponds to max-w-xs
        const MIN_HEIGHT = 200; // A sensible minimum height

        const newWidth = isCompact ? COMPACT_WIDTH : NORMAL_WIDTH;
        
        // We use a RAF to ensure the DOM has been painted before we measure.
        // This prevents layout thrashing and gets a more accurate height.
        requestAnimationFrame(() => {
            if (containerRef.current) {
                const contentHeight = containerRef.current.scrollHeight;
                const newHeight = Math.ceil(Math.max(contentHeight, MIN_HEIGHT));

                // The resize call is handled in the main process.
                window.electronAPI.resizeWindow(newWidth, newHeight);
            }
        });
    }
    // Re-run the effect whenever the active calculator or compact mode changes,
    // as this can affect the layout and required window size.
  }, [isCompact, activeCalculator]);


  // Handles Electron window commands (minimize, close).
  const handleWindowCommand = (command: 'minimize' | 'close') => {
    if (!window.electronAPI) return;
    
    switch(command) {
        case 'minimize':
            window.electronAPI.minimizeWindow();
            break;
        case 'close':
            window.electronAPI.closeWindow();
            break;
    }
  };

  const saveSettingsToCloud = useDebouncedSave(async (settingsToSave) => {
    if (!token) return;
    try {
        const payload = JSON.stringify({ settings: JSON.stringify(settingsToSave) });
        const res = await fetch(`${API_BASE_URL}/api/user/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: payload
        });
        if (!res.ok) {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error("Erro ao salvar configurações na nuvem:", error);
    }
  }, 2000);

  // Carregar estado (Cloud > Local > Default com merge)
  useEffect(() => {
    const loadSettings = async () => {
        let cloudSettings = null;
        if (token) {
            try {
                const res = await fetch(`${API_BASE_URL}/api/user/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.settings) {
                        cloudSettings = JSON.parse(data.settings);
                    }
                }
            } catch (error) { console.error("Falha ao carregar da nuvem, tentando local.", error); }
        }

        let localSettings = null;
        try {
            const savedState = localStorage.getItem('prisma-calc-state');
            if (savedState) {
                localSettings = JSON.parse(savedState);
            }
        } catch (error) { console.error("Falha ao carregar do localStorage", error); }

        const baseSettings = cloudSettings || localSettings;

        if (!baseSettings) {
            isInitialLoad.current = false;
            return; // Use defaults
        }
        
        // Merge data
        if (cloudSettings && localSettings) {
             baseSettings.calculators = cloudSettings.calculators.map(cloudCalc => {
                const localMatch = localSettings.calculators.find(lc => lc.id === cloudCalc.id);
                return localMatch ? {...cloudCalc, ...localMatch} : cloudCalc; 
            });
        }

        // Aplica as configurações finais
        if (baseSettings.calculators && baseSettings.calculators.length > 0) {
            const migratedCalculators = baseSettings.calculators.map(calc => {
                const defaultState = (calc.type === 'funding')
                    ? getNewFundingCalculator(0, 0)
                    : getNewCalculator(0, 0);

                return {
                    ...defaultState,
                    ...calc,
                    type: calc.type || 'arbitrage',
                    log: calc.log || [],
                };
            });
            setCalculators(migratedCalculators);
            setActiveTabId(baseSettings.activeTabId || migratedCalculators[0].id);
            setTheme(baseSettings.theme || defaultTheme);
            setDarkMode(baseSettings.darkMode || false);
        }
        
        setIsCompact(localSettings?.isCompact || false);
        setIsPinned(localSettings?.isPinned || false);
        isInitialLoad.current = false;
    };

    loadSettings();

    const savedHistory = localStorage.getItem('prismaCryptoHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [token, setTheme, setDarkMode]);


  // Salvar estado para LocalStorage (sempre, para todas as mudanças)
  useEffect(() => {
    if (isInitialLoad.current) return;
    const stateToSave = { calculators, activeTabId, theme, isCompact, darkMode, isPinned };
    try {
        localStorage.setItem('prisma-calc-state', JSON.stringify(stateToSave));
    } catch (error) { console.error("Falha ao salvar estado local:", error); }
  }, [calculators, activeTabId, theme, isCompact, darkMode, isPinned]);

  // Salvar estado para Nuvem (Apenas mudanças estruturais e de tema)
  useEffect(() => {
      if (isInitialLoad.current) return;
      
      const stateToSave = { 
          calculators,
          activeTabId, 
          theme, 
          darkMode,
      };
      saveSettingsToCloud(stateToSave);
  }, [calculatorStructure, activeTabId, theme, darkMode, saveSettingsToCloud]);


  // Salvar histórico
  useEffect(() => {
    try {
      localStorage.setItem('prismaCryptoHistory', JSON.stringify(history));
    } catch (error) { console.error("Falha ao salvar histórico:", error); }
  }, [history]);
  
  const handleUpdateInstance = useCallback((partialState) => {
    setCalculators(prev => 
      prev.map(calc => calc.id === activeTabId ? { ...calc, ...partialState } : calc)
    );
  }, [activeTabId]);

  const handleClearActiveTabFields = () => {
    setCalculators(prev =>
      prev.map(calc => {
        if (calc.id === activeTabId) {
          if (calc.type === 'funding') {
            return {
              ...calc,
              positionSize: '', shortExchangeFR: '', longExchangeFR: '', log: []
            };
          }
          return {
            ...calc,
            openingExch1: '', openingExch2: '', closingExch1: '', closingExch2: '',
            totalCoins: '', purchases: [{ value: '', id: Date.now() }],
          };
        }
        return calc;
      })
    );
  };

  const handleRenameTab = (id: number, newName: string) => {
    setCalculators(prev =>
        prev.map(calc => (calc.id === id ? { ...calc, name: newName } : calc))
    );
  };
  
  const handleAddArbitrageTab = useCallback(() => {
    const arbitrageCalcs = calculators.filter(c => c.type === 'arbitrage');
    const existingNumbers = arbitrageCalcs
        .map(c => {
            const match = c.name.match(/^C (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .sort((a, b) => a - b);

    let newCount = 1;
    for (const num of existingNumbers) {
        if (num === newCount) {
            newCount++;
        } else {
            break; // Found a gap
        }
    }

    const newId = Date.now();
    const newCalc = getNewCalculator(newId, newCount);
    setCalculators(prev => [...prev, newCalc]);
    setActiveTabId(newId);
    return newId;
  }, [calculators]);
  
  const handleAddFundingTab = useCallback(() => {
    const fundingCalcs = calculators.filter(c => c.type === 'funding');
    const existingNumbers = fundingCalcs
        .map(c => {
            const match = c.name.match(/^FR (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .sort((a, b) => a - b);

    let newCount = 1;
    for (const num of existingNumbers) {
        if (num === newCount) {
            newCount++;
        } else {
            break; // Found a gap
        }
    }

    const newId = Date.now();
    const newCalc = getNewFundingCalculator(newId, newCount);
    setCalculators(prev => [...prev, newCalc]);
    setActiveTabId(newId);
    return newId;
  }, [calculators]);
  
  const handleRemoveTab = (idToRemove) => {
    const currentTabIndex = calculators.findIndex(c => c.id === idToRemove);
    const remainingCalculators = calculators.filter(c => c.id !== idToRemove);
    
    if (remainingCalculators.length === 0) {
      const newCalc = getNewCalculator(Date.now(), 1);
      setCalculators([newCalc]);
      setActiveTabId(newCalc.id);
      return;
    }

    if (idToRemove === activeTabId) {
      const newActiveIndex = Math.max(0, currentTabIndex - 1);
      setActiveTabId(remainingCalculators[newActiveIndex].id);
    }
    
    setCalculators(remainingCalculators);
  };

  const addToHistory = useCallback((type, inputs, result, tabName) => {
    if (!result || result === '0.00' || result === '0.0000') return;
    const newItem = { id: Date.now(), timestamp: new Date().toISOString(), type, inputs, result, tabName };
    setHistory(prev => [newItem, ...prev].slice(0, 50));
  }, []);

  const handleDeleteHistory = (id) => setHistory(prev => prev.filter(item => item.id !== id));
  const handleClearHistory = () => {
    setHistory([]);
    setShowHistory(false);
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuEl = document.querySelector('.menu-container');
      if (showMenu && menuEl && !menuEl.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 't') { event.preventDefault(); handleAddArbitrageTab(); }
      if (event.ctrlKey && event.key === 'w') { event.preventDefault(); if (calculators.length > 0) handleRemoveTab(activeTabId); }
      if (event.ctrlKey && event.key === 'd') { event.preventDefault(); setDarkMode(!darkMode); }
      if (event.ctrlKey && event.key === 'p') { event.preventDefault(); setIsPinned(!isPinned); }
      if (event.ctrlKey && event.key === 'm') { event.preventDefault(); setIsCompact(!isCompact); }
      if (event.ctrlKey && event.key === 'h' && activeCalculator?.type === 'arbitrage') { event.preventDefault(); handleUpdateInstance({showAverage: !activeCalculator?.showAverage}); }
      if (event.key === 'Escape') {
        if (showThemePanel) setShowThemePanel(false);
        else if (showHistory) setShowHistory(false);
        else if (showShortcuts) setShowShortcuts(false);
        else if (showAbout) setShowAbout(false);
        else if (showMenu) setShowMenu(false);
        else if (showTutorial) setShowTutorial(false);
      }
      if (event.key === 'F1') { event.preventDefault(); setShowAbout(true); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [darkMode, isPinned, isCompact, showAbout, showMenu, showHistory, showThemePanel, showTutorial, showShortcuts, activeTabId, calculators, activeCalculator, setDarkMode, handleAddArbitrageTab, handleUpdateInstance]);

  const fetchDollarRate = useCallback(async () => {
    setDollarLoading(true);
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      if (response.ok) {
        const data = await response.json();
        setDollarRate(parseFloat(data.USDBRL.bid));
        setLastDollarUpdate(new Date());
      }
    } catch (error) { console.error('Erro ao buscar cotação do dólar:', error); }
    finally { setDollarLoading(false); }
  }, []);

  useEffect(() => {
    fetchDollarRate();
    const interval = setInterval(fetchDollarRate, 300000);
    return () => clearInterval(interval);
  }, [fetchDollarRate]);

  return (
    <div ref={containerRef} className={`min-w-64 ${isCompact ? 'max-w-xs' : 'max-w-sm'} w-full shadow-2xl flex flex-col transition-all duration-300 bg-[var(--color-bg-primary)] overflow-hidden`}>
      
      <div 
        className={`flex items-center justify-between px-3 py-2 border-b select-none border-[var(--color-border)] bg-[var(--color-card-bg)] drag-region`}
      >
        {/* Left Section */}
        <div className="flex items-center gap-1.5">
          <Calculator className={`w-4 h-4 text-[var(--color-primary)]`} />
          {!isCompact && (
            <h1 className={`text-sm font-semibold text-[var(--color-text-header)]`}>
              Prisma 💎
            </h1>
          )}
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-1 no-drag-region" data-tutorial-id="header-controls">
          {!isCompact && activeCalculator?.type === 'arbitrage' &&
            <button data-tutorial-id="average-price-toggle" onClick={() => handleUpdateInstance({showAverage: !activeCalculator?.showAverage})} className={`flex items-center justify-center p-1 rounded transition-colors hover:bg-[var(--color-bg-hover)]`} title={activeCalculator?.showAverage ? "Ocultar painel de preço médio (Ctrl+H)" : "Mostrar painel de preço médio (Ctrl+H)"}>
              {activeCalculator?.showAverage ? <Eye className={`w-3.5 h-3.5 text-[var(--color-text-secondary)]`} /> : <EyeOff className={`w-3.5 h-3.5 text-[var(--color-text-secondary)]`} />}
            </button>
          }
           <button onClick={() => setIsCompact(!isCompact)} className={`flex items-center justify-center p-1 rounded transition-colors hover:bg-[var(--color-bg-hover)]`} title={isCompact ? 'Modo Completo (Ctrl+M)' : 'Modo Compacto (Ctrl+M)'}>
            {isCompact ? <Maximize2 className={`w-3.5 h-3.5 text-[var(--color-text-secondary)]`} /> : <Minimize2 className={`w-3.5 h-3.5 text-[var(--color-text-secondary)]`} />}
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className={`flex items-center justify-center p-1 rounded transition-colors hover:bg-[var(--color-bg-hover)]`} title="Alternar tema claro/escuro (Ctrl+D)">
            {darkMode ? <Sun className="w-3.5 h-3.5 text-yellow-500" /> : <Moon className={`w-3.5 h-3.5 text-[var(--color-text-secondary)]`} />}
          </button>
          <button onClick={() => setIsPinned(!isPinned)} className={`flex items-center justify-center p-1 rounded transition-colors ${isPinned ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'}`} title={isPinned ? "Desafixar janela (Ctrl+P)" : "Fixar janela (Ctrl+P)"}>
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          
          <div className="relative menu-container">
            <button data-tutorial-id="menu-button" onClick={() => setShowMenu(!showMenu)} className={`flex items-center justify-center p-1 rounded transition-colors hover:bg-[var(--color-bg-hover)]`} title="Abrir menu de opções">
              <Menu className={`w-3.5 h-3.5 text-[var(--color-text-secondary)]`} />
            </button>
            
            {showMenu && (
              <div className={`absolute right-0 top-full mt-1 w-64 rounded border shadow-lg z-20 bg-[var(--color-card-bg)] border-[var(--color-border)]`}>
                <div className="flex justify-between items-center px-3 py-2 border-b border-[var(--color-border)]">
                    <div>
                        <p className="text-xs text-[var(--color-text-secondary)]">Logado como</p>
                        <p className="text-sm font-semibold truncate text-[var(--color-text-header)]" title={user.username}>{user.username}</p>
                    </div>
                    <div 
                      data-tutorial-id="dollar-rate-in-menu"
                      className={`flex items-center gap-1 text-xs`}
                      title={dollarLoading ? 'Atualizando...' : lastDollarUpdate ? `Cotação do Dólar (USD para BRL). Última atualização: ${lastDollarUpdate.toLocaleString('pt-BR')}` : 'Cotação indisponível'}
                    >
                        <span className={`font-semibold text-[var(--color-text-primary)]`}>
                            {dollarLoading ? '...' : dollarRate ? `R$${dollarRate.toFixed(2)}` : 'N/A'}
                        </span>
                        <button onClick={fetchDollarRate} disabled={dollarLoading} className="flex items-center justify-center p-0.5 rounded-full hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-wait" title="Atualizar cotação do dólar agora">
                            <RefreshCw className={`w-3 h-3 text-[var(--color-text-secondary)] ${dollarLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
                <button
                  data-tutorial-id="tutorial-button-in-menu"
                  onClick={() => { setShowTutorial(true); setShowMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]`}
                  title="Iniciar o tutorial guiado do aplicativo"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Tutorial
                </button>
                <button
                  onClick={() => { setShowHistory(true); setShowMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]`}
                  title="Acessar histórico de cálculos salvos"
                >
                  <History className="w-3.5 h-3.5" /> Histórico
                </button>
                <button
                  onClick={() => { setShowThemePanel(true); setShowMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]`}
                  title="Abrir painel de personalização de tema"
                >
                  <Palette className="w-3.5 h-3.5" /> Tema
                </button>
                <button
                  onClick={() => { setShowShortcuts(true); setShowMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]`}
                  title="Ver atalhos de teclado do aplicativo"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Atalhos
                </button>
                <button
                  onClick={() => { setShowAbout(true); setShowMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]`}
                  title="Ver informações sobre o aplicativo e atalhos"
                >
                  <Info className="w-3.5 h-3.5" /> Sobre
                </button>
                <div className="border-t border-[var(--color-border)]">
                    <button
                      onClick={() => { logout(); setShowMenu(false); }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-hover-bg)]`}
                      title="Sair da sua conta"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sair
                    </button>
                </div>
              </div>
            )}
          </div>
           {/* Electron Window Controls */}
           <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-[var(--color-border)]">
            <button onClick={() => handleWindowCommand('minimize')} className="flex items-center justify-center p-1 rounded transition-colors hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]" title="Minimizar">
                <Minus className="w-4 h-4" />
            </button>
            <button onClick={() => handleWindowCommand('close')} className="flex items-center justify-center p-1 rounded transition-colors text-[var(--color-danger)] hover:bg-[var(--color-danger-hover-bg)]" title="Fechar">
                <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

       {/* Tab Bar */}
      {!isCompact && (
        <div className={`flex items-center px-1 border-b border-[var(--color-border)] select-none`} data-tutorial-id="tab-bar">
            <div className="flex-1 flex items-center overflow-x-auto">
                {calculators.map(calc => {
                    const isEditing = editingTabId === calc.id;
                    const isActive = activeTabId === calc.id;

                    if (isEditing) {
                        return (
                            <input
                                key={calc.id}
                                type="text"
                                value={calc.name}
                                autoFocus
                                onFocus={e => e.currentTarget.select()}
                                onChange={e => handleRenameTab(calc.id, e.target.value)}
                                onBlur={() => setEditingTabId(null)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === 'Escape') {
                                        setEditingTabId(null);
                                    }
                                }}
                                className={`flex-shrink-0 w-32 px-2 py-1.5 border-r text-xs outline-none bg-[var(--color-input-bg)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-1 focus:ring-[var(--color-primary)]`}
                            />
                        );
                    }

                    return (
                        <button
                            key={calc.id}
                            data-tutorial-id={`tab-${calc.type}`}
                            onClick={() => setActiveTabId(calc.id)}
                            onDoubleClick={() => setEditingTabId(calc.id)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 border-r text-xs whitespace-nowrap transition-colors border-[var(--color-border)] ${
                                isActive
                                    ? 'bg-[var(--color-tab-active-bg)] text-[var(--color-tab-active-text)]'
                                    : 'text-[var(--color-tab-inactive-text)] hover:bg-[var(--color-tab-inactive-hover-bg)]'
                            }`}
                            title={`${calc.name} (Duplo clique para renomear)`}
                        >
                            {calc.type === 'funding' ? <Zap className="w-3 h-3" /> : <Pilcrow className="w-3 h-3"/>}
                            <span className="truncate max-w-24">{calc.name}</span>
                            <span title="Fechar esta aba (Ctrl+W)">
                                <X
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTab(calc.id);
                                    }}
                                    className={`w-3 h-3 rounded-full p-0.5 hover:bg-[var(--color-bg-hover)]`}
                                />
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="flex items-center" data-tutorial-id="add-tab-buttons">
                <button onClick={handleClearActiveTabFields} className={`flex items-center justify-center p-1.5 transition-colors text-[var(--color-danger)] hover:bg-[var(--color-danger-hover-bg)]`} title="Limpar todos os campos da aba atual">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-[var(--color-border)] mx-1"></div>
                <button onClick={handleAddFundingTab} className={`flex items-center justify-center p-1.5 transition-colors text-yellow-500 hover:bg-[var(--color-bg-hover)]`} title="Adicionar nova aba de calculadora de Funding">
                    <Zap className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleAddArbitrageTab} className={`flex items-center justify-center p-1.5 transition-colors text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]`} title="Adicionar nova aba de calculadora de Arbitragem (Ctrl+T)">
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
      )}


      <HistoryPanel 
        show={showHistory} 
        onClose={() => setShowHistory(false)} 
        history={history}
        onDelete={handleDeleteHistory}
        onClear={handleClearHistory}
      />

      <ThemePanel
        show={showThemePanel}
        onClose={() => setShowThemePanel(false)}
        theme={theme}
        onThemeUpdate={(newTheme) => {
            setTheme(newTheme);
        }}
        onReset={() => {
            setTheme(defaultTheme);
        }}
        darkMode={darkMode}
      />

      <Tutorial
        show={showTutorial}
        onClose={() => setShowTutorial(false)}
        calculators={calculators}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        activeCalculator={activeCalculator}
        handleAddFundingTab={handleAddFundingTab}
        handleAddArbitrageTab={handleAddArbitrageTab}
        handleUpdateInstance={handleUpdateInstance}
        setShowMenu={setShowMenu}
      />
      
      <ShortcutsPanel show={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-80 rounded-lg p-6 shadow-xl bg-[var(--color-card-bg)]`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold text-[var(--color-text-header)]`}>Sobre</h2>
              <span title="Fechar janela 'Sobre'">
                <button onClick={() => setShowAbout(false)} className={`flex items-center justify-center p-1 rounded-full transition-colors hover:bg-[var(--color-bg-hover)]`}>
                  <X className={`w-4 h-4 text-[var(--color-text-secondary)]`} />
                </button>
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Calculator className={`w-5 h-5 text-[var(--color-primary)]`} /><span className={`font-medium text-[var(--color-text-header)]`}>Prisma 💎 (v{appVersion})</span></div>
              <p className={`text-sm text-[var(--color-text-secondary)]`}>Calculadora especializada para arbitragem de criptomoedas com cotação do dólar em tempo real.</p>
              <div className="pt-3 border-t border-[var(--color-border)]">
                <a href="https://www.prismarb.com.br" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm transition-colors text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]`} title="Visitar o site oficial do Prisma">
                  <ExternalLink className="w-4 h-4" /> www.prismarb.com.br
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
          {activeCalculator && (
            (activeCalculator.type === 'funding') ? (
                <FundingRateInstance
                    key={activeCalculator.id}
                    instanceData={activeCalculator}
                    onUpdate={handleUpdateInstance}
                    onAddToHistory={addToHistory}
                />
            ) : isCompact ? (
                <CompactCalculatorInstance 
                    key={activeCalculator.id}
                    instanceData={activeCalculator}
                    onUpdate={handleUpdateInstance}
                />
            ) : (
                <CalculatorInstance 
                    key={activeCalculator.id}
                    instanceData={activeCalculator}
                    onUpdate={handleUpdateInstance}
                    onAddToHistory={addToHistory}
                />
            )
          )}
      </div>
      
      {updateAvailable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-card-bg)] px-4 py-2 rounded-lg shadow-2xl flex items-center gap-4 border border-[var(--color-border)]">
            <ArrowUpCircle className="w-5 h-5 text-[var(--color-primary)]" />
            <div>
                <p className="text-sm font-semibold text-[var(--color-text-header)]">Atualização disponível!</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Reinicie para instalar a nova versão.</p>
            </div>
            <button 
                onClick={() => window.electronAPI?.restartApp()}
                className="px-3 py-1 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-md hover:bg-[var(--color-primary-hover)] whitespace-nowrap"
                title="Reiniciar o aplicativo e instalar a atualização"
            >
                Reiniciar
            </button>
        </div>
      )}
    </div>
  );
};


const AppContent = () => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const hasPermission = user?.plan === 'Premium' || user?.role === 'admin';

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-primary)]">
                <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <LoginScreen />;
    }
    
    if (!hasPermission) {
        return <SubscriptionGate />;
    }
    
    return <CryptoCalculator />;
};

// Componente que aplica o tema globalmente
const ThemedAppWrapper = () => {
    const { theme, darkMode } = useTheme();
    const themeStyle = useMemo(() => generateThemeStyle(theme, darkMode), [theme, darkMode]);

    return (
        <>
            <style>{themeStyle}</style>
            <AppContent />
        </>
    );
};

// Componente principal que envolve a aplicação com os provedores
const App = () => {
  return (
      <ThemeProvider>
        <AuthProvider>
            <ThemedAppWrapper />
        </AuthProvider>
      </ThemeProvider>
  );
};

export default App;