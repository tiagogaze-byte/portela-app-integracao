import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';

interface SidebarProps {
    activePage: string;
    setActivePage: (page: string, params?: any) => void;
}

export const navItems = [
    { id: 'dashboard', label: 'Dashboard', section: 'PAINEL', iconPath: <><rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/></> },
    { id: 'briefing', label: 'Briefing', section: 'PAINEL', iconPath: <><path d="M2 12V4l6-2 6 2v8l-6 2-6-2z" stroke="currentColor" strokeWidth="1.2"/><path d="M8 2v12" stroke="currentColor" strokeWidth="1.2"/></> },
    { id: 'mapa', label: 'Mapa político', section: 'TERRITÓRIOS', iconPath: <path d="M2 13L6 3l4 6 2-3 2 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/> },
    { id: 'municipios', label: 'Municípios', section: 'TERRITÓRIOS', iconPath: <><path d="M8 2C5.24 2 3 4.24 3 7c0 4.25 5 9 5 9s5-4.75 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="7" r="1.5" fill="currentColor" opacity=".6"/></> },
    { id: 'liderancas', label: 'Lideranças', section: 'TERRITÓRIOS', iconPath: <><path d="M8 8a3 3 0 100-6 3 3 0 000 6z" fill="currentColor" opacity=".5"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></> },
    { id: 'apoiadores', label: 'Apoiadores', section: 'TERRITÓRIOS', iconPath: <><circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M11 8c1.66 0 3 1.34 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></> },
    { id: 'contatos', label: 'Contatos', section: 'OPERAÇÃO', iconPath: <><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="4.5" r=".7" fill="currentColor"/><circle cx="7" cy="4.5" r=".7" fill="currentColor"/></> },
    { id: 'agenda', label: 'Agenda', section: 'OPERAÇÃO', iconPath: <><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 3V2M11 3V2M2 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></> },
    { id: 'demandas', label: 'Demandas', section: 'OPERAÇÃO', iconPath: <><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8h6M5 5h6M5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></> },
    { id: 'assessores', label: 'Assessores', section: 'OPERAÇÃO', iconPath: <path d="M2 10V6l6-4 6 4v4l-6 4-6-4z" stroke="currentColor" strokeWidth="1.2"/> },
    { id: 'recursos', label: 'Recursos', section: 'OPERAÇÃO', iconPath: <><path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M12 10.5V12l1 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></> },
    { id: 'ia', label: 'Ferramentas IA', section: 'FERRAMENTAS', iconPath: <><circle cx="8" cy="8" r="2" fill="currentColor" opacity=".5"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2M4.1 4.1l1.4 1.4M10.5 10.5l1.4 1.4M10.5 4.1l-1.4 1.4M5.5 10.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></> },
    { id: 'envios', label: 'Envios', section: 'FERRAMENTAS', iconPath: <path d="M13 7H3M13 7l-3-3M13 7l-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/> },
    { id: 'configuracoes', label: 'Configurações', section: 'SISTEMA', iconPath: <><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M8 2L8 4M8 12L8 14M2 8L4 8M12 8L14 8M3.5 3.5L5 5M11 11L12.5 12.5M3.5 12.5L5 11M11 5L12.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></> },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
    const { profile, signOut } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (itemLabel: string) => {
        if (itemLabel === 'Dashboard' && activePage === 'Visão geral') return true;
        if (itemLabel === 'Visão geral' && activePage === 'Dashboard') return true;
        return activePage === itemLabel;
    };

    const sections = ['PAINEL', 'TERRITÓRIOS', 'OPERAÇÃO', 'FERRAMENTAS', 'SISTEMA'];

    return (
        <>
            {/* Mobile overlay */}
            {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMenuOpen(false)}></div>}
            
            {/* Mobile menu button */}
            <button 
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>

            <div className={`sb fixed md:relative z-40 transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="sb-brand">
                    <div className="sb-brand-name">portela<span className="sb-brand-dot">.</span>app</div>
                    <div className="sb-brand-sub">INTELIGÊNCIA POLÍTICA</div>
                </div>

                <div className="sb-nav">
                    {sections.map(section => (
                        <div key={section}>
                            <div className="sb-sec">{section}</div>
                            {navItems.filter(item => item.section === section).map(item => (
                                <div 
                                    key={item.id} 
                                    className={`sb-item ${isActive(item.label) ? 'on' : ''}`}
                                    onClick={() => {
                                        const routeMap:any = {
                                            'Dashboard': 'Dashboard',
                                            'Briefing': 'Briefing',
                                            'Mapa político': 'Mapa Político',
                                            'Municípios': 'Municípios',
                                            'Lideranças': 'Lideranças',
                                            'Apoiadores': 'Apoiadores',
                                            'Contatos': 'Contatos',
                                            'Agenda': 'Agenda',
                                            'Demandas': 'Demandas',
                                            'Assessores': 'Assessores',
                                            'Recursos': 'Recursos',
                                            'Ferramentas IA': 'Ferramentas IA',
                                            'Envios': 'Envios',
                                            'Configurações': 'Configurações'
                                        };
                                        setActivePage(routeMap[item.label] || item.label);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <svg className="sb-ico" viewBox="0 0 16 16" fill="none">
                                        {item.iconPath}
                                    </svg>
                                    <span className="sb-lbl">{item.label === 'Dashboard' ? 'Visão geral' : item.label}</span>
                                    {(item as any).badge && <span className={`sb-badge ${(item as any).badge.color}`}>{(item as any).badge.text}</span>}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Ações Rápidas Accordion */}
                <div className="sb-quick-actions">
                    <div className="sb-qa-header">
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <svg viewBox="0 0 16 16" fill="none"><path d="M8 2L3 9h4l-1 5 6-7H8l1-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                            Ações Rápidas
                        </div>
                        <svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="sb-qa-grid">
                        <div className="qa-btn red" onClick={() => setActivePage('Apoiadores')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                            <span className="qa-lbl">Novo<br/>Apoiador</span>
                        </div>
                        <div className="qa-btn teal" onClick={() => setActivePage('Lideranças', { action: 'new' })}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                            <span className="qa-lbl">Nova<br/>Liderança</span>
                        </div>
                        <div className="qa-btn teal">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            <span className="qa-lbl">Importar<br/>CSV</span>
                        </div>
                        <div className="qa-btn teal">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            <span className="qa-lbl">Gerar<br/>PDF</span>
                        </div>
                    </div>
                </div>

                {/* User Profile */}
                <div className="sb-foot-new">
                    <div className="sb-user-row">
                        <div className="sb-av-new">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div className="sb-user-info">
                            <div className="sb-user-title" style={{maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{profile?.full_name || 'Usuário'}</div>
                            <div className="sb-user-email" style={{maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{profile?.email || 'master@portela.app'}</div>
                        </div>
                        <div className="sb-user-exit" onClick={signOut} style={{cursor:'pointer'}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </div>
                    </div>
                    <div className="sb-master-badge">
                        {profile?.role === 'master' ? 'MASTER ADMIN' : profile?.role === 'admin' ? 'COORDENADOR' : 'USUÁRIO'}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
