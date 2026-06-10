import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { getMunicipios, getMunicipiosSimples, getDashboardLiderancas, getDashboardAssessores, getAgendaEventos, getRecursosTotais } from '../services/api';
import { getElectoralEvents } from '../services/electoralCalendarService';
import { Municipio, Lideranca, Assessor, EventoAgenda, Recurso } from '../types';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl, LayerGroup, useMap, GeoJSON, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MG_GEOJSON, MG_MASK_COORDINATES } from '../constants/mgGeojson';
import Loader from '../components/Loader';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapaPoliticoPageProps {
    navigateTo: (page: string, params?: any) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
};

const MapaPoliticoPage: React.FC<MapaPoliticoPageProps> = ({ navigateTo }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { selectedMandato } = context;

    const [loading, setLoading] = useState(true);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
    const [assessores, setAssessores] = useState<Assessor[]>([]);
    const [agenda, setAgenda] = useState<EventoAgenda[]>([]);
    const [recursosTotais, setRecursosTotais] = useState(0);
    const [projetosCount, setProjetosCount] = useState(0);

    const [showLiderancas, setShowLiderancas] = useState(true);
    const [showAssessores, setShowAssessores] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [municipiosData, liderancasData, assessoresData, agendaData, recursosTotaisData] = await Promise.all([
                    getMunicipiosSimples(),
                    getDashboardLiderancas(),
                    getDashboardAssessores(),
                    getAgendaEventos(),
                    getRecursosTotais()
                ]);

                const nextElectoralEvents = getElectoralEvents()
                    .filter(e => new Date(e.data) >= new Date())
                    .slice(0, 3);

                if (isMounted) {
                    setMunicipios(municipiosData);
                    setLiderancas(liderancasData);
                    setAssessores(assessoresData);
                    
                    const filteredAgenda = agendaData
                        .filter(e => {
                            const evtDate = new Date(`${e.data}T00:00:00`);
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            return evtDate >= today;
                        })
                        .sort((a, b) => new Date(`${a.data}T${a.hora !== 'Dia Inteiro' ? a.hora : '00:00'}`).getTime() - new Date(`${b.data}T${b.hora !== 'Dia Inteiro' ? b.hora : '00:00'}`).getTime())
                        .slice(0, 5);

                    setAgenda([...filteredAgenda, ...nextElectoralEvents].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()));
                    
                    setRecursosTotais(recursosTotaisData);
                    setProjetosCount(0); // TODO: fetch real projects count if available
                }
            } catch (error) {
                console.error("Erro ao carregar dados do Mapa Político:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [selectedMandato]);

    const filteredLiderancas = liderancas.filter(l => selectedMandato === 'TODOS' || l.origem === selectedMandato);
    const filteredAssessores = assessores.filter(a => selectedMandato === 'TODOS' || a.origem === selectedMandato);
    const filteredMunicipios = municipios.filter(m => {
        if (selectedMandato === 'TODOS') return true;
        return (m as any).origem === selectedMandato || ((m as any).origens && (m as any).origens.includes(selectedMandato));
    });

    const createIcon = (color: string, isLider: boolean) => {
        const svg = `
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="3" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"/>
                ${isLider 
                    ? '<path d="M12 7l3 8h-6z" fill="white"/>' 
                    : '<circle cx="12" cy="12" r="4" fill="white"/>'}
            </svg>
        `;
        return L.divIcon({
            html: svg,
            className: isLider ? 'lider-icon-marker' : 'assessor-icon-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader /></div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
            
            {/* Cabecalho Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight">Inteligência Territorial Portela App</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Mapa dinâmico de influência e alocação</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowLiderancas(!showLiderancas)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${showLiderancas ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'border-slate-200 text-slate-400 grayscale'}`}
                    >
                        <div className="size-2 rounded-full bg-blue-500"></div> Lideranças
                    </button>
                    <button 
                        onClick={() => setShowAssessores(!showAssessores)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${showAssessores ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30' : 'border-slate-200 text-slate-400 grayscale'}`}
                    >
                        <div className="size-2 rounded-full bg-orange-500"></div> Assessores
                    </button>
                </div>
            </div>

            {/* Layout Principal: Mapa e Agenda */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Esquerda: Mapa e Cards Flutuantes */}
                <div className="flex-[2] flex flex-col gap-6 relative">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden relative" style={{ height: '600px' }}>
                        <MapContainer
                            center={[-18.5122, -44.5550]}
                            zoom={6}
                            style={{ height: '100%', width: '100%', zIndex: 0 }}
                            zoomControl={true}
                            scrollWheelZoom={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            
                            {/* Mask overlay for MG */}
                            <Polygon 
                                positions={MG_MASK_COORDINATES as any} 
                                pathOptions={{ 
                                    fillColor: '#f8fafc', 
                                    fillOpacity: 0.8, 
                                    color: 'transparent',
                                    weight: 0
                                }} 
                            />
                            
                            {/* MG Border */}
                            <GeoJSON 
                                data={MG_GEOJSON as any} 
                                style={() => ({
                                    color: '#0d9488',
                                    weight: 2,
                                    fillColor: 'transparent',
                                    fillOpacity: 0
                                })}
                            />

                            <LayersControl position="topright">
                                {showLiderancas && (
                                    <LayersControl.Overlay checked name="Lideranças">
                                        <LayerGroup>
                                            {filteredLiderancas.map(lid => lid.latitude && lid.longitude && (
                                                <Marker
                                                    key={`lid-${lid.id}`}
                                                    position={[lid.latitude, lid.longitude]}
                                                    icon={createIcon('#3b82f6', true)}
                                                >
                                                    <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip">
                                                        <div className="font-bold text-navy-dark">{lid.nome}</div>
                                                        <div className="text-xs text-slate-500">{lid.municipio}</div>
                                                        <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-wider">{lid.origem}</div>
                                                    </Tooltip>
                                                </Marker>
                                            ))}
                                        </LayerGroup>
                                    </LayersControl.Overlay>
                                )}
                                {showAssessores && (
                                    <LayersControl.Overlay checked name="Assessores">
                                        <LayerGroup>
                                            {filteredAssessores.map(ass => ass.latitude && ass.longitude && (
                                                <Marker
                                                    key={`ass-${ass.id}`}
                                                    position={[ass.latitude, ass.longitude]}
                                                    icon={createIcon('#f97316', false)}
                                                >
                                                    <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip">
                                                        <div className="font-bold text-navy-dark">{ass.nome}</div>
                                                        <div className="text-xs text-slate-500">{ass.regiaoAtuacao}</div>
                                                        <div className="text-[10px] text-orange-600 font-bold mt-1 uppercase tracking-wider">{ass.origem}</div>
                                                    </Tooltip>
                                                </Marker>
                                            ))}
                                        </LayerGroup>
                                    </LayersControl.Overlay>
                                )}
                            </LayersControl>
                        </MapContainer>
                        
                        {/* Cards Flutuantes (Total em Recursos, Cidades, Projetos) */}
                        <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3">
                            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 min-w-[200px]">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total em Recursos</div>
                                <div className="text-2xl font-black text-turquoise">{formatCurrency(recursosTotais)}</div>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 flex-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Cidades</div>
                                    <div className="text-xl font-black text-navy-dark">{filteredMunicipios.length}</div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 flex-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Projetos</div>
                                    <div className="text-xl font-black text-navy-dark">{projetosCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Direita: Resumo da Agenda */}
                <div className="flex-[1] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-lg font-black text-navy-dark dark:text-white tracking-tight">Resumo da Agenda</h2>
                        <button className="text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {agenda.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm py-8 font-medium">Nenhum evento próximo.</div>
                        ) : (
                            agenda.map((evento, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex flex-col items-center min-w-[50px]">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(evento.data).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                                        <span className="text-xl font-black text-navy-dark dark:text-white mt-1">{new Date(evento.data).getDate()}</span>
                                    </div>
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-sm font-bold text-navy-dark dark:text-white">{evento.titulo}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500 mt-2 mb-2 text-xs font-medium">
                                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                                            {evento.local}
                                        </div>
                                        {evento.descricao && (
                                            <p className="text-xs text-slate-500 line-clamp-2 italic mb-3">{evento.descricao}</p>
                                        )}
                                        <div className="inline-flex px-2 py-1 bg-orange-100 text-orange-700 rounded text-[9px] font-black uppercase tracking-wider">
                                            {evento.origem}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 text-center">
                        <button 
                            onClick={() => navigateTo('Agenda')}
                            className="text-sm font-bold text-turquoise hover:text-turquoise-dark transition-colors"
                        >
                            Ver Agenda Completa →
                        </button>
                    </div>
                </div>
            </div>

            {/* Faixa Inferior: Ranking e Atividades */}
            <div className="flex flex-col lg:flex-row gap-6 mt-6">
                
                {/* Ranking de Recursos */}
                <div className="flex-[2] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-black text-navy-dark dark:text-white tracking-tight uppercase">Ranking de Recursos</h2>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Top municípios por volume de investimento</p>
                        </div>
                        <button 
                            onClick={() => navigateTo('Recursos')}
                            className="bg-navy-dark text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-navy-dark/90 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[16px]">list_alt</span> Ver Tudo
                        </button>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                    <th className="py-4 px-6 w-12 text-center">#</th>
                                    <th className="py-4 px-6">Município</th>
                                    <th className="py-4 px-6 text-center">Projetos</th>
                                    <th className="py-4 px-6 text-right">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Mock data just for visual structure as per original image until real query exists */}
                                <tr className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 px-6 text-center text-slate-400 font-bold">1</td>
                                    <td className="py-4 px-6 font-bold text-navy-dark dark:text-white">Belo Horizonte</td>
                                    <td className="py-4 px-6 text-center text-slate-500 font-medium">0</td>
                                    <td className="py-4 px-6 text-right font-black text-turquoise">{formatCurrency(0)}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 px-6 text-center text-slate-400 font-bold">2</td>
                                    <td className="py-4 px-6 font-bold text-navy-dark dark:text-white">Contagem</td>
                                    <td className="py-4 px-6 text-center text-slate-500 font-medium">0</td>
                                    <td className="py-4 px-6 text-right font-black text-turquoise">{formatCurrency(0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Atividades Recentes */}
                <div className="flex-[1] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-black text-navy-dark dark:text-white tracking-tight">Atividades Recentes</h2>
                    </div>
                    <div className="p-6 flex-1 space-y-6">
                        {/* Mock data just to match the visual requirement for the presentation. Will connect to an audit log table in the future */}
                        <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 pb-2">
                            <div className="absolute -left-[11px] top-0 size-5 bg-white border-2 border-turquoise rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-turquoise font-black">person_add</span>
                            </div>
                            <h3 className="text-sm font-bold text-navy-dark dark:text-white">Nova Liderança</h3>
                            <p className="text-xs text-slate-500 mt-1">João Silva adicionou um novo líder em <span className="font-bold text-turquoise">Contagem</span>.</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-2">Há 5 MIN</p>
                        </div>
                        <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 pb-2">
                            <div className="absolute -left-[11px] top-0 size-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-blue-500 font-black">description</span>
                            </div>
                            <h3 className="text-sm font-bold text-navy-dark dark:text-white">Ofício Enviado</h3>
                            <p className="text-xs text-slate-500 mt-1">Relatório ministerial concluído em <span className="font-bold text-blue-500">Betim</span>.</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-2">Há 42 MIN</p>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 text-center">
                        <button className="text-sm font-bold text-turquoise hover:text-turquoise-dark transition-colors">
                            Ver Histórico →
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default MapaPoliticoPage;
