import React, { useRef } from 'react';
import FolderIcon from './icons/FolderIcon';

interface FileUploadProps {
    onFileChange: (files: FileList | null) => void;
    disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFileChange(event.target.files);
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="w-full max-w-xl">
            <label
                htmlFor="folder-upload"
                onClick={handleClick}
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    disabled
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FolderIcon />
                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">点击上传文件夹</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">选择一个项目文件夹以开始分析</p>
                </div>
                <input
                    ref={inputRef}
                    id="folder-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    // @ts-ignore
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    disabled={disabled}
                />
            </label>
        </div>
    );
};

export default FileUpload;