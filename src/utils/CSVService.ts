import Papa from 'papaparse';

export interface CSVColumn {
    key: string;
    label: string;
    isDynamic?: boolean;
}

export class CSVService {
    /**
     * Exports data to a CSV file
     * @param data Array of items to export
     * @param columns Definition of columns to include
     * @param filename Desired filename (without extension)
     */
    static exportData(data: any[], columns: CSVColumn[], filename: string) {
        const exportData = data.map(item => {
            const row: Record<string, any> = {};
            columns.forEach(col => {
                row[col.label] = item[col.key] ?? '';
            });
            return row;
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Parses a CSV file and maps it to target fields
     * @param file The File object from an input
     * @returns Promise resolving to an array of mapped items
     */
    static async importData(file: File, columns: CSVColumn[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const mappedData = results.data.map((row: any) => {
                        const item: Record<string, any> = {};

                        columns.forEach(col => {
                            // Try to find the data in the row using the label as the header
                            const value = row[col.label];
                            if (value !== undefined) {
                                item[col.key] = value;
                            }
                        });

                        return item;
                    });
                    resolve(mappedData);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }
}
