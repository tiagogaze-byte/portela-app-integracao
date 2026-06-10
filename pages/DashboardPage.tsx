
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import KpiCard from '../components/KpiCard';
import Loader from '../components/Loader';
import { getMunicipios, getMunicipiosSimples, getDashboardCounts, getDashboardLiderancas, getDashboardAssessores, getLiderancas, getAssessores, getAgendaEventos, getRecursosTotais, getDemandasTotais, getAllRecursos, getGoogleEvents, getBriefings } from '../services/api';
import { getElectoralEvents } from '../services/electoralCalendarService';
import ElectoralTimeline from '../components/ElectoralTimeline';

import { Municipio, Lideranca, Assessor, EventoAgenda, Recurso, Briefing } from '../types';
import VotacaoEstadualKPIs from '../components/VotacaoEstadualKPIs';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl, LayerGroup, useMap, GeoJSON, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MG_GEOJSON, MG_MASK_COORDINATES } from '../constants/mgGeojson';

interface RecursoResumo extends Recurso {
    municipio_nome: string;
}

interface DashboardProps {
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
}

interface DashboardData {
    municipios: Municipio[];
    liderancas: Lideranca[];
    assessores: Assessor[];
    agenda: EventoAgenda[];
    recursosTotais: number;
    demandasTotais: number;
    aleDemandasCount: number;
    lincolnDemandasCount: number;
    recursos: RecursoResumo[];
    briefings: Briefing[];
}

const CoberturaMap: React.FC<{
    municipios: Municipio[],
    liderancas: Lideranca[],
    assessores: Assessor[],
    recursos: Recurso[],
    selectedMandato: string
}> = ({ municipios, liderancas, assessores, recursos, selectedMandato }) => {
    const { theme } = useContext(AppContext)!;
    // MG Coordinates center
    const center: [number, number] = [-18.5122, -44.5550];

    const stats = {
        totalRecursos: recursos.reduce((acc, r) => acc + r.valor, 0),
        municipiosAtendidos: new Set(recursos.map(r => r.municipioId)).size,
        projetosAtivos: recursos.filter(r => r.status !== 'Concluído').length
    };

    console.log('Map Data counts:', {
        municipios: municipios.length,
        liderancas: liderancas.length,
        assessores: assessores.length,
        withCoords: {
            liderancas: liderancas.filter(l => l.latitude != null && l.longitude != null).length,
            assessores: assessores.filter(a => a.latitude != null && a.longitude != null).length
        }
    });

    const ResizeMap = () => {
        const map = useMap();
        useEffect(() => {
            setTimeout(() => {
                map.invalidateSize();
            }, 500);
        }, [map]);
        return null;
    };

    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm h-[600px] flex flex-col relative group/map">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-[1000]">
                <div>
                    <h4 className="font-bold text-navy-dark dark:text-white">Inteligência Territorial Portela App</h4>
                    <p className="text-xs text-slate-500">Mapa dinâmico de influência e alocação</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex gap-1">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Lideranças
                    </span>
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Assessores
                    </span>
                </div>
            </div>

            <div className="flex-1 z-0 relative">
                <MapContainer
                    center={center}
                    zoom={6}
                    style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
                    scrollWheelZoom={true}
                    className="map-pt-br-minimalist"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url={theme === 'dark' 
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        }
                    />

                    {/* Map Mask: Dims everything outside Minas Gerais */}
                    <Polygon
                        positions={MG_MASK_COORDINATES}
                        pathOptions={{
                            fillColor: theme === 'dark' ? '#0f172a' : '#f1f5f9',
                            fillOpacity: theme === 'dark' ? 0.7 : 0.8,
                            weight: 0,
                            stroke: false
                        }}
                    />

                    <GeoJSON
                        data={MG_GEOJSON as any}
                        style={{
                            color: "var(--color-primary)",
                            weight: 2,
                            fillColor: "var(--color-primary)",
                            fillOpacity: 0.05,
                            opacity: 0.8
                        }}
                    />
                    <ResizeMap />

                    <LayersControl position="topright">
                        <LayersControl.Overlay checked name="Lideranças">
                            <LayerGroup>
                                {liderancas.filter(l => l.latitude != null && l.longitude != null).map(lider => (
                                    <Marker
                                        key={`lider-${lider.id}`}
                                        position={[lider.latitude!, lider.longitude!]}
                                        zIndexOffset={100}
                                        icon={L.divIcon({
                                            className: 'lider-icon-marker',
                                            html: `
                                                <div class="relative flex items-center justify-center">
                                                    <div class="absolute w-6 h-6 bg-blue-500/20 rounded-full animate-ping"></div>
                                                    <div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); position: relative; z-index: 10;"></div>
                                                </div>
                                            `,
                                            iconSize: [24, 24],
                                            iconAnchor: [12, 12]
                                        })}
                                    >
                                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg border border-slate-200 dark:border-slate-700">
                                                <p className="font-bold text-[10px] text-navy-dark dark:text-white m-0">{lider.nome}</p>
                                                <p className="text-[9px] text-slate-500 m-0">{lider.cargo} • {lider.municipio}</p>
                                            </div>
                                        </Tooltip>
                                        <Popup>
                                            <div className="p-2">
                                                <h5 className="font-bold border-b pb-1 mb-1">{lider.nome}</h5>
                                                <p className="text-xs m-0"><strong>Cargo:</strong> {lider.cargo}</p>
                                                <p className="text-xs m-0"><strong>Cidade:</strong> {lider.municipio}</p>
                                                <p className="text-xs m-0"><strong>Mandato:</strong> {lider.origem}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </LayerGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name="Assessores">
                            <LayerGroup>
                                {assessores.filter(a => a.latitude != null && a.longitude != null).map(assessor => (
                                    <Marker
                                        key={`assessor-${assessor.id}`}
                                        position={[assessor.latitude!, assessor.longitude!]}
                                        zIndexOffset={200}
                                        icon={L.divIcon({
                                            className: 'assessor-icon-marker',
                                            html: `
                                                <div class="relative flex items-center justify-center">
                                                    <div class="absolute w-6 h-6 bg-orange-500/20 rounded-full animate-ping"></div>
                                                    <div style="background-color: #f97316; width: 12px; height: 12px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); position: relative; z-index: 10;"></div>
                                                </div>
                                            `,
                                            iconSize: [24, 24],
                                            iconAnchor: [12, 12]
                                        })}
                                    >
                                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg border border-orange-200 dark:border-orange-900/30">
                                                <p className="font-bold text-[10px] text-orange-600 dark:text-orange-400 m-0">{assessor.nome}</p>
                                                <p className="text-[9px] text-slate-500 m-0">Assessor • {assessor.regiaoAtuacao}</p>
                                            </div>
                                        </Tooltip>
                                        <Popup>
                                            <div className="p-2">
                                                <h5 className="font-bold text-orange-600 border-b pb-1 mb-1">{assessor.nome}</h5>
                                                <p className="text-xs m-0"><strong>Região:</strong> {assessor.regiaoAtuacao}</p>
                                                <p className="text-xs m-0"><strong>Municípios:</strong> {assessor.municipiosCobertos}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </LayerGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name="Recursos (Municípios)">
                            <LayerGroup>
                                {municipios.filter(m => m.latitude && m.longitude).map(mun => (
                                    <Marker
                                        key={mun.id}
                                        position={[mun.latitude!, mun.longitude!]}
                                        icon={L.divIcon({
                                            className: 'municipio-icon',
                                            html: `
                                                <div class="relative flex items-center justify-center">
                                                    <div style="
                                                        background-color: rgba(20, 184, 166, 0.15); 
                                                        width: ${Math.min(32, (mun.totalRecursos || 0) / 50000 + 16)}px; 
                                                        height: ${Math.min(32, (mun.totalRecursos || 0) / 50000 + 16)}px; 
                                                        border-radius: 50%; 
                                                        border: 1px solid rgba(20, 184, 166, 0.4);
                                                        backdrop-filter: blur(1px);
                                                    "></div>
                                                    <div class="absolute w-2 h-2 bg-teal-500 rounded-full border border-white shadow-sm"></div>
                                                </div>
                                            `,
                                            iconSize: [32, 32],
                                            iconAnchor: [16, 16]
                                        })}
                                    >
                                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg border border-teal-200 dark:border-teal-900/30">
                                                <p className="font-bold text-[10px] text-teal-600 dark:text-teal-400 m-0">{mun.nome}</p>
                                                <p className="text-[9px] text-slate-500 m-0">R$ {(mun.totalRecursos || 0).toLocaleString('pt-BR', { notation: 'compact' })} em recursos</p>
                                            </div>
                                        </Tooltip>
                                        <Popup>
                                            <div className="p-2">
                                                <h5 className="font-bold text-teal-600 border-b pb-1 mb-1">{mun.nome}</h5>
                                                <p className="text-xs m-0"><strong>Recursos:</strong> R$ {(mun.totalRecursos || 0).toLocaleString('pt-BR')}</p>
                                                <p className="text-xs m-0"><strong>Demandas:</strong> {mun.totalDemandas || 0}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </LayerGroup>
                        </LayersControl.Overlay>
                    </LayersControl>
                </MapContainer>

                {/* Recursos Cobertura Cards - Floating Overlay */}
                <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-slate-700/50 shadow-2xl pointer-events-auto transition-transform hover:scale-105">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total em Recursos</p>
                        <p className="text-xl font-black text-turquoise tabular-nums">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalRecursos)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-slate-700/50 shadow-xl pointer-events-auto flex-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cidades</p>
                            <p className="text-lg font-black text-navy-dark dark:text-white">{stats.municipiosAtendidos}</p>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-slate-700/50 shadow-xl pointer-events-auto flex-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Projetos</p>
                            <p className="text-lg font-black text-navy-dark dark:text-white">{stats.projetosAtivos}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



const AgendaSummary: React.FC<{ events: EventoAgenda[], isRefreshing: boolean, onRefresh: () => void, navigateTo: (page: string) => void }> = ({ events, isRefreshing, onRefresh, navigateTo }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
            <h4 className="font-bold text-navy-dark dark:text-white text-sm md:text-base">Resumo da Agenda</h4>
            <button
                onClick={onRefresh}
                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
                title="Atualizar Agenda"
                disabled={isRefreshing}
            >
                <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
            </button>
        </div>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-2">event_busy</span>
                    <p className="text-xs font-bold uppercase tracking-wider">Sem eventos no período</p>
                </div>
            ) : (
                (() => {
                    const groups: { [key: string]: EventoAgenda[] } = {};
                    events.forEach(e => {
                        if (!groups[e.data]) groups[e.data] = [];
                        groups[e.data].push(e);
                    });

                    return Object.entries(groups).sort(([d1], [d2]) => d1.localeCompare(d2)).map(([date, dayEvents]) => (
                        <div key={date} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                </span>
                                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></span>
                            </div>
                            {dayEvents.map((event, index) => {
                                const hasPrivateKeyword = (event.titulo + ' ' + (event.descricao || '')).toLowerCase().includes('privado') ||
                                    (event.titulo + ' ' + (event.descricao || '')).toLowerCase().includes('particular');
                                const isPrivate = event.privacidade === 'Particular' || hasPrivateKeyword;

                                return (
                                    <div key={event.id} className="flex gap-3 md:gap-4 items-start pl-1">
                                        <div className="shrink-0 flex flex-col items-center w-12">
                                            <span className={`text-[10px] md:text-xs font-bold uppercase ${event.hora === 'Dia Inteiro' ? 'text-turquoise' : 'text-slate-500'}`}>
                                                {event.hora === 'Dia Inteiro' ? 'DIA' : event.hora}
                                            </span>
                                            {index < dayEvents.length - 1 && <div className="w-px h-6 md:h-8 bg-slate-100 dark:bg-slate-700 mt-2 rounded-full"></div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-xs md:text-sm font-bold truncate ${isPrivate ? 'text-slate-400 italic' : 'text-navy-dark dark:text-white'}`}>
                                                    {isPrivate ? "🔒 Reservado" : event.titulo}
                                                </p>
                                            </div>
                                            {!isPrivate && (
                                                <div className="flex flex-col gap-1 mt-0.5 md:mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-turquoise text-[12px] md:text-[14px]">location_on</span>
                                                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{event.local || 'Não informado'}</p>
                                                    </div>
                                                    {event.origem === 'Justiça Eleitoral' && event.descricao && (
                                                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 leading-tight italic line-clamp-2 bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-md border-l-2 border-amber-500/50">
                                                            {event.descricao}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-1.5 mt-1.5">
                                                {event.origem === 'Lincoln Portela' && (
                                                    <span className="px-1.5 py-0.5 bg-[#8db641]/10 text-[#8db641] text-[8px] md:text-[9px] font-black rounded border border-[#8db641]/20 uppercase">
                                                        Lincoln
                                                    </span>
                                                )}
                                                {(event.origem === 'Alê Portela' || !event.origem || event.origem === 'Google Calendar' || event.origem === 'Justiça Eleitoral') && (
                                                    <span className={`px-1.5 py-0.5 text-[8px] md:text-[9px] font-black rounded border uppercase ${event.origem === 'Google Calendar'
                                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        : event.origem === 'Justiça Eleitoral'
                                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                            : 'bg-turquoise/10 text-turquoise border-turquoise/20'
                                                        }`}>
                                                        {event.origem === 'Google Calendar' ? 'Google' : (event.origem === 'Justiça Eleitoral' ? 'TSE' : 'Alê')}
                                                    </span>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ));
                })()
            )}
        </div>
        <div className="p-3 md:p-4 mt-auto border-t border-slate-200 dark:border-slate-700">
            <button
                onClick={() => navigateTo('Agenda')}
                className="w-full text-[10px] md:text-xs font-bold text-turquoise hover:underline flex items-center justify-center gap-1"
            >
                Ver Agenda Completa
                <span className="material-symbols-outlined text-sm md:text-xs">arrow_forward</span>
            </button>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: Municipio['statusAtividade'] }> = ({ status }) => {
    const styles = {
        'Consolidado': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        'Expansão': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        'Manutenção': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        'Atenção': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider ${styles[status]}`}>{status}</span>;
}

const RecursosDestaqueTable: React.FC<{ recursos: RecursoResumo[], navigateTo: DashboardProps['navigateTo'] }> = ({ recursos, navigateTo }) => {
    // Agregar recursos por município
    const recursosPorMunicipio = recursos.reduce((acc, recurso) => {
        const municipioName = recurso.municipio_nome || 'Não Identificado';
        if (!acc[municipioName]) {
            acc[municipioName] = {
                municipio: municipioName,
                totalValor: 0,
                quantidade: 0,
                origens: new Set<string>(),
                tipos: new Set<string>(),
                id: recurso.municipioId
            };
        }
        acc[municipioName].totalValor += recurso.valor;
        acc[municipioName].quantidade += 1;
        // Filtrar origem: apenas gabinetes (Portela)
        if (recurso.origem) {
            if (recurso.origem.toLowerCase().includes('portela')) {
                acc[municipioName].origens.add(recurso.origem);
            } else {
                acc[municipioName].tipos.add(recurso.origem);
            }
        }

        if (recurso.tipo) {
            // Se o tipo for uma string com vírgulas, quebrar e adicionar cada um
            recurso.tipo.split(',').forEach(t => acc[municipioName].tipos.add(t.trim()));
        }
        return acc;
    }, {} as Record<string, { municipio: string, totalValor: number, quantidade: number, origens: Set<string>, tipos: Set<string>, id: string }>);

    // Converter para array e ordenar por maior valor total
    const sortedMunicipios = Object.values(recursosPorMunicipio).sort((a, b) => b.totalValor - a.totalValor);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm mb-6 md:mb-8">
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                <div>
                    <h4 className="font-extrabold text-navy-dark dark:text-white text-sm md:text-lg tracking-tight uppercase">Ranking de Recursos</h4>
                    <p className="text-slate-500 text-[10px] md:text-sm mt-0.5">Top municípios por volume de investimento</p>
                </div>
                <button
                    onClick={() => navigateTo('Recursos')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-navy-dark text-white rounded-lg text-xs font-semibold hover:bg-navy-dark/90 transition-colors shadow-lg shadow-navy-dark/10 w-full md:w-auto"
                >
                    <span className="material-symbols-outlined text-base">analytics</span>
                    Ver Tudo
                </button>
            </div>
            <div className="overflow-x-auto w-full scrollbar-hide">
                <table className="w-full text-left bg-white dark:bg-slate-800 min-w-[600px] md:min-w-0">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-4 md:px-6 py-3 w-8 md:w-12">#</th>
                            <th className="px-4 md:px-6 py-3">Município</th>
                            <th className="px-4 md:px-6 py-3 text-center">Origem</th>
                            <th className="px-4 md:px-6 py-3 text-center">Projetos</th>
                            <th className="px-4 md:px-6 py-3 text-right">Valor Total</th>
                            <th className="px-4 md:px-6 py-3 text-center w-10 md:w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {sortedMunicipios.slice(0, 5).map((item, index) => (
                            <tr key={item.municipio} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-4 md:px-6 py-2 md:py-3">
                                    <span className={`font-black text-[10px] md:text-xs ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-400' : 'text-slate-300'}`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3">
                                    <span
                                        className="font-semibold text-navy-dark dark:text-white text-xs md:text-sm whitespace-nowrap cursor-pointer hover:text-turquoise transition-colors"
                                        onClick={() => navigateTo('MunicipioDetalhes', { id: item.id })}
                                    >
                                        {item.municipio}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        {Array.from(item.origens).map(origem => (
                                            <span
                                                key={origem}
                                                className={`px-1 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase border ${origem === 'Lincoln Portela'
                                                    ? 'bg-navy-dark/10 text-navy-dark border-navy-dark/20 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30'
                                                    : 'bg-turquoise/10 text-turquoise border-turquoise/20 dark:bg-turquoise/20 dark:text-turquoise dark:border-turquoise/30'
                                                    }`}
                                            >
                                                {origem.split(' ')[0]}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                    <span className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] md:text-xs font-bold">
                                        {item.quantidade}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 font-black text-xs md:text-sm text-navy-dark dark:text-white text-right whitespace-nowrap">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(item.totalValor)}
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                    <button
                                        onClick={() => navigateTo('MunicipioDetalhes', { id: item.id })}
                                        className="size-6 md:size-7 rounded-lg bg-turquoise/10 hover:bg-turquoise/20 flex items-center justify-center transition-all group/btn"
                                    >
                                        <span className="material-symbols-outlined text-turquoise text-[14px] md:text-sm group-hover/btn:scale-110 transition-transform">open_in_new</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RecentActivity = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col mb-6 md:mb-8">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h4 className="font-bold text-navy-dark dark:text-white text-sm md:text-base">Atividades Recentes</h4>
        </div>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="relative flex gap-3 md:gap-4">
                <div className="absolute left-3 md:left-4 top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="shrink-0 size-6 md:size-8 rounded-full bg-turquoise/20 flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-turquoise text-xs md:text-sm">person_add</span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-navy-dark dark:text-white truncate">Nova Liderança</p>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">João Silva adicionou um novo líder em <span className="text-turquoise font-medium">Contagem</span>.</p>
                    <p className="text-[8px] md:text-[9px] text-slate-400 uppercase mt-1.5 font-bold tracking-wider">Há 5 min</p>
                </div>
            </div>
            <div className="relative flex gap-3 md:gap-4">
                <div className="absolute left-3 md:left-4 top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="shrink-0 size-6 md:size-8 rounded-full bg-turquoise/20 flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-turquoise text-xs md:text-sm">description</span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-navy-dark dark:text-white truncate">Ofício Enviado</p>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Relatório ministerial concluído em <span className="text-turquoise font-medium">Betim</span>.</p>
                    <p className="text-[8px] md:text-[9px] text-slate-400 uppercase mt-1.5 font-bold tracking-wider">Há 42 min</p>
                </div>
            </div>
            <div className="relative flex gap-3 md:gap-4">
                <div className="shrink-0 size-6 md:size-8 rounded-full bg-turquoise/20 flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-turquoise text-xs md:text-sm">edit</span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-navy-dark dark:text-white truncate">Perfil Atualizado</p>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Assessor Marcos atualizou os dados de 15 líderes.</p>
                    <p className="text-[8px] md:text-[9px] text-slate-400 uppercase mt-1.5 font-bold tracking-wider">Há 5 horas</p>
                </div>
            </div>
        </div>
        <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-700">
            <button className="w-full text-[10px] md:text-xs font-bold text-turquoise hover:underline flex items-center justify-center gap-1">
                Ver Histórico
                <span className="material-symbols-outlined text-sm md:text-xs">arrow_forward</span>
            </button>
        </div>
    </div>
);


const DashboardPage: React.FC<DashboardProps> = ({ navigateTo }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isAgendaRefreshing, setIsAgendaRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { selectedMandato, setSelectedMandato } = useContext(AppContext)!;
    const isMounted = React.useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchDashboardData = async (agendaOnly = false) => {
        try {
            if (agendaOnly) setIsAgendaRefreshing(true);
            else setIsLoading(true);

            // Helpers para datas
            const today = new Date();
            const twoDaysAgo = new Date(today);
            twoDaysAgo.setDate(today.getDate() - 2);
            const fifteenDaysAhead = new Date(today);
            fifteenDaysAhead.setDate(today.getDate() + 15);

            const formatLocalISO = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDate = formatLocalISO(twoDaysAgo);
            const endDate = formatLocalISO(fifteenDaysAhead);

            const helperFilterAndSortAgenda = (items: EventoAgenda[]) => {
                return items
                    .filter(event => {
                        if (event.origem === 'Justiça Eleitoral') return true;
                        return event.data >= startDate && event.data <= endDate;
                    })
                    .sort((a, b) => {
                        if (a.data !== b.data) return a.data.localeCompare(b.data);
                        if (a.hora === 'Dia Inteiro' && b.hora !== 'Dia Inteiro') return -1;
                        if (a.hora !== 'Dia Inteiro' && b.hora === 'Dia Inteiro') return 1;
                        return a.hora.localeCompare(b.hora);
                    })
                    .slice(0, 15);
            };

            // 1. CARGA RÁPIDA (KPIs e Dados Essenciais)
            const [
                municipiosSimples,
                liderancasData,
                assessoresData,
                agendaData,
                countsData,
                briefingsData
            ] = await Promise.all([
                (agendaOnly ? Promise.resolve(data?.municipios || []) : getMunicipiosSimples()).catch(err => { console.error("Erro Municípios Simples:", err); return []; }),
                (agendaOnly ? Promise.resolve(data?.liderancas || []) : getDashboardLiderancas()).catch(err => { console.error("Erro Lideranças:", err); return []; }),
                (agendaOnly ? Promise.resolve(data?.assessores || []) : getDashboardAssessores()).catch(err => { console.error("Erro Assessores:", err); return []; }),
                getAgendaEventos().catch(err => { console.error("Erro Agenda:", err); return []; }),
                (agendaOnly ? Promise.resolve(null) : getDashboardCounts()).catch(err => { console.error("Erro Counts:", err); return null; }),
                (agendaOnly ? Promise.resolve(data?.briefings || []) : getBriefings()).catch(err => { console.error("Erro Briefings:", err); return []; }),
                (agendaOnly ? Promise.resolve(data?.news || null) : getDashboardNews()).catch(err => { console.error("Erro Notícias:", err); return null; })
            ]);
            
            // Atribui os counts se disponíveis
            const recursosTotaisData = countsData?.recursosTotal ?? (data?.recursosTotais || 0);
            const demandasTotaisData = countsData?.demandasTotal ?? (data?.demandasTotais || 0);
            const municipiosCount = countsData?.municipiosCount ?? (data?.municipios?.length || 0);
            const liderancasCount = countsData?.liderancasCount ?? (data?.liderancas?.length || 0);
            const assessoresCount = countsData?.assessoresCount ?? (data?.assessores?.length || 0);
            const aleDemandasCount = countsData?.aleDemandasCount ?? (data?.aleDemandasCount || 0);
            const lincolnDemandasCount = countsData?.lincolnDemandasCount ?? (data?.lincolnDemandasCount || 0);

            const electoralEvents = getElectoralEvents();
            const nextElectoralEvents = electoralEvents
                .filter(e => e.data >= startDate)
                .sort((a, b) => a.data.localeCompare(b.data))
                .slice(0, 2);

            if (isMounted.current) {
                setData({
                    municipios: municipiosSimples,
                    liderancas: liderancasData,
                    assessores: assessoresData,
                    agenda: helperFilterAndSortAgenda([...agendaData, ...nextElectoralEvents]),
                    recursosTotais: recursosTotaisData,
                    demandasTotais: demandasTotaisData,
                    aleDemandasCount: aleDemandasCount,
                    lincolnDemandasCount: lincolnDemandasCount,
                    recursos: data?.recursos || [],
                    briefings: briefingsData,
                    news: briefingsData[2] || briefingsData // briefingsData variable name used above was array return, we will map it locally
                });
                setIsLoading(false); // Libera a UI agora!
                setError(null);
            }

            // 2. CARGA PESADA EM BACKGROUND (Municípios Detalhados, Lideranças Completas, Assessores e Lista de Recursos)
            if (!agendaOnly) {
                Promise.all([
                    getMunicipios(),
                    getLiderancas(),
                    getAssessores(),
                    getAllRecursos()
                ]).then(([fullMunicipios, fullLiderancas, fullAssessores, fullRecursos]) => {
                    if (isMounted.current) {
                        setData(prev => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                municipios: fullMunicipios,
                                liderancas: fullLiderancas,
                                assessores: fullAssessores,
                                recursos: fullRecursos.map(r => ({
                                    ...r,
                                    municipio_nome: fullMunicipios.find(m => m.id === r.municipioId)?.nome || 'Desconhecido'
                                }))
                            };
                        });
                    }
                }).catch(err => console.error("Erro no carregamento pesado:", err));
            }

            // 3. GOOGLE CALENDAR EM BACKGROUND
            getGoogleEvents().then(googleEventsData => {
                if (googleEventsData.length > 0 && isMounted.current) {
                    setData(prev => {
                        if (!prev) return null;
                        const existingIds = new Set(prev.agenda.map(e => e.id));
                        const uniqueGoogle = googleEventsData.filter(e => !existingIds.has(e.id));
                        const fullAgenda = [...agendaData, ...nextElectoralEvents, ...uniqueGoogle];
                        return {
                            ...prev,
                            agenda: helperFilterAndSortAgenda(fullAgenda)
                        };
                    });
                }
            }).catch(err => console.error("Erro secundário Google Agenda:", err));

        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            if (isMounted.current) {
                setError(err.message || 'Erro ao carregar dados do dashboard');
            }
        } finally {
            if (isMounted.current) {
                setIsAgendaRefreshing(false);
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Safety timeout agressivo para o Dashboard (8 segundos)
        const timer = setTimeout(() => {
            if (isMounted.current && isLoading) {
                console.warn("[Dashboard] Carregamento forçado via safety timeout (8s).");
                setIsLoading(false);
            }
        }, 8000);

        fetchDashboardData();

        // Auto-refresh every 5 minutes
        const intervalId = setInterval(() => {
            if (isMounted.current) fetchDashboardData(true);
        }, 5 * 60 * 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(intervalId);
        };
    }, []);

    const handleManualRefresh = () => {
        fetchDashboardData(true);
    };



    if (isLoading) return <Loader />;

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">error</span>
                <h3 className="text-xl font-bold text-navy-dark dark:text-white mb-2">Ops! Algo deu errado.</h3>
                <p className="text-slate-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-turquoise text-white rounded-lg font-bold hover:brightness-110"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div className="min-w-0">
                    <h2 className="text-xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white truncate">Dashboard Geral</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-base">Visão estratégica e indicadores.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-sm text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
                    <span className="material-symbols-outlined text-turquoise text-base md:text-lg">calendar_today</span>
                    <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
            </div>

            <ElectoralTimeline
                onEventClick={(e) => navigateTo('Agenda', { eventId: e.id })}
                onViewFullCalendar={() => navigateTo('Agenda')}
            />


            {/* Filtrando dados para exibição */}
            {(() => {
                const filteredData = data ? {
                    ...data,
                    municipios: data.municipios, // Municípios são compartilhados
                    liderancas: selectedMandato === 'Todos' ? data.liderancas : data.liderancas.filter(l => {
                        const origem = (l.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        return origem.includes(filter) || 
                               (filter.includes('ale') && origem.includes('ale')) ||
                               (filter.includes('lincoln') && origem.includes('lincoln')) ||
                               (filter.includes('marilda') && origem.includes('marilda'));
                    }),
                    assessores: data.assessores, // Assessores são compartilhados
                    agenda: selectedMandato === 'Todos' ? data.agenda : data.agenda.filter(e => {
                        const origem = (e.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        const isMandatoMatch = !selectedMandato ||
                            selectedMandato === 'Ambos' ||
                            origem.includes(filter) ||
                            (filter.includes('ale') && origem.includes('ale')) ||
                            (filter.includes('lincoln') && origem.includes('lincoln')) ||
                            (filter.includes('marilda') && origem.includes('marilda'));
                        return e.origem === 'Google Calendar' || isMandatoMatch;
                    }),
                    recursos: selectedMandato === 'Todos' ? data.recursos : data.recursos.filter(r => {
                        const origem = (r.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        return origem.includes(filter) || 
                               (filter.includes('ale') && origem.includes('ale')) ||
                               (filter.includes('lincoln') && origem.includes('lincoln')) ||
                               (filter.includes('marilda') && origem.includes('marilda'));
                    }),
                    recursosTotais: selectedMandato === 'Todos' ? data.recursosTotais : data.recursos.filter(r => {
                        const origem = (r.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        return origem.includes(filter) || 
                               (filter.includes('ale') && origem.includes('ale')) ||
                               (filter.includes('lincoln') && origem.includes('lincoln')) ||
                               (filter.includes('marilda') && origem.includes('marilda'));
                    }).reduce((acc, r) => acc + r.valor, 0),
                    demandasTotais: selectedMandato === 'Todos' ? data.demandasTotais : (selectedMandato === 'Alê Portela' ? data.aleDemandasCount : (selectedMandato === 'Lincoln Portela' ? data.lincolnDemandasCount : 0)),
                    briefings: selectedMandato === 'Todos' ? data.briefings : data.briefings.filter(b => {
                        const origem = (b.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        return origem === 'geral' || origem.includes(filter) || 
                               (filter.includes('ale') && origem.includes('ale')) ||
                               (filter.includes('lincoln') && origem.includes('lincoln')) ||
                               (filter.includes('marilda') && origem.includes('marilda'));
                    })
                } : null;

                if (!filteredData) return null;

                return (
                    <div className="scroll animate-in fade-in duration-300">
                        {/* KPIs editáveis */}
                        <div className="label-row">
                            <span className="label-txt">MEUS INDICADORES · clique para editar</span>
                            <span className="label-action">+ adicionar widget</span>
                        </div>
                        <div className="kpi-row">
                            <div className="kpi" onClick={() => navigateTo('Lideranças')}>
                                <span className="kpi-pencil">✎</span>
                                <div className="kpi-val">{filteredData.liderancas.length}</div>
                                <div className="kpi-lbl">lideranças totais</div>
                                <div className="kpi-delta up">base mapeada</div>
                            </div>
                            <div className="kpi" onClick={() => navigateTo('Municípios')}>
                                <span className="kpi-pencil">✎</span>
                                <div className="kpi-val">{filteredData.municipios.length}</div>
                                <div className="kpi-lbl">municípios monitorados</div>
                                <div className="kpi-delta up">MG completo</div>
                            </div>
                            <div className="kpi" onClick={() => navigateTo('Recursos')}>
                                <span className="kpi-pencil">✎</span>
                                <div className="kpi-val">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumSignificantDigits: 3 }).format(filteredData.recursosTotais)}
                                </div>
                                <div className="kpi-lbl">recursos alocados</div>
                                <div className="kpi-delta neu">ano atual</div>
                            </div>
                            <div className="kpi" onClick={() => navigateTo('Demandas')}>
                                <span className="kpi-pencil">✎</span>
                                <div className="kpi-val">{filteredData.demandasTotais || 0}</div>
                                <div className="kpi-lbl">demandas urgentes hoje</div>
                                <div className="kpi-delta red">prazo vencendo</div>
                            </div>
                        </div>

                        {/* Linha 1: Mapa + Briefing + Agenda */}
                        <div className="row flex-col lg:flex-row">
                            {/* Mapa político */}
                            <div className="mapa-card flex-[2]">
                                <div className="mapa-header">
                                    <span className="card-title">VISÃO TERRITORIAL</span>
                                    <span className="card-link" onClick={() => navigateTo('Mapa Político')}>abrir mapa político →</span>
                                </div>
                                <div className="mapa-body relative" style={{ height: '320px', padding: 0 }}>
                                    <div className="absolute inset-0 z-0">
                                        <CoberturaMap
                                            municipios={filteredData.municipios}
                                            liderancas={filteredData.liderancas}
                                            assessores={filteredData.assessores}
                                            recursos={filteredData.recursos}
                                            selectedMandato={selectedMandato}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Briefing do dia */}
                            <div className="card flex-[1]">
                                <div className="card-hd">
                                    <div className="card-title-badge">
                                        <span className="card-title">BRIEFING DO DIA · {selectedMandato.toUpperCase()}</span>
                                    </div>
                                    <span className="card-link" onClick={() => navigateTo('Briefing')}>ver completo →</span>
                                </div>
                                <div className="brief-grid grid-cols-1">
                                    {filteredData.briefings.slice(0, 4).map((brief, i) => (
                                        <div key={brief.id || i} className="bc">
                                            <div className="bc-tag">{brief.origem.toUpperCase()}</div>
                                            <div className="bc-title">{brief.titulo}</div>
                                            <div className="bc-desc">{brief.descricao}</div>
                                            <div className="bc-foot">
                                                <span className={brief.prioridade === 'ALTA' ? 'prio-a' : brief.prioridade === 'BAIXA' ? 'prio-b' : 'prio-m'}>
                                                    {brief.prioridade.toLowerCase()}
                                                </span>
                                                {brief.acao_sugerida && <span className="bc-copy">copiar ação →</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredData.briefings.length === 0 && (
                                        <div className="text-center text-xs text-slate-500 py-4">Nenhum briefing disponível no momento.</div>
                                    )}
                                </div>
                            </div>

                            {/* Agenda da semana (mini) */}
                            <div className="card flex-[0.9]">
                                <div className="card-hd">
                                    <span className="card-title">AGENDA DA SEMANA</span>
                                    <span className="card-link" onClick={() => navigateTo('Agenda')}>abrir →</span>
                                </div>
                                <div className="space-y-1">
                                    {filteredData.agenda.slice(0,4).map((event, i) => (
                                        <div key={i} className="ag-item">
                                            <div className="ag-time">{new Date(event.data).toLocaleDateString('pt-BR', { weekday: 'short' })} {event.hora !== 'Dia Inteiro' ? event.hora : ''}</div>
                                            <div className={`ag-dot ${i%2===0 ? 'v' : 'r'}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="ag-title truncate">{event.titulo}</div>
                                                <div className="ag-local truncate">{event.local}</div>
                                            </div>
                                            <div className="ag-m">{event.origem === 'Google Calendar' ? 'G' : event.origem.split(' ')[0]}</div>
                                        </div>
                                    ))}
                                    {filteredData.agenda.length === 0 && (
                                        <div className="text-center text-xs text-slate-500 py-4">Nenhum evento</div>
                                    )}
                                           {/* Notícias tempo real - REAL API */}
                            <div className="card flex-[1]">
                                <div className="card-hd">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">GOOGLE ALERTS · RSS</span>
                                        </div>
                                        <span className="card-title">Notícias dos Parlamentares</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">RSS</span>
                                </div>
                                <div className="overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {filteredData.news?.alertsRSS ? filteredData.news.alertsRSS.filter((n: any) => {
                                        const label = (n.label || n.sigla || '').toLowerCase();
                                        const filter = selectedMandato.toLowerCase();
                                        return selectedMandato === 'Todos' || selectedMandato === 'Ambos' || label.includes(filter) || (filter.includes('ale') && label.includes('ale')) || (filter.includes('lincoln') && label.includes('lincoln')) || (filter.includes('marilda') && label.includes('marilda'));
                                    }).slice(0, 8).map((news: any, idx: number) => {
                                        let dotColor = 'bg-slate-400';
                                        if (news.sigla === 'lincoln') dotColor = 'bg-[#8db641]';
                                        else if (news.sigla === 'marilda') dotColor = 'bg-[#d82a69]';
                                        else if (news.sigla === 'ale') dotColor = 'bg-[#00c5a3]';
                                        return (
                                            <div key={idx} className="relative pl-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg -mx-2 px-4 cursor-pointer" onClick={() => window.open(news.link, '_blank')}>
                                                <div className={`absolute left-0 top-4 w-1 h-5 rounded-r-full ${dotColor}`}></div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${news.sigla === 'lincoln' ? 'text-[#8db641]' : news.sigla === 'marilda' ? 'text-[#d82a69]' : 'text-slate-500'}`}>
                                                        {news.label || news.sigla?.toUpperCase() || 'NOTÍCIA'}
                                                    </span>
                                                    {news.temperatura === 'positiva' && <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>}
                                                    {news.temperatura === 'negativa' && <span className="size-2 rounded-full bg-rose-400"></span>}
                                                    {news.temperatura === 'neutra' && <span className="size-2 rounded-full bg-amber-400"></span>}
                                                </div>
                                                <p className="text-xs md:text-sm font-bold text-navy-dark leading-tight mb-1">{news.titulo}</p>
                                                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: news.resumo }}></p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(news.pub).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-turquoise hover:underline">Ver →</span>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center text-xs text-slate-500 py-4">Nenhuma notícia encontrada</div>
                                    )}
                                </div>
                            </div>

                            {/* Câmaras e Assembleia - REAL API */}
                            <div className="card flex-[0.9]">
                                <div className="card-hd">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">GROK · CÂMARAS</span>
                                        </div>
                                        <span className="card-title">Câmaras e Assembleia</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded border bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px] font-black uppercase tracking-wider">GROK</span>
                                </div>
                                <div className="space-y-0">
                                    {filteredData.news?.grok?.camaras ? filteredData.news.grok.camaras.map((camara: any, idx: number) => {
                                        let dotColor = 'border-slate-400';
                                        if (camara.sigla === 'federal') dotColor = 'border-indigo-500';
                                        else if (camara.sigla === 'almg') dotColor = 'border-emerald-500';
                                        else dotColor = 'border-rose-500';
                                        return (
                                            <div key={idx} className={`p-3 border-l-2 ${dotColor} mb-3 bg-slate-50 rounded-r-lg`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="material-symbols-outlined text-[12px] text-slate-500">{camara.sigla === 'federal' ? 'account_balance' : 'domain'}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${camara.sigla === 'federal' ? 'text-indigo-600' : camara.sigla === 'almg' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {camara.sigla === 'federal' ? 'FEDERAL' : camara.sigla === 'almg' ? 'ALMG' : 'BH'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-navy-dark leading-tight mb-1">{camara.titulo}</p>
                                                <p className="text-[10px] text-slate-500 mb-1 leading-relaxed">{camara.resumo}</p>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-widest">{camara.data}</p>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center text-xs text-slate-500 py-4">Sem dados do Grok</div>
                                    )}
                                </div>
                            </div>
                                    <div className="alert-time">agora</div>
                                </div>
                                <div className="alert-item">
                                    <div className="alert-dot r"></div>
                                    <div className="alert-txt">Assessor sem acesso ao briefing há 2 dias</div>
                                </div>
                            </div>
                        </div>

                        {/* Linha 2: Notícias + Alertas + Ferramentas IA */}
                        <div className="row flex-col lg:flex-row">
                            {/* Notícias tempo real */}
                            <div className="card flex-[1.1]">
                                <div className="card-hd">
                                    <div className="card-title-badge">
                                        <span className="card-title">NOTÍCIAS · TEMPO REAL</span>
                                        <span className="card-badge live"><div className="live-dot"></div>Grok</span>
                                    </div>
                                    <span className="card-link">ver mais →</span>
                                </div>
                                <div className="news-item">
                                    <div className="news-src">G1 MG</div>
                                    <div className="news-txt">ALMG aprova projeto de saneamento para o Norte de MG</div>
                                    <div className="news-time">14min</div>
                                </div>
                                <div className="news-item">
                                    <div className="news-src">Câmara</div>
                                    <div className="news-txt">Bancada mineira articula apoio a emenda de infraestrutura rural</div>
                                    <div className="news-time">1h</div>
                                </div>
                                <div className="news-item">
                                    <div className="news-src">Hoje em Dia</div>
                                    <div className="news-txt">Lincoln Portela defende ampliação de creches no Noroeste</div>
                                    <div className="news-time">2h</div>
                                </div>
                                <div className="news-item">
                                    <div className="news-src">Folha BH</div>
                                    <div className="news-txt">Marilda propõe revisão do plano diretor de BH para 2026</div>
                                    <div className="news-time">3h</div>
                                </div>
                            </div>

                            {/* Feed RSS */}
                            <div className="card flex-[0.9]">
                                <div className="card-hd">
                                    <span className="card-title">FEED RSS</span>
                                    <span className="card-link">todos →</span>
                                </div>
                                <div className="alert-item">
                                    <div className="alert-dot y"></div>
                                    <div className="alert-txt">Sessão plenária amanhã — votação sensível</div>
                                    <div className="alert-time">agora</div>
                                </div>
                                <div className="alert-item">
                                    <div className="alert-dot r"></div>
                                    <div className="alert-txt">Assessor sem acesso ao briefing há 2 dias</div>
                                    <div className="alert-time">1h</div>
                                </div>
                                <div className="alert-item">
                                    <div className="alert-dot y"></div>
                                    <div className="alert-txt">7 demandas com prazo vencendo hoje</div>
                                    <div className="alert-time">3h</div>
                                </div>
                                <div className="alert-item">
                                    <div className="alert-dot r"></div>
                                    <div className="alert-txt">Nota crítica publicada por veículo regional</div>
                                    <div className="alert-time">5h</div>
                                </div>
                            </div>

                            {/* Ferramentas IA */}
                            <div className="card flex-[1]">
                                <div className="card-hd">
                                    <span className="card-title">FERRAMENTAS IA</span>
                                    <span className="card-link" onClick={() => navigateTo('Ferramentas IA')}>usar no campo →</span>
                                </div>
                                <div className="ferr-grid grid-cols-1 sm:grid-cols-2">
                                    <div className="ferr-item" onClick={() => navigateTo('Ferramentas IA')}>
                                        <div className="ferr-name">Claude</div>
                                        <div className="ferr-desc">Análise, redação e consultas políticas</div>
                                        <div className="ferr-status"><div className="ferr-dot"></div><span className="ferr-st">ativo</span></div>
                                    </div>
                                    <div className="ferr-item" onClick={() => navigateTo('Ferramentas IA')}>
                                        <div className="ferr-name">Grok</div>
                                        <div className="ferr-desc">Notícias e tendências em tempo real</div>
                                        <div className="ferr-status"><div className="ferr-dot"></div><span className="ferr-st">ativo</span></div>
                                    </div>
                                    <div className="ferr-item" onClick={() => navigateTo('Ferramentas IA')}>
                                        <div className="ferr-name">Gemini</div>
                                        <div className="ferr-desc">Especialistas por mandato</div>
                                        <div className="ferr-status"><div className="ferr-dot"></div><span className="ferr-st">ativo</span></div>
                                    </div>
                                    <div className="ferr-item" onClick={() => navigateTo('Ferramentas IA')}>
                                        <div className="ferr-name">Meu painel</div>
                                        <div className="ferr-desc">Igrejas · Norte MG</div>
                                        <div className="ferr-status"><div className="ferr-dot"></div><span className="ferr-st">18 cadastros</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                );
            })()
            }
        </div >
    );
};

export default DashboardPage;
