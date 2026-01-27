import { useState, useEffect, useCallback } from 'react';

export interface DynamicColumn {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'email' | 'phone';
    key: string; // The property name in the data object
    required?: boolean;
    options?: string[]; // For select type
}

interface UseSchemaOptions {
    collectionName: string;
}

// Default columns usually live in the component, but we can manage *extra* columns here.
export function useSchema(options: UseSchemaOptions) {
    const [columns, setColumns] = useState<DynamicColumn[]>([]);

    const getStorageKey = () => `crm_schema_${options.collectionName}`;

    useEffect(() => {
        // Load initial schema
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
            setColumns(JSON.parse(stored));
        }
    }, [options.collectionName]);

    const addColumn = useCallback((column: Omit<DynamicColumn, 'id' | 'key'>) => {
        const key = getStorageKey();
        const newCol: DynamicColumn = {
            ...column,
            id: Date.now().toString(),
            // Generate a safe machine key from label: "My Field" -> "dynamic_my_field"
            key: `dynamic_${column.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        };

        setColumns(prev => {
            const next = [...prev, newCol];
            localStorage.setItem(key, JSON.stringify(next));
            return next;
        });
        return newCol;
    }, [options.collectionName]);

    const removeColumn = useCallback((columnId: string) => {
        const key = getStorageKey();
        setColumns(prev => {
            const next = prev.filter(c => c.id !== columnId);
            localStorage.setItem(key, JSON.stringify(next));
            return next;
        });
    }, [options.collectionName]);

    return {
        columns,
        addColumn,
        removeColumn
    };
}
