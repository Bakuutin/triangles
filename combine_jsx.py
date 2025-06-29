#!/usr/bin/env python3
"""
Script to combine all JSX color components into a single array in allletters.tsx
"""

import os
import re
from pathlib import Path

def extract_color_name(filename):
    """Extract color name from filename (e.g., 'color_7b00ff.jsx' -> '7b00ff')"""
    match = re.match(r'color_([a-f0-9]+)\.jsx', filename)
    return match.group(1) if match else None

def read_jsx_content(file_path):
    """Read JSX content from file and return the React.Fragment content"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    # Extract the content between React.Fragment tags
    # Remove the opening and closing React.Fragment tags
    content = re.sub(r'^\s*<React\.Fragment[^>]*>', '', content)
    content = re.sub(r'</React\.Fragment>\s*$', '', content)
    
    return content.strip()

def create_component_function(color_name, jsx_content):
    """Create a React component function for the color"""
    # Convert color name to PascalCase for component name
    component_name = ''.join(word.capitalize() for word in color_name.split('_'))
    
    return f"""const Color{component_name.upper()} = () => {{
    return (
      <React.Fragment key="color_{color_name}">
{jsx_content}
      </React.Fragment>
    );
  }};"""

def main():
    jsxs_dir = Path('jsxs')
    output_file = 'allletters.tsx'
    
    if not jsxs_dir.exists():
        print(f"Error: {jsxs_dir} directory not found")
        return
    
    # Get all JSX files
    jsx_files = list(jsxs_dir.glob('*.jsx'))
    
    if not jsx_files:
        print("No JSX files found in jsxs directory")
        return
    
    # Sort files for consistent output
    jsx_files.sort()
    
    # Read and process each file
    components = [
        f"""(
         <>
         {read_jsx_content(path)}
         </>
         )
        """.strip()
        for index, path in enumerate(jsx_files)
    ]
    
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("""
import React from "react";

export const paths = [
{}
]
                """.format(",\n".join(components)))

if __name__ == "__main__":
    main() 