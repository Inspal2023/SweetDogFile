import React from 'react';
import type { Agent } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface AgentManagerProps {
    agents: Agent[];
    selectedAgentId: string | null;
    onAgentSelect: (id: string) => void;
    onAddNewAgent: () => void;
    onEditAgent: (agent: Agent) => void;
    onDeleteAgent: (id: string) => void;
    disabled: boolean;
}

const AgentManager: React.FC<AgentManagerProps> = ({
    agents,
    selectedAgentId,
    onAgentSelect,
    onAddNewAgent,
    onEditAgent,
    onDeleteAgent,
    disabled
}) => {
    return (
        <aside className="w-80 bg-white dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-md">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI 代理</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">选择一个分析配置</p>
            </div>
            <div className="flex-1 overflow-y-auto">
                {agents.map(agent => (
                    <div
                        key={agent.id}
                        onClick={() => !disabled && onAgentSelect(agent.id)}
                        className={`p-4 border-b border-slate-200 dark:border-slate-800 group transition-all duration-200 ${
                            selectedAgentId === agent.id 
                                ? 'bg-sky-50 dark:bg-sky-900/50' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`font-semibold ${selectedAgentId === agent.id ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>{agent.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{agent.description}</p>
                            </div>
                             <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); onEditAgent(agent); }} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" disabled={disabled}><EditIcon /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id); }} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" disabled={disabled}><TrashIcon /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={onAddNewAgent}
                    disabled={disabled}
                    className="w-full flex items-center justify-center bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                    <PlusIcon />
                    <span className="ml-2">添加新代理</span>
                </button>
            </div>
        </aside>
    );
};

export default AgentManager;