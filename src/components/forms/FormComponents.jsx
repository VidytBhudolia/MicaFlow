import React from 'react';

export const FormInput = ({ 
  label, 
  id, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="text-body-text text-base font-medium leading-normal pb-2">
          {label}
          {required && <span className="text-primary-orange ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="form-input-mica"
        {...props}
      />
    </div>
  );
};

export const FormSelect = ({ 
  label, 
  id, 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option",
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="text-body-text text-base font-medium leading-normal pb-2">
          {label}
          {required && <span className="text-primary-orange ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="form-select-mica"
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const FormTextarea = ({ 
  label, 
  id, 
  placeholder, 
  value, 
  onChange, 
  required = false,
  rows = 4,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="text-body-text text-base font-medium leading-normal pb-2">
          {label}
          {required && <span className="text-primary-orange ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className="form-textarea-mica"
        {...props}
      />
    </div>
  );
};

export const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses = variant === 'primary' ? 'btn-primary-mica' : 'btn-secondary-mica';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
