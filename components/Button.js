export default function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) {
  const baseStyles = 'px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-600',
    secondary: 'bg-secondary text-white hover:bg-green-600',
    danger: 'bg-danger text-white hover:bg-red-600',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
