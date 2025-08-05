import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('Function Navigator is now active!');

    const functionProvider = new FunctionProvider(context);

    functionProvider.loadFocusList();

    vscode.window.registerTreeDataProvider('functionList', functionProvider);

    // Wait for language server to be ready
    const initialLoad = async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // Wait longer for large files
            await new Promise(resolve => setTimeout(resolve, 2000));
            await functionProvider.loadFocusList();
        }
    };

    initialLoad();
    
    vscode.window.onDidChangeActiveTextEditor(async () => {
        await functionProvider.loadFocusList();
        functionProvider.refresh();
    });
    
    vscode.workspace.onDidChangeTextDocument(() => {
        functionProvider.refresh();
    });
    
    let focusMode = false;

    vscode.commands.executeCommand('setContext', 'functionNavigator.focusMode', false);
    
    const toggleFocusOffCommand = vscode.commands.registerCommand('function-navigator.toggleFocusOff', () => {
        focusMode = true;
        vscode.commands.executeCommand('setContext', 'functionNavigator.focusMode', true);
        functionProvider.setFocusMode(true);
        vscode.window.showInformationMessage('Focus mode enabled');
    });

    const toggleFocusOnCommand = vscode.commands.registerCommand('function-navigator.toggleFocusOn', () => {
        focusMode = false;
        vscode.commands.executeCommand('setContext', 'functionNavigator.focusMode', false);
        functionProvider.setFocusMode(false);
        vscode.window.showInformationMessage('Showing all functions');
    });

    const addToFocusCommand = vscode.commands.registerCommand('function-navigator.addToFocus', (functionSymbol: vscode.DocumentSymbol) => {
        functionProvider.addToFocus(functionSymbol);
        vscode.window.showInformationMessage(`Added ${functionSymbol.name} to focus list`);
    });

    const removeFromFocusCommand = vscode.commands.registerCommand('function-navigator.removeFromFocus', (functionSymbol: vscode.DocumentSymbol) => {
        functionProvider.removeFromFocus(functionSymbol);
        vscode.window.showInformationMessage(`Removed ${functionSymbol.name} from focus list`);
    });

    const addCurrentToFocusCommand = vscode.commands.registerCommand('function-navigator.addCurrentToFocus', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        
        const cursorPosition = editor.selection.active;
        
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            editor.document.uri
        );
        
        if (!symbols) {
            vscode.window.showErrorMessage('No symbols found in file');
            return;
        }
        
        const functions = symbols.filter(symbol => symbol.kind === vscode.SymbolKind.Function);
        const currentFunction = functions.find(func => 
            func.range.contains(cursorPosition)
        );
        
        if (currentFunction) {
            functionProvider.addToFocus(currentFunction);
            vscode.window.showInformationMessage(`Added ${currentFunction.name} to focus list`);
        } else {
            vscode.window.showWarningMessage('Cursor is not inside a function');
        }
    });

    context.subscriptions.push(toggleFocusOffCommand, toggleFocusOnCommand, addToFocusCommand, removeFromFocusCommand, addCurrentToFocusCommand);
}

class FunctionProvider implements vscode.TreeDataProvider<vscode.DocumentSymbol> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.DocumentSymbol | undefined | null | void> = new vscode.EventEmitter<vscode.DocumentSymbol | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.DocumentSymbol | undefined | null | void> = this._onDidChangeTreeData.event;
    private focusMode = false;
    private focusList: vscode.DocumentSymbol[] = [];
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private getSignatureForSymbol(symbol: vscode.DocumentSymbol): string {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return symbol.name;}
        
        // Find function definition line, skip decorators
        let functionLine = '';
        let currentLineIndex = symbol.range.start.line;
        const maxLines = Math.min(currentLineIndex + 5, editor.document.lineCount - 1);

        while (currentLineIndex <= maxLines) {
            const line = editor.document.lineAt(currentLineIndex).text.trim();
            
            // Skip decorators that start with @
            if (!line.startsWith('@') && !line.startsWith('//')) {
                functionLine = line;
                break;
            }
            currentLineIndex++;
        }
        
        // Fallback
        let signature = symbol.name;

        // JavaScript/TypeScript functions
        const jsMatch = functionLine.match(/function\s+(\w+\s*\([^)]*\))/);
        if (jsMatch) {
            signature = jsMatch[1];
        } else if (functionLine.includes('function ') && functionLine.includes('(') && !functionLine.includes(')')) {
            // Multi-line JavaScript/TypeScript function
            let functionText = functionLine;
            const startLine = currentLineIndex;
            
            for (let i = startLine + 1; i < Math.min(startLine + 10, editor.document.lineCount); i++) {
                const nextLine = editor.document.lineAt(i).text;
                functionText += ' ' + nextLine.trim();
                if (nextLine.includes(')')) {break;}
            }
            
            const multiJsMatch = functionText.match(/function\s+(\w+\s*\([^)]*\))/);
            if (multiJsMatch) {
                signature = multiJsMatch[1].replace(/\s+/g, ' ');
            }
        } else {
            // Go functions: func name(...) type {
            const goMatch = functionLine.match(/func\s+(\w+\s*\([^)]*\))/);
            if (goMatch) {
                signature = goMatch[1];
            } else {
                // Python functions: def name(...): or async def name(...):
                let pythonMatch = functionLine.match(/(async\s+)?def\s+(\w+\s*\([^)]*\))/);
                if (pythonMatch) {
                    signature = pythonMatch[2];
                } else if (functionLine.includes('def ') && functionLine.includes('(') && !functionLine.includes('):')) {
                    // Multi-line Python function - line has def and open paren but no closing
                    let functionText = functionLine;
                    const startLine = currentLineIndex;
                    
                    for (let i = startLine + 1; i < Math.min(startLine + 10, editor.document.lineCount); i++) {
                        const nextLine = editor.document.lineAt(i).text;
                        functionText += ' ' + nextLine.trim();
                        if (nextLine.includes('):')) {break;}
                    }
                    
                    const multiPythonMatch = functionText.match(/(async\s+)?def\s+(\w+\s*\([^)]*\))/);
                    if (multiPythonMatch) {
                        signature = multiPythonMatch[2].replace(/\s+/g, ' ');
                    }
                } else {
                    // Fallback for other languages
                    const cleanLine = functionLine.replace(/^\s*(function|def|public|private|static|async\s+def)\s*/, '');
                    if (cleanLine.includes('(')) {
                        const endParen = cleanLine.indexOf(')');
                        if (endParen > 0) {
                            signature = cleanLine.substring(0, endParen + 1);
                        }
                    }
                }
            }
        }

        return signature;
    }
    
    public async loadFocusList(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this.focusList = [];
            return;
        }
        
        const fileKey = editor.document.uri.toString();
        
        try {
            let symbols: vscode.DocumentSymbol[] | undefined;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!symbols && attempts < maxAttempts) {
                symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                    'vscode.executeDocumentSymbolProvider',
                    editor.document.uri
                );
                
                if (!symbols && attempts < maxAttempts - 1) {
                    const delay = attempts === 0 ? 1500 : 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                attempts++;
            }
            
            function findAllFunctions(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
                const functions: vscode.DocumentSymbol[] = [];
                
                for (const symbol of symbols) {
                    if (symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Method) {
                        const isCallback = symbol.name.includes(' callback') || 
                                        symbol.name.includes('.reduce()') || 
                                        symbol.name.includes('.map()') || 
                                        symbol.name.includes('.filter()') ||
                                        (symbol.name.includes('()') && symbol.name.includes('.'));

                        if (!isCallback) {
                            functions.push(symbol);
                        }
                    }
                    
                    if (symbol.children && symbol.children.length > 0) {
                        functions.push(...findAllFunctions(symbol.children));
                    }
                }
                
                return functions;
            }
            
            const currentFunctions = findAllFunctions(symbols || []);
            
            // Get stored focus list
            const allFocusLists = this.context.workspaceState.get<{[key: string]: any[]}>('focusLists', {});
            const storedSignatures = allFocusLists[fileKey] || [];
            
            this.focusList = currentFunctions.filter(func => {
                const currentSignature = this.getSignatureForSymbol(func);
                return storedSignatures.some(stored => stored.signature === currentSignature);
            }).sort((a, b) => a.range.start.line - b.range.start.line);
            
        } catch (error) {
            console.log('Error loading focus list:', error);
            this.focusList = [];
        }
    }

    private async saveFocusList(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}
        
        const fileKey = editor.document.uri.toString();
        const allFocusLists = this.context.workspaceState.get<{[key: string]: any[]}>('focusLists', {});
        
        const simplified = this.focusList.map(item => ({
            signature: this.getSignatureForSymbol(item),
            startLine: item.range.start.line
        }));
        
        allFocusLists[fileKey] = simplified;

        await this.context.workspaceState.update('focusLists', allFocusLists);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setFocusMode(enabled: boolean): void {
        this.focusMode = enabled;
        this.refresh();
    }

    addToFocus(functionSymbol: vscode.DocumentSymbol): void {
        const newSignature = this.getSignatureForSymbol(functionSymbol);
        const alreadyExists = this.focusList.find(f => this.getSignatureForSymbol(f) === newSignature);
        
        if (!alreadyExists) {
            this.focusList.push(functionSymbol);
            this.focusList.sort((a, b) => a.range.start.line - b.range.start.line);
            this.saveFocusList();
            this.refresh();
        }
    }

    removeFromFocus(functionSymbol: vscode.DocumentSymbol): void {
        const newSignature = this.getSignatureForSymbol(functionSymbol);
        this.focusList = this.focusList.filter(f => this.getSignatureForSymbol(f) !== newSignature);
        this.saveFocusList();
        this.refresh();
    }

    getTreeItem(element: vscode.DocumentSymbol): vscode.TreeItem {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return new vscode.TreeItem('No file open', vscode.TreeItemCollapsibleState.None);
        }
        
        // Validate the element has valid range data
        if (!element.range || !element.range.start || typeof element.range.start.line !== 'number' || element.range.start.line < 0) {
            return new vscode.TreeItem(`${element.name} (invalid)`, vscode.TreeItemCollapsibleState.None);
        }
        
        const totalLines = editor.document.lineCount;
        const paddingWidth = totalLines.toString().length;

        const lineNumber = element.range.start.line + 1;
        const paddedLineNumber = lineNumber.toString().padStart(paddingWidth, ' ');
        
        // Skip decorators
        let functionLine = '';
        let currentLineIndex = element.range.start.line;
        const maxLines = Math.min(currentLineIndex + 5, editor.document.lineCount - 1);

        while (currentLineIndex <= maxLines) {
            const line = editor.document.lineAt(currentLineIndex).text.trim();
            
            // Skip decorator that start with @
            if (!line.startsWith('@')) {
                functionLine = line;
                break;
            }
            currentLineIndex++;
        }


        const signature = this.getSignatureForSymbol(element);

        const item = new vscode.TreeItem(
            `${paddedLineNumber}   ${signature}`,
            vscode.TreeItemCollapsibleState.None
        );

        item.command = {
            command: 'vscode.open',
            title: 'Go to Function',
            arguments: [
                editor?.document.uri,
                { selection: new vscode.Range(element.range.start, element.range.start) }
            ]
        };

        item.contextValue = "function";
        return item;
    }

    async getChildren(element?: vscode.DocumentSymbol): Promise<vscode.DocumentSymbol[]> {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return [];
		}

		let symbols: vscode.DocumentSymbol[] | undefined;
		let attempts = 0;
		const maxAttempts = 3;
		
		while (!symbols && attempts < maxAttempts) {
			symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
				'vscode.executeDocumentSymbolProvider',
				editor.document.uri
			);
			
			if (!symbols && attempts < maxAttempts - 1) {
				await new Promise(resolve => setTimeout(resolve, 500));
			}
			attempts++;
		}
		
		if (!symbols) {
			return [];
		}
		
        function findAllFunctions(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
            const functions: vscode.DocumentSymbol[] = [];
            
            for (const symbol of symbols) {
                if (symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Method) {
                    const isCallback = symbol.name.includes(' callback') || 
                                    symbol.name.includes('.reduce()') || 
                                    symbol.name.includes('.map()') || 
                                    symbol.name.includes('.filter()') ||
                                    (symbol.name.includes('()') && symbol.name.includes('.'));

                    if (!isCallback) {
                        functions.push(symbol);
                    }
                }
                
                if (symbol.children && symbol.children.length > 0) {
                    functions.push(...findAllFunctions(symbol.children));
                }
            }
            
            return functions;
        }

		const allFunctionsWithDuplicates = findAllFunctions(symbols);

        const allFunctions: vscode.DocumentSymbol[] = [];
        for (const func of allFunctionsWithDuplicates) {
            const signature = this.getSignatureForSymbol(func);
            const alreadyExists = allFunctions.some(f => this.getSignatureForSymbol(f) === signature);

            if (!alreadyExists) {
                allFunctions.push(func);
            }
        }
		
		if (this.focusMode) {
			return this.focusList.length > 0 ? this.focusList : [];
		} else {
			// return allFunctions;
            return allFunctions.sort((a, b) => a.range.start.line - b.range.start.line);
		}
	}
}

export function deactivate() {}