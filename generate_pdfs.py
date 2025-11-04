#!/usr/bin/env python3
"""
Generate PDF versions of the Cyber Due Diligence Proposal documents
Requires: weasyprint or wkhtmltopdf (install with pip install weasyprint)
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """Check if required PDF generation tools are installed"""
    tools = []
    
    # Check for weasyprint
    try:
        import weasyprint
        tools.append('weasyprint')
    except ImportError:
        pass
    
    # Check for wkhtmltopdf
    try:
        result = subprocess.run(['which', 'wkhtmltopdf'], capture_output=True, text=True)
        if result.returncode == 0:
            tools.append('wkhtmltopdf')
    except:
        pass
    
    # Check for Chrome/Chromium headless
    try:
        result = subprocess.run(['which', 'google-chrome'], capture_output=True, text=True)
        if result.returncode == 0:
            tools.append('chrome')
    except:
        pass
    
    try:
        result = subprocess.run(['which', 'chromium'], capture_output=True, text=True)
        if result.returncode == 0:
            tools.append('chromium')
    except:
        pass
    
    return tools

def generate_pdf_weasyprint(html_file, pdf_file):
    """Generate PDF using WeasyPrint"""
    try:
        from weasyprint import HTML
        HTML(filename=str(html_file)).write_pdf(pdf_file)
        return True
    except Exception as e:
        print(f"WeasyPrint error: {e}")
        return False

def generate_pdf_wkhtmltopdf(html_file, pdf_file):
    """Generate PDF using wkhtmltopdf"""
    try:
        cmd = [
            'wkhtmltopdf',
            '--enable-local-file-access',
            '--no-stop-slow-scripts',
            '--javascript-delay', '2000',
            '--margin-top', '25mm',
            '--margin-bottom', '25mm',
            '--margin-left', '25mm',
            '--margin-right', '25mm',
            str(html_file),
            str(pdf_file)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"wkhtmltopdf error: {e}")
        return False

def generate_pdf_chrome(html_file, pdf_file):
    """Generate PDF using Chrome/Chromium headless"""
    try:
        # Try Google Chrome first
        chrome_cmd = 'google-chrome'
        result = subprocess.run(['which', chrome_cmd], capture_output=True)
        if result.returncode != 0:
            # Try Chromium
            chrome_cmd = 'chromium'
            result = subprocess.run(['which', chrome_cmd], capture_output=True)
            if result.returncode != 0:
                return False
        
        cmd = [
            chrome_cmd,
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--print-to-pdf=' + str(pdf_file),
            '--no-margins',
            'file://' + str(html_file.absolute())
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"Chrome error: {e}")
        return False

def main():
    # Define file paths
    current_dir = Path(__file__).parent
    
    files_to_convert = [
        {
            'html': current_dir / 'Cyber_Due_Diligence_Transmittal_Letter.html',
            'pdf': current_dir / 'Cyber_Due_Diligence_Transmittal_Letter.pdf'
        },
        {
            'html': current_dir / 'Collymore_Cyber_Due_Diligence_Proposal.html',
            'pdf': current_dir / 'Collymore_Cyber_Due_Diligence_Proposal.pdf'
        }
    ]
    
    # Check available tools
    available_tools = check_dependencies()
    
    if not available_tools:
        print("❌ No PDF generation tools found!")
        print("\nPlease install one of the following:")
        print("  • WeasyPrint: pip install weasyprint")
        print("  • wkhtmltopdf: brew install wkhtmltopdf (Mac) or apt-get install wkhtmltopdf (Linux)")
        print("  • Chrome: Download from https://www.google.com/chrome/")
        print("\nAlternatively, you can open the HTML files in your browser and print to PDF:")
        for file_info in files_to_convert:
            print(f"  • {file_info['html']}")
        return 1
    
    print(f"✅ Found PDF generation tools: {', '.join(available_tools)}")
    
    # Convert each file
    for file_info in files_to_convert:
        html_file = file_info['html']
        pdf_file = file_info['pdf']
        
        if not html_file.exists():
            print(f"❌ HTML file not found: {html_file}")
            continue
        
        print(f"\n📄 Converting {html_file.name} to PDF...")
        
        success = False
        
        # Try different methods in order of preference
        if 'weasyprint' in available_tools:
            print("  Using WeasyPrint...")
            success = generate_pdf_weasyprint(html_file, pdf_file)
        
        if not success and 'wkhtmltopdf' in available_tools:
            print("  Using wkhtmltopdf...")
            success = generate_pdf_wkhtmltopdf(html_file, pdf_file)
        
        if not success and ('chrome' in available_tools or 'chromium' in available_tools):
            print("  Using Chrome/Chromium...")
            success = generate_pdf_chrome(html_file, pdf_file)
        
        if success and pdf_file.exists():
            file_size = pdf_file.stat().st_size / 1024  # Size in KB
            print(f"  ✅ PDF created: {pdf_file.name} ({file_size:.1f} KB)")
        else:
            print(f"  ❌ Failed to create PDF")
            print(f"\n  💡 TIP: Open {html_file.name} in your browser and use Print > Save as PDF")
    
    print("\n" + "="*50)
    print("PDF Generation Complete!")
    print("="*50)
    
    # Show generated files
    print("\n📁 Generated files:")
    for file_info in files_to_convert:
        if file_info['pdf'].exists():
            print(f"  ✅ {file_info['pdf']}")
        else:
            print(f"  ⏳ {file_info['html']} (open in browser to save as PDF)")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())