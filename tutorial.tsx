/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const tutorialSteps = [
    {
        title: 'Bem-vindo ao Prisma 💎',
        content: 'Este tutorial irá guiá-lo pelas principais funcionalidades da calculadora. Use os botões abaixo para navegar.',
        position: 'center',
    },
    {
        elementId: 'header-controls',
        title: 'Controles Rápidos',
        content: 'Esses botões permitem: alternar a visibilidade do preço médio (em abas de arbitragem), modo compacto, tema claro/escuro e fixar a janela.',
        position: 'bottom',
    },
    {
        elementId: 'menu-button',
        title: 'Menu Principal',
        content: 'No menu você pode acessar a cotação do dólar, seu histórico de cálculos, o personalizador de temas, informações sobre o app e sair da sua conta.',
        position: 'bottom',
        action: async ({ setShowMenu }) => {
            setShowMenu(true);
            await wait(100);
        },
    },
    {
        elementId: 'dollar-rate-in-menu',
        title: 'Cotação do Dólar',
        content: 'Aqui você vê a cotação do dólar em tempo real. Ela é atualizada automaticamente a cada 5 minutos, ou você pode forçar uma atualização clicando no ícone.',
        position: 'bottom',
        action: async ({ setShowMenu }) => {
            setShowMenu(true);
            await wait(100);
        },
    },
    {
        elementId: 'tab-bar',
        title: 'Gerenciamento de Abas',
        content: 'Você pode ter várias calculadoras abertas simultaneamente. Clique em uma aba para selecioná-la e dê um duplo clique para renomear.',
        position: 'bottom',
        action: async ({ setShowMenu }) => {
            setShowMenu(false);
            await wait(100);
        },
    },
    {
        elementId: 'add-tab-buttons',
        title: 'Adicionar Novas Abas',
        content: 'Use estes botões para limpar os campos da aba atual, adicionar uma nova calculadora de Funding (ícone de raio) ou uma nova calculadora de Arbitragem (ícone de mais).',
        position: 'bottom',
    },
    {
        elementId: 'tab-arbitrage',
        title: 'Calculadora de Arbitragem',
        content: 'Vamos começar pela calculadora de arbitragem, usada para encontrar a diferença percentual entre preços de ativos em duas exchanges.',
        position: 'bottom',
        action: async ({ calculators, setActiveTabId, handleAddArbitrageTab, activeTabId }) => {
            let arbTab = calculators.find(c => c.type === 'arbitrage');
            if (!arbTab) {
                const newId = handleAddArbitrageTab();
                setActiveTabId(newId);
                await wait(100);
            } else if (activeTabId !== arbTab.id) {
                setActiveTabId(arbTab.id);
                await wait(100);
            }
        },
    },
    {
        elementId: 'arbitrage-opening',
        title: 'Cálculo de Abertura',
        content: 'Insira os preços de compra (Ex1) e venda (Ex2) para a sua operação de abertura. O resultado percentual é calculado automaticamente.',
        position: 'bottom',
    },
    {
        elementId: 'arbitrage-save',
        title: 'Salvar no Histórico',
        content: 'Após preencher os campos, clique no ícone de calendário para salvar este cálculo específico em seu histórico.',
        position: 'right',
    },
    {
        elementId: 'average-price-toggle',
        title: 'Calcular Preço Médio',
        content: 'Clique neste ícone para mostrar/ocultar a calculadora de preço médio, útil para operações com múltiplas compras.',
        position: 'bottom',
        action: async ({ activeCalculator, handleUpdateInstance }) => {
            if (!activeCalculator.showAverage) {
                handleUpdateInstance({ showAverage: true });
                await wait(100);
            }
        },
    },
    {
        elementId: 'arbitrage-average',
        title: 'Calculadora de Preço Médio',
        content: 'Informe a quantidade total de moedas e os valores em dólar de cada compra. O sistema calculará o preço médio pago por moeda.',
        position: 'top',
    },
    {
        elementId: 'tab-funding',
        title: 'Calculadora de Funding',
        content: 'Agora, vamos ver a calculadora de Funding Rate, usada para projetar lucros/prejuízos de estratégias de "funding farming".',
        position: 'bottom',
        action: async ({ calculators, setActiveTabId, handleAddFundingTab, activeTabId }) => {
            let fundingTab = calculators.find(c => c.type === 'funding');
            if (!fundingTab) {
                const newId = handleAddFundingTab();
                setActiveTabId(newId);
                await wait(100);
            } else if (activeTabId !== fundingTab.id) {
                setActiveTabId(fundingTab.id);
                await wait(100);
            }
        },
    },
    {
        elementId: 'funding-position',
        title: 'Dados da Posição',
        content: 'Insira o tamanho total da sua posição (short + long), a alavancagem utilizada e o intervalo em horas de pagamento do funding.',
        position: 'bottom',
    },
    {
        elementId: 'funding-rates',
        title: 'Taxas de Funding (FR)',
        content: 'Informe as taxas de funding (FR) das suas posições SHORT e LONG. Use valores negativos para taxas negativas.',
        position: 'bottom',
    },
    {
        elementId: 'funding-results',
        title: 'Resultados e Projeções',
        content: 'Aqui você encontra as projeções de lucro, a margem necessária e o APY estimado com base nos dados inseridos.',
        position: 'top',
    },
    {
        elementId: 'funding-log',
        title: 'Log de Funding',
        content: 'A cada período de funding, você pode registrar o resultado aqui para acompanhar seu lucro/prejuízo acumulado na operação.',
        position: 'top',
    },
    {
        title: 'Fim do Tutorial!',
        content: 'Você concluiu o tour pelas funcionalidades. Explore a calculadora e bons trades! Pressione ESC ou clique em Fechar para sair.',
        position: 'center',
    },
];

interface TutorialProps {
    show: boolean;
    onClose: () => void;
    calculators: any[];
    activeTabId: number;
    setActiveTabId: (id: number) => void;
    activeCalculator: any;
    handleAddFundingTab: () => number;
    handleAddArbitrageTab: () => number;
    handleUpdateInstance: (update: any) => void;
    setShowMenu: (show: boolean) => void;
}

const Tutorial = ({ show, onClose, ...actionProps }: TutorialProps) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({ display: 'none' });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const actionPropsRef = useRef(actionProps);
    actionPropsRef.current = actionProps;

    const currentStep = tutorialSteps[stepIndex];

    const positionTooltip = useCallback(() => {
        if (!currentStep) return;

        const { elementId, position } = currentStep;
        
        if (position === 'center' || !elementId) {
            setSpotlightStyle({ display: 'none' });
            setTooltipStyle({
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 1
            });
            return;
        }

        const targetElement = document.querySelector<HTMLElement>(`[data-tutorial-id="${elementId}"]`);
        if (!targetElement) {
            setSpotlightStyle({ display: 'none' });
            // Hide tooltip if element not found, maybe retry later
            setTooltipStyle(prev => ({ ...prev, opacity: 0 }));
            return;
        }

        const targetRect = targetElement.getBoundingClientRect();
        const tooltipEl = tooltipRef.current;
        const tooltipRect = tooltipEl ? tooltipEl.getBoundingClientRect() : { width: 288, height: 150 }; // Default size

        setSpotlightStyle({
            display: 'block',
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
        });

        let top;
        let left;
        const offset = 12;

        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - offset;
                left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                break;
            case 'right':
                top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                left = targetRect.right + offset;
                break;
            case 'left':
                 top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                 left = targetRect.left - tooltipRect.width - offset;
                break;
            case 'bottom':
            default:
                top = targetRect.bottom + offset;
                left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                break;
        }
        
        // Boundary checks
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        if ((left + tooltipRect.width) > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        if ((top + tooltipRect.height) > window.innerHeight - 8) {
            top = window.innerHeight - tooltipRect.height - 8;
        }


        setTooltipStyle({ top: `${top}px`, left: `${left}px`, opacity: 1 });

    }, [currentStep]);

    useLayoutEffect(() => {
        if (!show) return;

        const runStep = async () => {
            setTooltipStyle(prev => ({ ...prev, opacity: 0 }));
            if (currentStep.action) {
                await currentStep.action(actionPropsRef.current);
            }
            // Use timeout to allow DOM to update after action
            setTimeout(positionTooltip, 50);
        };
        
        runStep();
        
        window.addEventListener('resize', positionTooltip);
        return () => window.removeEventListener('resize', positionTooltip);

    }, [stepIndex, show, currentStep, positionTooltip]);

    const handleNext = () => {
        if (stepIndex < tutorialSteps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            handleClose();
        }
    };
    
    const handlePrev = () => {
        if (stepIndex > 0) {
            setStepIndex(stepIndex - 1);
        }
    };

    const handleClose = () => {
        setTooltipStyle({ opacity: 0 });
        setSpotlightStyle({ display: 'none' });
        actionPropsRef.current.setShowMenu(false); // Ensure menu is closed on exit
        onClose();
        // Reset to first step for next time
        setTimeout(() => setStepIndex(0), 300);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!show) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') handleClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, stepIndex]);


    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200]">
            <div 
                style={spotlightStyle} 
                className="fixed rounded-md transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none" 
            />
            
            <div
                ref={tooltipRef}
                style={tooltipStyle}
                className="fixed z-[201] w-72 rounded-lg bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-xl transition-all duration-300"
            >
                <div className="p-4">
                    <h3 className="text-md font-semibold text-[var(--color-text-header)] mb-2">{currentStep.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">{currentStep.content}</p>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-alt)] border-t border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        Passo {stepIndex + 1} de {tutorialSteps.length}
                    </p>
                    <div className="flex items-center gap-2">
                        {stepIndex > 0 && (
                             <button onClick={handlePrev} className="p-1 rounded transition-colors hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]" title="Passo anterior (Seta Esquerda)">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={handleNext} 
                            className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-white rounded-md transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                            title={stepIndex < tutorialSteps.length - 1 ? 'Próximo passo (Seta Direita)' : 'Finalizar Tutorial'}
                        >
                           {stepIndex < tutorialSteps.length - 1 ? 'Próximo' : 'Finalizar'}
                           {stepIndex < tutorialSteps.length - 1 && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                 <button onClick={handleClose} className="absolute top-2 right-2 p-1 rounded-full transition-colors hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]" title="Fechar tutorial (ESC)">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Tutorial;