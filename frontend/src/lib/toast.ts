import { toast as sonnerToast } from 'sonner'

// Custom toast styles matching the app's neo-brutalist theme
const baseStyles = {
  style: {
    background: 'var(--card)',
    color: '#1a1a1a',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
}

const successStyles = {
  style: {
    ...baseStyles.style,
    background: 'oklch(0.9195 0.0801 87.6670)', // accent color (yellow-ish)
    borderColor: 'oklch(0.6209 0.1801 348.1385)', // primary (pink)
  },
}

const errorStyles = {
  style: {
    ...baseStyles.style,
    background: 'oklch(0.95 0.05 0)', // light red-ish
    borderColor: 'var(--destructive)',
  },
}

const infoStyles = {
  style: {
    ...baseStyles.style,
    background: 'oklch(0.8095 0.0694 198.1863)', // secondary (blue-ish)
    borderColor: 'var(--primary)',
  },
}

export const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    return sonnerToast.success(message, {
      ...successStyles,
      ...options,
    })
  },
  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
    return sonnerToast.error(message, {
      ...errorStyles,
      ...options,
    })
  },
  info: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(message, {
      ...infoStyles,
      ...options,
    })
  },
  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
    return sonnerToast.warning(message, {
      style: {
        ...baseStyles.style,
        background: 'oklch(0.9498 0.0500 86.8891)', // card color
        borderColor: 'oklch(0.7091 0.1697 21.9551)', // destructive
      },
      ...options,
    })
  },
  loading: (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) => {
    return sonnerToast.loading(message, {
      ...baseStyles,
      ...options,
    })
  },
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
}