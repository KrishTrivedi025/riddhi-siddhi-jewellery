"use server"

import { getDashboardStats } from "./dashboard-stats"
import { getChartData } from "./chart-data"
import { getRecentTransactions } from "./transactions"

export async function getDashboardOverview() {
    try {
        // Run sequentially to respect the connection limit of 1
        const stats = await getDashboardStats()
        const charts = await getChartData()
        const transactions = await getRecentTransactions()

        return {
            stats: stats || {},
            charts: charts || { monthlyData: [], donutData: [], topCustomers: [] },
            transactions: transactions || [],
            success: true
        }
    } catch (error) {
        console.error("Dashboard Master Action Error:", error)
        return {
            stats: {},
            charts: { monthlyData: [], donutData: [], topCustomers: [] },
            transactions: [],
            success: false,
            error: "Failed to load dashboard data"
        }
    }
}
