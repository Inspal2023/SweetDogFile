import { GoogleGenAI } from "@google/genai";
import type { FileNode } from '../types';

const MAX_TEXT_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Utility function to read file as text
const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (file.size > MAX_TEXT_FILE_SIZE) {
            resolve(`文件太大(${(file.size / 1024 / 1024).toFixed(2)} MB)。内容已截断。`);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

// Utility function to read file as base64 for images
const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // remove data:mime/type;base64, prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const getFileSummary = async (ai: GoogleGenAI, filePath: string, content: string, mimeType: string): Promise<string> => {
    try {
        if (mimeType.startsWith('image/')) {
            const imagePart = {
                inlineData: {
                    mimeType: mimeType,
                    data: content, // content is base64 string for images
                },
            };
            const textPart = { text: `描述位于 "${filePath}" 的这张图片。它在项目中的用途是什么？` };
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [textPart, imagePart] },
            });
            return response.text;
        } else {
            // For text files, we can just use the content directly or summarize if needed
            // For this implementation, we will pass the full text content to the final prompt
            return content;
        }
    } catch (error) {
        console.error(`总结文件 ${filePath} 时出错:`, error);
        return `总结文件出错: ${filePath}。`;
    }
};

// Main function to process files
export const processFiles = async (ai: GoogleGenAI, files: File[], setProgress: (message: string) => void) => {
    const fileTree: FileNode = { name: 'root', path: '/', type: 'directory', children: [], content: null };
    let summaryText = '## 目录结构 ##\n';
    let contentText = '\n## 文件内容 ##\n';

    const filePaths = files.map(f => f.webkitRelativePath || f.name).sort();
    
    // Build directory structure text and tree
    const pathSet = new Set<string>();
    filePaths.forEach(path => {
        const parts = path.split('/');
        let currentLevel = fileTree.children!;
        let currentPath = '';

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (!pathSet.has(currentPath)) {
                const isFile = index === parts.length - 1;
                const nodeType = isFile ? 'file' : 'directory';
                const indent = '  '.repeat(index);
                summaryText += `${indent}- ${part}\n`;

                const newNode: FileNode = {
                    name: part,
                    path: currentPath,
                    type: nodeType,
                    children: isFile ? undefined : [],
                    content: null,
                };
                
                // Find parent to attach
                if (index > 0) {
                  const parentPath = parts.slice(0, index).join('/');
                  let parentNode = fileTree;
                  parentPath.split('/').forEach(p => {
                      parentNode = parentNode.children?.find(c => c.name === p) ?? parentNode;
                  });
                  parentNode.children?.push(newNode);
                } else {
                  currentLevel.push(newNode);
                }

                pathSet.add(currentPath);
            }
        });
    });

    // Process file contents
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = file.webkitRelativePath || file.name;
        setProgress(`正在处理文件 ${i + 1}/${files.length}: ${file.name}`);

        const mimeType = file.type || 'application/octet-stream';
        
        contentText += `\n--- 文件: ${filePath} ---\n`;

        if (mimeType.startsWith('image/')) {
            const base64Content = await readFileAsBase64(file);
            const imageSummary = await getFileSummary(ai, filePath, base64Content, mimeType);
            contentText += `[图片内容描述]:\n${imageSummary}\n`;
        } else if (mimeType.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.html') || file.name.endsWith('.css')) {
            const textContent = await readFileAsText(file);
            contentText += `${textContent}\n`;
        } else {
            contentText += `[二进制文件类型 ${mimeType} 的内容未显示]\n`;
        }
    }
    
    return { fileTree, summary: summaryText + contentText };
};


export const generateFinalReportAsMarkdown = async (ai: GoogleGenAI, masterPrompt: string, context: string): Promise<string> => {
    const finalPrompt = `
${masterPrompt}

这是上传项目的上下文。它包括目录结构、所有文本文件的全部内容以及所有图像文件的描述。

${context}

请现在根据这些文件和您的指示生成 Markdown 格式的报告。
`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
        });
        
        let markdownContent = response.text;
        
        if (markdownContent.startsWith('```markdown')) {
            markdownContent = markdownContent.substring(10);
        }
        if (markdownContent.startsWith('```')) {
            markdownContent = markdownContent.substring(3);
        }
        if (markdownContent.endsWith('```')) {
            markdownContent = markdownContent.slice(0, -3);
        }

        return markdownContent.trim();
    } catch (error) {
        console.error("生成最终报告时出错:", error);
        throw new Error("从 AI 模型生成最终报告失败。");
    }
};

export const convertMarkdownToHtmlForWord = async (ai: GoogleGenAI, markdown: string): Promise<string> => {
    const prompt = `
请将以下 Markdown 文本转换为一个独立的 HTML 文档。
请使用内联样式以确保在 Microsoft Word 中具有良好的兼容性。
HTML 应该结构良好，但不应包含任何 <script> 标签或外部样式表链接。
直接输出 HTML 代码，不要包含任何解释或 markdown 代码块包装。

Markdown 内容如下:
---
${markdown}
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("将 Markdown 转换为 HTML 时出错:", error);
        throw new Error("从 AI 模型转换 Markdown 到 HTML 失败。");
    }
};
