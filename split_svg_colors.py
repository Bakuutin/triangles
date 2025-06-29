#!/usr/bin/env python3
"""
Script to split an SVG file into separate SVG files based on color classes.
Each color will be extracted into its own SVG file.
"""

import re
import os
from pathlib import Path

def parse_svg_colors(svg_content):
    """Parse the SVG content and extract color classes and their corresponding elements."""
    
    # Extract color definitions from CSS
    color_pattern = r'\.st(\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]{6});'
    color_matches = re.findall(color_pattern, svg_content)
    
    # Create a mapping of class names to colors
    color_map = {}
    for class_num, color in color_matches:
        class_name = f"st{class_num}"
        color_map[class_name] = color
    
    # Extract SVG header and viewBox
    header_match = re.search(r'(<svg[^>]*>)', svg_content)
    svg_header = header_match.group(1) if header_match else '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4284 5712">'
    
    # Extract elements by color class
    color_elements = {}
    
    for class_name, color in color_map.items():
        # Find all elements with this class
        pattern = rf'<([^>]*class="[^"]*{class_name}[^"]*"[^>]*)>'
        elements = re.findall(pattern, svg_content)
        
        if elements:
            color_elements[color] = elements
    
    return svg_header, color_elements

def create_color_svg(svg_header, elements, color, color_name):
    """Create a new SVG file for a specific color."""
    
    # Create the SVG content
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
{svg_header}
  <defs>
    <style>
      .color {{
        fill: {color};
      }}
    </style>
  </defs>'''
    
    # Add all elements for this color
    for element in elements:
        # Replace the original class with our new color class
        element_with_color = re.sub(r'class="[^"]*"', 'class="color"', element)
        svg_content += f'\n  <{element_with_color}>'
    
    svg_content += '\n</svg>'
    
    return svg_content

def split_svg_by_colors(input_file, output_dir):
    """Split the SVG file into separate files based on colors."""
    
    # Read the SVG file
    with open(input_file, 'r', encoding='utf-8') as f:
        svg_content = f.read()
    
    # Parse colors and elements
    svg_header, color_elements = parse_svg_colors(svg_content)
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Create a file for each color
    created_files = []
    for color, elements in color_elements.items():
        # Create a color name for the filename
        color_name = color.lstrip('#')
        
        # Create the SVG content for this color
        color_svg = create_color_svg(svg_header, elements, color, color_name)
        
        # Write to file
        output_file = output_path / f"color_{color_name}.svg"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(color_svg)
        
        created_files.append(output_file)
        print(f"Created: {output_file} (color: {color})")
    
    return created_files

def main():
    """Main function to run the SVG color splitter."""
    
    input_file = "bw.svg"
    output_dir = "split_colors"
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found!")
        return
    
    print(f"Splitting SVG file: {input_file}")
    print(f"Output directory: {output_dir}")
    print("-" * 50)
    
    try:
        created_files = split_svg_by_colors(input_file, output_dir)
        print(f"\nSuccessfully created {len(created_files)} color-separated SVG files!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 