import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function createPageUrl(page) {
    switch (page) {
        case 'Dashboard':
            return '/dashboard';
        case 'Assignments':
            return '/assignments';
        case 'AssignmentDetail':
            return '/assignment';
        default:
            return '/';
    }
}
