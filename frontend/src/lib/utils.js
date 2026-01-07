import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Extend tailwind-merge to handle custom utilities
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            // Allow bg-none to coexist with bg-* classes (for gradient reset pattern)
            // bg-none sets background-image: none, allowing background-color to take effect
            'bg-image': ['bg-none'],
        },
        conflictingClassGroups: {
            // bg-none should conflict with bg-gradient-* (both set background-image)
            'bg-image': ['gradient'],
        },
    },
});

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
