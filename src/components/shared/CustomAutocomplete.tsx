import React from 'react';
import { Autocomplete, TextField, IconButton, Typography, createFilterOptions } from '@mui/material';
import { Close as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface OptionType {
    inputValue?: string;
    title: string;
    isAdd?: boolean;
}

interface CustomAutocompleteProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    onAdd: (value: string) => void;
    onRemove: (value: string) => void;
    label: string;
}

const filter = createFilterOptions<OptionType>();

export function CustomAutocomplete({ options, value, onChange, onAdd, onRemove, label }: CustomAutocompleteProps) {
    const objectOptions: OptionType[] = options.map((opt) => ({ title: opt }));
    const valueObj: OptionType | null = value ? { title: value } : null;

    return (
        <Autocomplete
            value={valueObj}
            onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                    // Timeout to avoid immediate state updates during render cycles if it happens
                    setTimeout(() => {
                        onChange(newValue);
                    });
                } else if (newValue && newValue.isAdd) {
                    // Add new value
                    onAdd(newValue.inputValue!);
                    onChange(newValue.inputValue!);
                } else if (newValue) {
                    onChange(newValue.title);
                } else {
                    onChange('');
                }
            }}
            filterOptions={(opts, params) => {
                const filtered = filter(opts, params);

                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = opts.some((option) => inputValue === option.title);
                if (inputValue !== '' && !isExisting) {
                    filtered.push({
                        inputValue,
                        title: `Thêm "${inputValue}"`,
                        isAdd: true,
                    });
                }

                return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={objectOptions}
            getOptionLabel={(option) => {
                // e.g., value selected with enter, right from the input
                if (typeof option === 'string') {
                    return option;
                }
                if (option.inputValue) {
                    return option.inputValue;
                }
                return option.title;
            }}
            renderOption={(props, option) => {
                const { key, ...optionProps } = props as any;
                if (option.isAdd) {
                    return (
                        <li key={key} {...optionProps} style={{ color: '#2383e2', fontWeight: 600 }}>
                            <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                            {option.title}
                        </li>
                    );
                }

                return (
                    <li key={key} {...optionProps} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{option.title}</Typography>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent selecting the option
                                onRemove(option.title);
                            }}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </li>
                );
            }}
            freeSolo
            renderInput={(params) => (
                <TextField {...params} label={label} size="small" />
            )}
            onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input') {
                    onChange(newInputValue);
                }
            }}
        />
    );
}
