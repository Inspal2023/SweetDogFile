import React from 'react';
import Spinner from './Spinner';

interface ReportDisplayProps {
    reportMarkdown: string;
    onReset: () => void;
    onDownload: () => void;
    isDownloading: boolean;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportMarkdown, onReset, onDownload, isDownloading }) => {

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">分析报告 (Markdown 预览)</h2>
                <div>
                    <button
                        onClick={onDownload}
                        disabled={isDownloading}
                        className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-700/50 text-white font-bold py-2 px-4 rounded-md mr-2 transition-colors flex items-center justify-center w-48"
                    >
                        {isDownloading ? (
                            <>
                                <Spinner />
                                <span className="ml-2">正在生成...</span>
                            </>
                        ) : (
                            '下载 Word 文档'
                        )}
                    </button>
                    <button
                        onClick={onReset}
                        disabled={isDownloading}
                        className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        重新开始
                    </button>
                </div>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-auto p-6 font-mono text-sm">
                 <pre className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">
                    <code>{reportMarkdown}</code>
                </pre>
            </div>
        </div>
    );
};

export default ReportDisplay;
