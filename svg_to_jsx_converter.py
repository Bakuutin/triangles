#!/usr/bin/env python3
"""
SVG to JSX Converter
Reads all SVG files from split_colors directory and converts them to JSX components
"""

import os
import re
from bs4 import BeautifulSoup
from pathlib import Path

def extract_color_from_filename(filename):
    """Extract color code from filename like 'color_001645.svg' -> '001645'"""
    match = re.search(r'color_([a-fA-F0-9]+)\.svg', filename)
    if match:
        return match.group(1)
    return None

def extract_color_from_svg_content(svg_content):
    """Extract color from SVG style definition"""
    color_match = re.search(r'fill:\s*(#[a-fA-F0-9]+)', svg_content)
    if color_match:
        return color_match.group(1)
    return None

def convert_svg_to_jsx(svg_file_path, output_dir):
    """Convert a single SVG file to JSX component"""
    
    # Read SVG file
    with open(svg_file_path, 'r', encoding='utf-8') as f:
        svg_content = f.read()
    
    # Extract color from filename
    filename = os.path.basename(svg_file_path)
    color_code = extract_color_from_filename(filename)
    
    if not color_code:
        print(f"Warning: Could not extract color code from filename: {filename}")
        return
    
    # Extract color from SVG content as fallback
    svg_color = extract_color_from_svg_content(svg_content)
    
    # Parse SVG using BeautifulSoup
    try:
        soup = BeautifulSoup(svg_content, 'xml')
        
        # Find all path and polygon elements with class="color"
        paths = soup.find_all(['path', 'polygon'], class_='color')
        
        if not paths:
            print(f"Warning: No path/polygon elements with class='color' found in {filename}")
            return
        
        # Generate JSX content
        jsx_content = f'''import React from 'react';

const Color{color_code.upper()} = () => {{
  return (
    <React.Fragment key="color_{color_code}">
'''
        
        # Add each path/polygon element
        for element in paths:
            tag_name = element.name
            d_attr = element.get('d', '')
            points_attr = element.get('points', '')
            
            if tag_name == 'path' and d_attr:
                jsx_content += f'      <path className="color" d="{d_attr}"/>\n'
            elif tag_name == 'polygon' and points_attr:
                jsx_content += f'      <polygon className="color" points="{points_attr}"/>\n'
        
        jsx_content += f'''    </React.Fragment>
  );
}};

export default Color{color_code.upper()};
'''
        
        # Write JSX file
        jsx_filename = f'color_{color_code}.jsx'
        jsx_file_path = os.path.join(output_dir, jsx_filename)
        
        with open(jsx_file_path, 'w', encoding='utf-8') as f:
            f.write(jsx_content)
        
        print(f"Created: {jsx_filename}")
        
    except Exception as e:
        print(f"Error processing {filename}: {e}")

def main():
    """Main function to process all SVG files"""
    
    # Define paths
    svg_dir = "split_colors"
    output_dir = "jsxs"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Check if SVG directory exists
    if not os.path.exists(svg_dir):
        print(f"Error: SVG directory '{svg_dir}' not found")
        return
    
    # Get all SVG files
    svg_files = [f for f in os.listdir(svg_dir) if f.endswith('.svg')]
    
    if not svg_files:
        print(f"No SVG files found in '{svg_dir}' directory")
        return
    
    print(f"Found {len(svg_files)} SVG files to convert")
    print("-" * 50)
    
    # Process each SVG file
    for svg_file in sorted(svg_files):
        svg_path = os.path.join(svg_dir, svg_file)
        convert_svg_to_jsx(svg_path, output_dir)
    
    print("-" * 50)
    print(f"Conversion complete! JSX files saved to '{output_dir}' directory")

if __name__ == "__main__":
    main() 