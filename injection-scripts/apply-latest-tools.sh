#!/bin/bash

# Animake Playwright Codegen Tools - Latest Version Installer
# This script applies the latest interactive code generation tools

echo "🎭 Animake Playwright Codegen Tools - Latest Version"
echo "===================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "fix-injection-code-generation.js" ]; then
    echo "❌ Error: fix-injection-code-generation.js not found in current directory"
    echo "   Please run this script from the injection-scripts directory"
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

echo "📝 Applying latest interactive Animake tools to Playwright..."
echo ""
echo "🔧 Features in this version:"
echo "   • Click-to-select element interaction"
echo "   • Smart Playwright selector generation (getByLabel, getByRole, etc.)"
echo "   • Instant code generation (no waiting for recorder)"
echo "   • Visual element highlighting"
echo "   • Automatic clipboard copying"
echo ""

# Run the latest injection script
if node fix-injection-code-generation.js; then
    echo ""
    echo "✅ Latest Animake tools successfully installed!"
    echo ""
    echo "🚀 Usage:"
    echo "   npx playwright codegen [URL]"
    echo ""
    echo "🎯 Interactive workflow:"
    echo "   1. Click '📝 Random Text' or '🔢 Random Integer' (button turns orange)"
    echo "   2. Click any input element on the page"
    echo "   3. Instantly get generated code with variable:"
    echo "      const textVar_abc123 = 'test_1234567890';"
    echo "      await page.getByLabel('Email').fill(textVar_abc123);"
    echo ""
    echo "💡 No waiting for Playwright recorder - code is generated immediately!"
    echo "📋 All code is automatically copied to clipboard!"
else
    echo ""
    echo "❌ Failed to install latest Animake tools"
    echo "   Check the error messages above for details"
    exit 1
fi
