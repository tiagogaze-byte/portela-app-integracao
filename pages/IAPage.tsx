import React from 'react';

const IAPage: React.FC<{ navigateTo: (page: string) => void }> = () => {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Ferramentas IA</h1>
            <p className="text-slate-500 mt-2">Acesso ao Opal e Gems (Gemini).</p>
        </div>
    );
};

export default IAPage;
