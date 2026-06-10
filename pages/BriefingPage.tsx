import React, { useState, useEffect, useContext } from 'react';
import { getBriefings } from '../services/api';
import { Briefing } from '../types';
import { AppContext } from '../context/AppContext';

const BriefingPage: React.FC<{ navigateTo: (page: string) => void }> = () => {
    const [briefings, setBriefings] = useState<Briefing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { selectedMandato } = useContext(AppContext)!;

    useEffect(() => {
        const fetchDados = async () => {
            setIsLoading(true);
            const data = await getBriefings(selectedMandato === 'Todos' || selectedMandato === 'Ambos' ? undefined : selectedMandato);
            setBriefings(data);
            setIsLoading(false);
        };
        fetchDados();
    }, [selectedMandato]);

    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dataAtual = hoje.charAt(0).toUpperCase() + hoje.slice(1);
    const quantidadeSemana = briefings.length;

    // Agrupando por data
    const groupedBriefings = briefings.reduce((acc, briefing) => {
        const dateObj = new Date(briefing.data_publicacao);
        const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(briefing);
        return acc;
    }, {} as Record<string, Briefing[]>);

    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-10 max-w-7xl mx-auto items-start">
                
                {/* ── CENTRO: PAUTAS DA SEMANA ── */}
                <div className="space-y-8">
                    {/* Header Pautas */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-navy-dark dark:text-white">
                                Pautas da <span className="font-light text-slate-400 dark:text-slate-500">Semana</span>
                            </h1>
                            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                                Lincoln pressiona bancos por segurança de idosos enquanto Marilda fiscaliza manutenção urbana e saúde em BH
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {dataAtual}
                            </div>
                            <div className="text-4xl md:text-5xl font-black text-navy-dark dark:text-white leading-none my-1">
                                {quantidadeSemana}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                PAUTAS CARREGADAS
                            </div>
                        </div>
                    </div>

                    {/* Separator Line */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-navy-dark dark:text-slate-200">Pautas do Banco de Dados</span>
                            <span className="bg-navy-dark dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">AO VIVO</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{quantidadeSemana} pautas</span>
                    </div>

                    {/* Grid de Cards Pautas */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20 text-slate-400">
                            <span className="material-symbols-outlined animate-spin mr-2">sync</span> Carregando pautas...
                        </div>
                    ) : briefings.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700">
                            Nenhuma pauta ou briefing publicado no momento para este filtro.
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {Object.entries(groupedBriefings).map(([dateLabel, items]) => (
                                <div key={dateLabel}>
                                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        {dateLabel}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                        {items.map(briefing => (
                                            <div key={briefing.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group cursor-pointer">
                                                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${briefing.origem.includes('Marilda') ? 'text-pink-600 dark:text-pink-400' : briefing.origem.includes('Alê') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${briefing.origem.includes('Marilda') ? 'bg-pink-600 dark:bg-pink-400' : briefing.origem.includes('Alê') ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-600 dark:bg-slate-400'}`}></div> {briefing.origem.split(' ')[0]}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${briefing.prioridade === 'ALTA' ? 'text-red-600 dark:text-red-400' : briefing.prioridade === 'MÉDIA' ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                                                        {briefing.prioridade}
                                                    </span>
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col gap-3">
                                                    <h3 className="text-base font-bold text-navy-dark dark:text-white leading-tight">{briefing.titulo}</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        {briefing.descricao}
                                                    </p>
                                                    {briefing.acao_sugerida && (
                                                        <div className="mt-auto pt-4">
                                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                                                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed flex">
                                                                    <span className="text-slate-400 mr-2">→</span> 
                                                                    {briefing.acao_sugerida}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {briefing.acao_sugerida && (
                                                    <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/50">
                                                        <button className="bg-navy-dark hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors w-auto">
                                                            Copiar texto
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── DIREITA: FERRAMENTAS ── */}
                <div className="flex flex-col gap-8 xl:sticky xl:top-8 mt-10 xl:mt-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-navy-dark dark:text-white">Ferramentas Integradas</h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-2">
                            ACESSO DIRETO AO ECOSSISTEMA PORTELA
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-2 border-b border-slate-200 dark:border-slate-700/50">
                            GOOGLE OPAL
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-navy-dark dark:text-white">Emendas Lincoln</span>
                                    <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">Opal</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Monitoramento de emendas parlamentares federais.
                                </p>
                                <button 
                                    onClick={() => window.open('https://opal.google/app/1Ceo3fDrNOzSkN3PZrjIUMn0MxL8CTTiT', '_blank')}
                                    className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span> ABRIR
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-navy-dark dark:text-white">Geral Lincoln</span>
                                    <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">Opal</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Painel geral do mandato federal Lincoln Portela.
                                </p>
                                <button 
                                    onClick={() => window.open('https://opal.portela.app', '_blank')}
                                    className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span> ABRIR
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-navy-dark dark:text-white">Geral Marilda</span>
                                    <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">Opal</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Painel geral do mandato municipal Marilda Portela.
                                </p>
                                <button 
                                    onClick={() => window.open('https://opal.portela.app', '_blank')}
                                    className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span> ABRIR
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-2 border-b border-slate-200 dark:border-slate-700/50">
                            GEMS GEMINI
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-navy-dark dark:text-white">Especialista Lincoln</span>
                                    <span className="bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">Gem</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    IA especializada no mandato federal.
                                </p>
                                <button 
                                    onClick={() => window.open('https://opal.google/app/12VLpXQjDENmdIL0FEBeK87FQhKqAA6F3', '_blank')}
                                    className="bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span> ABRIR
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-navy-dark dark:text-white">Especialista Marilda</span>
                                    <span className="bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">Gem</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    IA especializada no mandato municipal.
                                </p>
                                <button 
                                    onClick={() => window.open('https://opal.google/app/15pIgCT3CMNCkHDo4VdG6C6uEeG_tbQ7u', '_blank')}
                                    className="bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span> ABRIR
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-slate-700/50 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-navy-dark dark:text-white">Especialista Alê</span>
                                    <span className="bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">Gem</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    IA especializada no mandato do deputado estadual.
                                </p>
                                <button 
                                    onClick={() => window.open('https://opal.google/app/1SiJLLd0_5_JfLDe2mvpEyIfZw92-GVfX', '_blank')}
                                    className="bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span> ABRIR
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-2 border-b border-slate-200 dark:border-slate-700/50">
                            FERRAMENTAS ADICIONADAS
                        </h3>
                        <div className="border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-turquoise/5 hover:border-turquoise/30 dark:hover:border-turquoise/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                            <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-turquoise transition-colors mb-2">add_circle</span>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-turquoise transition-colors">Adicionar ferramenta</span>
                            <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Link externo ou API própria</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BriefingPage;
