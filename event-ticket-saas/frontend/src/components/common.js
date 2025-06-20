import React from 'react';

// Button component
export const Button = ({ 
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  // Define button size classes
  const sizeClasses = {
    small: 'py-2 px-4 text-sm',
    medium: 'py-3 px-5',
    large: 'py-4 px-6 text-lg'
  };

  // Define button variant classes
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300',
    outline: 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50',
    ghost: 'bg-transparent text-blue-500 hover:bg-blue-50'
  };

  // Combine all classes
  const buttonClasses = `
    inline-flex items-center justify-center
    rounded-lg 
    font-medium
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Card component
export const Card = ({ 
  children, 
  title, 
  subtitle,
  onClick, 
  hoverable = true,
  className = '' 
}) => {
  return (
    <div 
      className={`
        bg-white
        rounded-xl
        shadow-sm
        overflow-hidden
        ${hoverable ? 'hover:shadow-md hover:-translate-y-1' : ''}
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="p-6 border-b border-gray-100">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

// Input component
export const Input = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-gray-800 font-medium mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full
          px-4 py-3
          bg-white
          border ${error ? 'border-red-500' : 'border-gray-300'}
          rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Navbar component
export const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a href="/" className="font-bold text-xl text-blue-500">EventTicket</a>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Home
              </a>
              <a href="/events" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Events
              </a>
              {user && (
                <a href="/tickets" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                  My Tickets
                </a>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
          {user ? (
                  <div className="flex items-center space-x-4">
                    <a href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                      Dashboard
                    </a>
                    <a href="/tickets" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                      My Tickets
                    </a>
                    <a href="/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                      {user.firstName}
                    </a>
                    <button
                      onClick={onLogout}
                      className="text-sm font-medium text-red-500 hover:text-red-700"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
              <div className="flex items-center space-x-4">
                <a href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  Sign in
                </a>
                <a href="/register" className="ml-2 px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600">
                  Sign up
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

     {/* Mobile menu */}
     <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            <a
              href="/"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
            >
              Home
            </a>
            <a
              href="/events"
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
            >
              Events
            </a>
            {user && (
              <a
                href="/tickets"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
              >
                My Tickets
              </a>
            )}
          </div>
        </div>
      </nav>
    );
  };