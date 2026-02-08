import React, { useContext, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { IconButton, Menu, MenuItem, Tooltip, ListItemIcon, ListItemText } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import ForestIcon from '@mui/icons-material/Forest';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AcUnitIcon from '@mui/icons-material/AcUnit';

const ThemeSwitcher = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
        handleClose();
    };

    return (
        <>
            <Tooltip title="Match your vibe">
                <IconButton
                    onClick={handleClick}
                    sx={{
                        color: 'var(--primary-main)',
                        bgcolor: 'var(--glass-bg)',
                        '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' },
                        border: '1px solid var(--glass-border)',
                        ml: 1
                    }}
                >
                    <PaletteIcon />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid var(--glass-border)',
                        minWidth: 160
                    }
                }}
            >
                <MenuItem
                    onClick={() => changeTheme('eco')}
                    selected={theme === 'eco'}
                    sx={{ borderRadius: '8px', m: '4px' }}
                >
                    <ListItemIcon><ForestIcon sx={{ color: '#4caf50' }} /></ListItemIcon>
                    <ListItemText primary="Eco Light" />
                </MenuItem>
                <MenuItem
                    onClick={() => changeTheme('dracula')}
                    selected={theme === 'dracula'}
                    sx={{ borderRadius: '8px', m: '4px' }}
                >
                    <ListItemIcon><DarkModeIcon sx={{ color: '#bd93f9' }} /></ListItemIcon>
                    <ListItemText primary="Dracula" />
                </MenuItem>
                <MenuItem
                    onClick={() => changeTheme('nord')}
                    selected={theme === 'nord'}
                    sx={{ borderRadius: '8px', m: '4px' }}
                >
                    <ListItemIcon><AcUnitIcon sx={{ color: '#88c0d0' }} /></ListItemIcon>
                    <ListItemText primary="Nord Blue" />
                </MenuItem>
            </Menu>
        </>
    );
};

export default ThemeSwitcher;
