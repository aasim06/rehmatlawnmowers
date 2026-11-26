import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Box from '@mui/material/Box';

// assets
import SearchOutlined from '@ant-design/icons/SearchOutlined';

// ==============================|| HEADER CONTENT - SEARCH ||============================== //

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/inventory/items?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <Box sx={{ width: '100%', ml: { xs: 0, md: 1.5 } }}>
      <FormControl sx={{ width: { xs: '100%', md: 320, lg: 360 } }}>
        <OutlinedInput
          size="small"
          id="header-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          startAdornment={
            <InputAdornment position="start" sx={{ mr: 0.5, color: 'text.secondary' }}>
              <SearchOutlined />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <Box
                component="kbd"
                sx={{
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 1,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  color: 'text.secondary',
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                Enter
              </Box>
            </InputAdornment>
          }
          aria-describedby="header-search-text"
          placeholder="Search inventory items or SKU..."
          sx={{ height: 38, borderRadius: 2 }}
        />
      </FormControl>
    </Box>
  );
}
