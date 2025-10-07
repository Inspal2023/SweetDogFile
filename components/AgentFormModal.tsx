import React, { useState, useEffect } from 'react';
import type { Agent } from '../types';

interface AgentFormModalProps {
    agent: Agent | null;
    onSave: (agent: Agent) => void;
    onClose: () => void;
}

const AgentFormModal: React.FC<AgentFormModalProps> = ({ agent, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Agent, 'id'>>({ name: '', description: '', masterPrompt: '' });

    useEffect(() => {
        if (agent) {
            setFormData({ name: agent.name, description: agent.description, masterPrompt: agent.masterPrompt });
        } else {
            setFormData({ name: '', description: '', masterPrompt: '' });
        }
    }, [agent]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAgent: Agent = {
            id: agent?.id || `agent-${Date.now()}`,
            ...formData,
        };
        onSave(finalAgent);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl p-8 m-4 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{agent ? '编辑' : '创建'} AI 代理</h2>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="overflow-y-auto pr-2 flex-1">
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">代理名称</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">描述</label>
                            <input
                                type="text"
                                name="description"
                                id="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="masterPrompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">主提示</label>
                            <textarea
                                name="masterPrompt"
                                id="masterPrompt"
                                value={formData.masterPrompt}
                                onChange={handleChange}
                                required
                                rows={10}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 font-mono text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 font-bold py-2 px-4 rounded-md mr-2 transition-colors">取消</button>
                        <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md transition-colors">保存代理</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentFormModal;