import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Buscar...' }) => {
    return (
        <div className="filter-group search-input-wrapper">
            <Search size={18} />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ width: '100%' }}
            />
        </div>
    );
};

export default SearchBar;
