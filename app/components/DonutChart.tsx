import React from 'react'

interface ChartData {
    label: string
    value: number
    color: string
}

interface DonutChartProps {
    data: ChartData[]
    size?: number
    thickness?: number
    totalLabel?: string
    totalValue?: string | number // Optional override for center text
}

export default function DonutChart({ data, size = 160, thickness = 20, totalLabel = 'Total', totalValue }: DonutChartProps) {
    const radius = (size - thickness) / 2
    const circumference = 2 * Math.PI * radius

    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    // Guard for empty data
    if (total === 0) {
        return (
            <div className="relative flex items-center justify-center font-bold text-gray-300 bg-gray-50 rounded-full" style={{ width: size, height: size }}>
                No Data
            </div>
        )
    }

    let cumulativePercent = 0

    return (
        <div className="relative inline-flex flex-col items-center">
            <div className="relative">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    {data.map((item, i) => {
                        const percent = item.value / total
                        const dashArray = `${percent * circumference} ${circumference}`
                        const offset = -(cumulativePercent * circumference)

                        cumulativePercent += percent

                        return (
                            <circle
                                key={i}
                                r={radius}
                                cx={size / 2}
                                cy={size / 2}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={thickness}
                                strokeDasharray={dashArray}
                                strokeDashoffset={offset}
                                className="transition-all duration-500 hover:opacity-80"
                            >
                                <title>{`${item.label}: ${item.value} (${(percent * 100).toFixed(1)}%)`}</title>
                            </circle>
                        )
                    })}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-gray-400 text-xs font-bold uppercase">{totalLabel}</span>
                    <span className="text-lg font-bold text-gray-800">
                        {totalValue !== undefined ? totalValue : total.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-600 truncate max-w-[100px]" title={item.label}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
