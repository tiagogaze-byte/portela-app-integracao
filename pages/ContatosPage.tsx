import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { getLiderancas, getAssessores, getApoiadores } from '../services/api';
import { Lideranca, Assessor, Apoiador } from '../types';
import Loader from '../components/Loader';

interface UnifiedContact {
    id: string;
    nome: string;
    tipo: 'Liderança' | 'Assessor' | 'Apoiador';
    cargoOuPartido: string;
    municipioOuRegiao: string;
    telefone: string;
    email: string;
    avatarUrl?: string;
    origem: string;
}

const ContatosPage: React.FC<{ navigateTo: (page: string, params?: any) => void }> = ({ navigateTo }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { selectedMandato } = context;

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('Todos');
    
    const [contatos, setContatos] = useState<UnifiedContact[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchAllContacts = async () => {
            setLoading(true);
            try {
                const [liderancasData, assessoresData, apoiadoresData] = await Promise.all([
                    getLiderancas(),
                    getAssessores(),
                    getApoiadores()
                ]);

                if (isMounted) {
                    const unified: UnifiedContact[] = [
                        ...liderancasData.map((l: Lideranca) => ({
                            id: `lid_${l.id}`,
                            originalId: l.id,
                            nome: l.nome,
                            tipo: 'Liderança' as const,
                            cargoOuPartido: `${l.cargo} ${l.partido ? `(${l.partido})` : ''}`,
                            municipioOuRegiao: `${l.municipio} - ${l.regiao}`,
                            telefone: l.contato || '',
                            email: l.email || '',
                            avatarUrl: l.avatarUrl,
                            origem: l.origem || 'Geral'
                        })),
                        ...assessoresData.map((a: Assessor) => ({
                            id: `ass_${a.id}`,
                            originalId: a.id,
                            nome: a.nome,
                            tipo: 'Assessor' as const,
                            cargoOuPartido: a.cargo,
                            municipioOuRegiao: a.regiaoAtuacao,
                            telefone: a.telefone || '',
                            email: a.email || '',
                            avatarUrl: a.avatarUrl,
                            origem: a.origem || 'Geral'
                        })),
                        ...apoiadoresData.map((ap: Apoiador) => ({
                            id: `apo_${ap.id}`,
                            originalId: ap.id,
                            nome: ap.nome,
                            tipo: 'Apoiador' as const,
                            cargoOuPartido: ap.cargo || 'Apoiador',
                            municipioOuRegiao: ap.municipio?.nome || 'Não informado',
                            telefone: ap.telefone || '',
                            email: ap.email || '',
                            avatarUrl: ap.fotoUrl,
                            origem: 'Geral' // Apoiadores might not have strict mandate origin in types, defaulting
                        }))
                    ];
                    
                    // Sort alphabetically
                    unified.sort((a, b) => a.nome.localeCompare(b.nome));
                    setContatos(unified);
                }
            } catch (err) {
                console.error("Erro ao carregar contatos unificados", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAllContacts();
        return () => { isMounted = false; };
    }, []);

    const filteredContacts = useMemo(() => {
        return contatos.filter(c => {
            // Filter by Mandato
            if (selectedMandato !== 'Todos') {
                const isMatch = c.origem.toLowerCase().includes(selectedMandato.toLowerCase()) || 
                                (selectedMandato.toLowerCase().includes('ale') && c.origem.toLowerCase().includes('ale')) ||
                                (selectedMandato.toLowerCase().includes('lincoln') && c.origem.toLowerCase().includes('lincoln')) ||
                                (selectedMandato.toLowerCase().includes('marilda') && c.origem.toLowerCase().includes('marilda'));
                
                // If it's an Apoiador and we don't have mandate segregation yet, we might want to show them anyway or hide them.
                // For now, let's strictly filter if they have an origin, except if they are just "Geral".
                if (!isMatch && c.tipo !== 'Apoiador') return false; 
            }

            // Filter by Type (Liderança, Assessor, Apoiador)
            if (filterType !== 'Todos' && c.tipo !== filterType) {
                return false;
            }

            // Search Term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return c.nome.toLowerCase().includes(term) ||
                       c.municipioOuRegiao.toLowerCase().includes(term) ||
                       c.telefone.includes(term) ||
                       c.cargoOuPartido.toLowerCase().includes(term);
            }

            return true;
        });
    }, [contatos, selectedMandato, filterType, searchTerm]);

    const getTypeColor = (tipo: string) => {
        switch(tipo) {
            case 'Liderança': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Assessor': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Apoiador': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader /></div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight">CRM de Contatos</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Gestão unificada de lideranças, assessores e base política.</p>
                </div>
                <button 
                    className="bg-turquoise text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-turquoise/30 hover:bg-turquoise-dark transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Novo Contato
                </button>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nome, cidade, telefone ou cargo..."
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise outline-none transition-all dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {['Todos', 'Liderança', 'Assessor', 'Apoiador'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === type ? 'bg-white dark:bg-slate-700 text-navy-dark dark:text-white shadow-sm' : 'text-slate-500 hover:text-navy-dark dark:hover:text-white'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                <th className="py-4 px-6 font-bold">Nome / Contato</th>
                                <th className="py-4 px-6 font-bold">Tipo</th>
                                <th className="py-4 px-6 font-bold">Cargo / Partido</th>
                                <th className="py-4 px-6 font-bold">Localidade</th>
                                <th className="py-4 px-6 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                                        Nenhum contato encontrado para os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map(contato => (
                                    <tr key={contato.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-3">
                                                {contato.avatarUrl ? (
                                                    <img src={contato.avatarUrl} alt={contato.nome} className="size-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                                                ) : (
                                                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-sm border-2 border-white dark:border-slate-800">
                                                        {contato.nome.substring(0,2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-navy-dark dark:text-white text-sm">{contato.nome}</div>
                                                    <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">phone_iphone</span>
                                                        {contato.telefone || 'Sem telefone'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getTypeColor(contato.tipo)}`}>
                                                {contato.tipo}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="text-sm font-medium text-navy-dark dark:text-slate-300">{contato.cargoOuPartido}</div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="text-sm text-slate-500 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px] text-slate-400">pin_drop</span>
                                                {contato.municipioOuRegiao}
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {contato.telefone && (
                                                    <a 
                                                        href={`https://wa.me/55${contato.telefone.replace(/\D/g, '')}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="size-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                                                        title="WhatsApp"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">chat</span>
                                                    </a>
                                                )}
                                                <button 
                                                    className="size-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                                                    title="Ver Perfil"
                                                    onClick={() => {
                                                        if (contato.tipo === 'Apoiador') navigateTo('ApoiadorPerfil', { id: (contato as any).originalId });
                                                        // if we had LiderancaPerfil or AssessorPerfil we would map here
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination (Visual Only for now) */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-medium text-slate-500">
                    <div>Exibindo {filteredContacts.length} contatos</div>
                    <div className="flex items-center gap-1">
                        <button className="size-7 rounded bg-slate-50 hover:bg-slate-100 flex items-center justify-center disabled:opacity-50" disabled><span className="material-symbols-outlined text-[16px]">chevron_left</span></button>
                        <button className="size-7 rounded bg-turquoise text-white flex items-center justify-center">1</button>
                        <button className="size-7 rounded bg-slate-50 hover:bg-slate-100 flex items-center justify-center disabled:opacity-50" disabled><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ContatosPage;
