import React from 'react';

const EnviosPage: React.FC<{ navigateTo: (page: string) => void }> = () => {
    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4">Envios (Disparos)</h1>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Embed do SAAS de disparos entrará aqui */}
                <div className="flex items-center justify-center h-full text-slate-400">
                    Iframe do SaaS de disparos será carregado aqui.
                </div>
            </div>
        </div>
    );
};

export default EnviosPage;
