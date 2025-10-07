import React, { useState, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';

import type { Agent, FileNode } from './types';
import { AnalysisStatus } from './types';
import { INITIAL_AGENTS } from './constants';
import { processFiles, generateFinalReportAsMarkdown, convertMarkdownToHtmlForWord } from './services/geminiService';

import AgentManager from './components/AgentManager';
import AgentFormModal from './components/AgentFormModal';
import FileUpload from './components/FileUpload';
import ReportDisplay from './components/ReportDisplay';
import Spinner from './components/Spinner';

const App: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(INITIAL_AGENTS[0]?.id || null);
    const [files, setFiles] = useState<File[]>([]);
    const [fileTree, setFileTree] = useState<FileNode | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.Idle);
    const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);

    const ai = useMemo(() => {
        if (!process.env.API_KEY) {
            console.error("API_KEY environment variable not set.");
            return null;
        }
        return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }, []);

    const handleAgentSelect = (id: string) => {
        setSelectedAgentId(id);
    };

    const handleEditAgent = (agent: Agent) => {
        setEditingAgent(agent);
        setIsModalOpen(true);
    };

    const handleAddNewAgent = () => {
        setEditingAgent(null);
        setIsModalOpen(true);
    };

    const handleDeleteAgent = (id: string) => {
        setAgents(prev => prev.filter(agent => agent.id !== id));
        if (selectedAgentId === id) {
            setSelectedAgentId(agents.length > 1 ? agents.find(a => a.id !== id)!.id : null);
        }
    };

    const handleSaveAgent = (agent: Agent) => {
        setAgents(prev => {
            const existing = prev.find(a => a.id === agent.id);
            if (existing) {
                return prev.map(a => a.id === agent.id ? agent : a);
            }
            return [...prev, agent];
        });
        setIsModalOpen(false);
        setEditingAgent(null);
    };

    const handleFileChange = (uploadedFiles: FileList | null) => {
        if (uploadedFiles) {
            setFiles(Array.from(uploadedFiles));
        }
    };
    
    const handleAnalyze = useCallback(async () => {
        if (!files.length || !selectedAgentId || !ai) {
            setError("请先上传文件并选择一个代理。同时，请确保您的 API 密钥已配置。");
            return;
        }

        const selectedAgent = agents.find(a => a.id === selectedAgentId);
        if (!selectedAgent) {
            setError("未找到所选代理。");
            return;
        }

        setError(null);
        setReportMarkdown(null);
        setAnalysisStatus(AnalysisStatus.Processing);
        setProgressMessage("正在处理文件并提取内容...");

        try {
            const { fileTree: newFileTree, summary } = await processFiles(ai, files, (newProgressMessage) => {
                setProgressMessage(newProgressMessage);
            });
            setFileTree(newFileTree);

            setAnalysisStatus(AnalysisStatus.Generating);
            setProgressMessage("正在使用所选代理生成最终报告...");

            const finalReport = await generateFinalReportAsMarkdown(ai, selectedAgent.masterPrompt, summary);
            setReportMarkdown(finalReport);
            setAnalysisStatus(AnalysisStatus.Success);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "分析过程中发生未知错误。");
            setAnalysisStatus(AnalysisStatus.Error);
        } finally {
            setProgressMessage('');
        }
    }, [files, selectedAgentId, agents, ai]);
    
    const handleDownload = async () => {
        if (!reportMarkdown || !ai) return;

        setIsDownloading(true);
        setError(null);

        try {
            const htmlContent = await convertMarkdownToHtmlForWord(ai, reportMarkdown);
            
            const wordContent = `
                <html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <title>AI 分析报告</title>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;

            const blob = new Blob([wordContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ai-分析报告.doc';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "下载报告时发生未知错误。");
        } finally {
            setIsDownloading(false);
        }
    };

    const isAnalyzing = [AnalysisStatus.Processing, AnalysisStatus.Summarizing, AnalysisStatus.Generating].includes(analysisStatus);

    return (
        <div className="flex h-screen font-sans text-slate-800 dark:text-slate-200">
            <AgentManager
                agents={agents}
                selectedAgentId={selectedAgentId}
                onAgentSelect={handleAgentSelect}
                onAddNewAgent={handleAddNewAgent}
                onEditAgent={handleEditAgent}
                onDeleteAgent={handleDeleteAgent}
                disabled={isAnalyzing}
            />

            <main className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-100 dark:bg-slate-800/50">
                <header className="mb-6">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">恬狗 <span className="text-sky-500">AI 文件夹解析器</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">上传一个文件夹，选择一个 AI 代理，然后获取一份全面的分析报告。</p>
                </header>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">{error}</div>}

                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 flex flex-col">
                    {!reportMarkdown && analysisStatus !== AnalysisStatus.Success && (
                         <div className="flex flex-col items-center justify-center text-center h-full">
                            <FileUpload onFileChange={handleFileChange} disabled={isAnalyzing} />
                            {files.length > 0 && (
                                <div className="mt-6 w-full max-w-md text-left">
                                    <h3 className="font-semibold text-lg mb-2 text-slate-700 dark:text-slate-300">已选文件 ({files.length}):</h3>
                                    <ul className="text-sm text-slate-500 dark:text-slate-400 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        {files.map(file => <li key={file.webkitRelativePath || file.name}>{file.webkitRelativePath || file.name}</li>)}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || files.length === 0 || !selectedAgentId}
                                className="mt-8 flex items-center justify-center bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Spinner />
                                        <span className="ml-2">{progressMessage}</span>
                                    </>
                                ) : '分析项目'}
                            </button>
                        </div>
                    )}

                    {(reportMarkdown && analysisStatus === AnalysisStatus.Success) && (
                        <ReportDisplay 
                            reportMarkdown={reportMarkdown} 
                            onReset={() => {
                                setReportMarkdown(null);
                                setFiles([]);
                                setFileTree(null);
                                setAnalysisStatus(AnalysisStatus.Idle);
                            }}
                            onDownload={handleDownload}
                            isDownloading={isDownloading}
                        />
                    )}
                </div>
            </main>

            {isModalOpen && (
                <AgentFormModal
                    agent={editingAgent}
                    onSave={handleSaveAgent}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default App;