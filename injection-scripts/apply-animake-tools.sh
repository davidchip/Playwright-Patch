#!/bin/bash

# Animake Playwright Codegen Tools Installer
# This script applies the Animake toolset to your Playwright installation

echo "🎭 Animake Playwright Codegen Tools Installer"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "fix-injection-escaped.js" ]; then
    echo "❌ Error: fix-injection-escaped.js not found in current directory"
    echo "   Please run this script from the injection-scripts directory"
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

echo "📝 Applying Animake tools to Playwright..."

# Run the injection script
if node fix-injection-escaped.js; then
    echo ""
    echo "✅ Animake tools successfully installed!"
    echo ""
    echo "🚀 Usage:"
    echo "   npx playwright codegen [URL]"
    echo ""
    echo "🎯 You should see a floating '🎭 Animake Codegen' panel with these tools:"
    echo "   📝 Random Text - Generate random text variables"
    echo "   🔢 Random Integer - Generate random number variables"
    echo "   ✅ Assert Variable - Create assertions with variables"
    echo "   🏷️ By Label - Use accessible label selectors"
    echo ""
    echo "💡 The panel is draggable and all generated code is copied to clipboard!"
else
    echo ""
    echo "❌ Failed to install Animake tools"
    echo "   Check the error messages above for details"
    exit 1
fi
