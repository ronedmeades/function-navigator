# Function Navigator

This extension lists all function names in the currently selected file and 
allows you to create a 'focus' list of specific functions. This supports development 
workflows from individual function work to full pipelines across multiple files, 
providing instant access to frequently accessed code locations.

## Features

### Smart Function Detection
- Automatically detects functions across multiple programming languages
- Supports standalone functions, class methods, and nested functions
- Handles complex function signatures with parameters and type annotations

### Focus Lists
- Create custom focus lists of functions you're actively working on
- Add functions via right-click menus or panel controls
- Perfect for tracking functions in a development pipeline or feature workflow
- Persistent across VS Code sessions - your focus lists are remembered

### Multi-Language Support
- **JavaScript/TypeScript** - Functions, class methods, arrow functions
- **Python** - Functions, class methods, async functions, decorators
- **C/C++** - Functions, static functions, class methods
- **Go** - Functions with full parameter support
- **And more** - Works with any language that has VS Code language server support

### Professional Integration
- Dedicated panel in VS Code sidebar with custom icon
- Click functions to jump directly to their location
- Line numbers with smart padding for easy reference
- Clean, native VS Code styling
- Toggle between "All Functions" and "Focus List" views

## Usage

### Basic Navigation
1. Open any code file
2. Click the Function Navigator icon in the Activity Bar (sidebar)
3. See all functions listed with line numbers and parameters
4. Click any function to jump to its location

### Using Focus Lists
1. **Add to Focus**: Right-click any function in the panel → "Add to Focus"
2. **Remove from Focus**: Right-click focused function → "Remove from Focus"  
3. **Toggle View**: Click the filter icon to switch between "All Functions" and "Focus List"
4. **Add Current Function**: Right-click in editor → "Add to Focus List" (adds function at cursor)

### Workflow Example
Perfect for pipeline development:
1. Add the 5-10 functions you're currently working on to your focus list
2. Toggle to focus view to see only those functions
3. Click between them as you develop and test
4. Clear the list when you're done with that feature

## Requirements

- VS Code 1.102.0 or higher
- Language servers for your programming languages (usually installed automatically)

## Extension Settings

This extension does not add any VS Code settings. All functionality is accessed through the Function Navigator panel.

## Known Issues

- Very large files (1000+ functions) may have slower initial loading
- Some complex TypeScript generic functions may show simplified signatures
- Language server must be active for function detection to work

## Release Notes

### 1.0.0

Initial release of Function Navigator.

Features include:
- Multi-language function detection (JavaScript, TypeScript, Python, C, C++, Go)
- Focus list functionality with persistence
- Professional VS Code integration
- Click-to-navigate functionality
- Line number display with smart formatting

---

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/ronedmeades/function-navigator).

## Author

**Ron Edmeades**
GitHub: [@ronedmeades](https://github.com/ronedmeades)

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Source Code

The complete source code is available on GitHub for review and contribution:
[https://github.com/ronedmeades/function-navigator](https://github.com/ronedmeades/function-navigator)

---

**Enjoy!**