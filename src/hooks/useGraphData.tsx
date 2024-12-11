import { useMemo } from 'react';
import { getColorForName } from '../utils/colors';
import { DataPoint, FetchDayData, GraphScaling } from '@/types/types';

export function useGraphData(
    data: FetchDayData,
    avgData: FetchDayData,
    graphScaling: GraphScaling,
    selectedGraph: number[],
    showAverageData: boolean
) {
    const filterData = (data: FetchDayData): FetchDayData => {
        // Clone the data to avoid mutating the original
        const filteredData: FetchDayData = {
            scaling: data.scaling,
            data: data.data,
        };

        if (selectedGraph.length > 0) {
            // Filter the scaling array to include only the selected graphs
            filteredData.scaling = data.scaling.filter((scale) => selectedGraph.includes(Number(scale.name)));

            // Map over data.data to keep only the selected graphs
            filteredData.data = data.data.map((item) => {
                let newItem: DataPoint = { label: item.label };

                selectedGraph.forEach((index) => {
                    const key = String(index);
                    if (item.hasOwnProperty(key)) {
                        newItem[key] = item[key];
                    }
                });

                return newItem;
            });
        }

        // Apply scaling options
        switch (graphScaling) {
            case GraphScaling.TenMinutes:
                return filteredData;
            case GraphScaling.Hourly:
                return {
                    scaling: filteredData.scaling,
                    data: filteredData.data.filter((item) => item.label.endsWith('00')),
                };
            case GraphScaling.LastSixHours:
                const lastDataIndex = filteredData.data.map((item) => Object.keys(item).length > 1).lastIndexOf(true);
                const startIndex = Math.max(0, lastDataIndex - 35);
                return {
                    scaling: filteredData.scaling,
                    data: filteredData.data.slice(startIndex, lastDataIndex + 1),
                };
            case GraphScaling.LastThreeHours:
                const lastDataIndexThreeHours = filteredData.data
                    .map((item) => Object.keys(item).length > 1)
                    .lastIndexOf(true);
                const startIndexThreeHours = Math.max(0, lastDataIndexThreeHours - 17);
                return {
                    scaling: filteredData.scaling,
                    data: filteredData.data.slice(startIndexThreeHours, lastDataIndexThreeHours + 1),
                };
            default:
                return filteredData;
        }
    };

    // Merge data
    const mergeData = (originalData: FetchDayData, averageData: FetchDayData): FetchDayData => {
        const mergedData: FetchDayData = {
            scaling: [...originalData.scaling],
            data: [...originalData.data],
        };

        if (showAverageData) {
            const adjustedAvgData: FetchDayData = {
                scaling: [],
                data: [],
            };

            adjustedAvgData.scaling = averageData.scaling.map((scale) => ({
                name: `avg_${scale.name}`,
                label: `${scale.label} (Avg)`,
            }));

            adjustedAvgData.data = averageData.data.map((item) => {
                let newItem: DataPoint = { label: item.label };
                Object.keys(item).forEach((key) => {
                    if (key !== 'label') {
                        newItem[`avg_${key}`] = item[key];
                    } else {
                        newItem.label = item.label;
                    }
                });
                return newItem;
            });

            mergedData.scaling = [...mergedData.scaling, ...adjustedAvgData.scaling];
            mergedData.data = mergedData.data.map((item, index) => {
                const avgItem = adjustedAvgData.data[index];
                return { ...item, ...avgItem };
            });
        }

        return mergedData;
    };

    const filteredData = filterData(data);
    const filteredAvgData = filterData(avgData);
    const mergedData = mergeData(filteredData, filteredAvgData);

    // Generate the series array
    const series = mergedData.scaling.map((scale) => ({
        ...scale,
        label: scale.label.replace('Ausleihzentrum ', '').replace('Bibliotheks­bereich ', ''),
        color: getColorForName(scale.name),
        strokeWidth: scale.name.startsWith('avg_') ? 2 : 4,
        strokeDasharray: scale.name.startsWith('avg_') ? '4 4' : undefined,
    }));

    return { filteredData, filteredAvgData, mergedData, series };
}
