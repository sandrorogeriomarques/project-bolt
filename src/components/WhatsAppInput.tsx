import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatPhoneNumber } from '../utils/formatPhone';

interface Country {
  name: string;
  code: string;
  flag: string;
}

const countries: Country[] = [
  { name: 'Brasil', code: '+55', flag: '🇧🇷' },
  { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'Colômbia', code: '+57', flag: '🇨🇴' },
  { name: 'México', code: '+52', flag: '🇲🇽' },
  { name: 'Peru', code: '+51', flag: '🇵🇪' },
  { name: 'Uruguai', code: '+598', flag: '🇺🇾' },
  { name: 'Paraguai', code: '+595', flag: '🇵🇾' }
];

interface WhatsAppInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function WhatsAppInput({ value, onChange, disabled }: WhatsAppInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Brasil como padrão
  const [displayValue, setDisplayValue] = useState('');

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    // Atualiza o número com o novo código de país
    const formattedNumber = formatPhoneNumber(displayValue, country.code);
    onChange(formattedNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '');
    setDisplayValue(inputValue);
    const formattedNumber = formatPhoneNumber(inputValue, selectedCountry.code);
    onChange(formattedNumber);
  };

  return (
    <div className="relative">
      <div className="flex">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <span>{selectedCountry.flag}</span>
          <span>{selectedCountry.code}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <input
          type="tel"
          value={displayValue}
          onChange={handlePhoneChange}
          disabled={disabled}
          placeholder="WhatsApp"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => handleCountrySelect(country)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
              <span className="text-gray-500 ml-auto">{country.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
