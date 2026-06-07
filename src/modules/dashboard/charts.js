/**
 * Dashboard Charts (T-33) - Chart.js integration
 * Bar chart: pendapatan per bulan (last 6 months)
 * Donut chart: distribusi status jamaats
 * Line chart: tren pendaftaran per bulan
 */
import { Chart, registerables } from 'chart.js'
import { formatRupiah, formatDate } from '../../utils/helpers.js'

// Register Chart.js components
Chart.register(...registerables)

// Islamic green and gold palette
const COLORS = {
  primary: '#0D7C66',
  primaryLight: '#0D7C6640',
  gold: '#D4AF37',
  goldLight: '#D4AF3740',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#EAB308',
  blue: '#3B82F6',
  gray: '#6B7280'
}

export default class DashboardCharts {
  constructor() {
    this.barChart = null
    this.donutChart = null
    this.lineChart = null
  }

  renderCharts(data) {
    this.renderBarChart(data.transaksis || [])
    this.renderDonutChart(data.jamaat || [])
    this.renderLineChart(data.jamaat || [])
  }

  renderBarChart(transaksis) {
    const container = document.getElementById('chart-container')
    if (!container) return

    // Aggregate pendapatan per bulan (last 6 months)
    const monthlyData = this.getMonthlyPendapatan(transaksis)
    
    if (this.barChart) {
      this.barChart.destroy()
    }

    this.barChart = new Chart(container, {
      type: 'bar',
      data: {
        labels: monthlyData.labels,
        datasets: [{
          label: 'Pendapatan',
          data: monthlyData.values,
          backgroundColor: COLORS.primary,
          borderColor: COLORS.primary,
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx) => formatRupiah(ctx.raw)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(0) + 'jt'
                if (value >= 1000) return 'Rp ' + (value / 1000).toFixed(0) + 'rb'
                return 'Rp ' + value
              }
            },
            grid: {
              color: '#E5E7EB'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  getMonthlyPendapatan(transaksis) {
    const months = []
    const values = []
    const now = new Date()

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = d.toISOString().slice(0, 7)
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      
      const total = transaksis
        .filter(t => t.tanggal?.startsWith(monthKey) && t.status === 'lunas')
        .reduce((sum, t) => sum + (t.nominal || 0), 0)

      months.push(monthLabel)
      values.push(total)
    }

    return { labels: months, values }
  }

  renderDonutChart(jamaahs) {
    const container = document.getElementById('status-chart')
    if (!container) return

    // Count by status
    const statusCounts = {
      pending: 0,
      aktif: 0,
      cicilan: 0,
      lunas: 0,
      berangkat: 0
    }

    jamaahs.filter(j => !j.deletedAt).forEach(j => {
      const status = j.status?.toLowerCase() || 'pending'
      if (status in statusCounts) {
        statusCounts[status]++
      } else {
        statusCounts.pending++
      }
    })

    const statusLabels = {
      pending: 'Pending',
      aktif: 'Aktif',
      cicilan: 'Cicilan',
      lunas: 'Lunas',
      berangkat: 'Berangkat'
    }

    const statusColors = {
      pending: COLORS.yellow,
      aktif: COLORS.blue,
      cicilan: COLORS.primary,
      lunas: COLORS.green,
      berangkat: COLORS.gold
    }

    if (this.donutChart) {
      this.donutChart.destroy()
    }

    this.donutChart = new Chart(container, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts).map(k => statusLabels[k]),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: Object.keys(statusCounts).map(k => statusColors[k]),
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} jamaat`
            }
          }
        }
      }
    })
  }

  renderLineChart(jamaahs) {
    const containerId = 'line-chart-container'
    let container = document.getElementById(containerId)
    
    // Create container if not exists
    if (!container) {
      const chartSection = document.querySelector('#chart-container')?.parentElement
      if (chartSection) {
        container = document.createElement('div')
        container.id = containerId
        container.className = 'mt-4'
        container.style.height = '200px'
        chartSection.appendChild(container)
      }
    }

    if (!container) return

    // Aggregate pendaftaran per bulan
    const monthlyData = this.getMonthlyPendaftaran(jamaahs)

    if (this.lineChart) {
      this.lineChart.destroy()
    }

    this.lineChart = new Chart(container, {
      type: 'line',
      data: {
        labels: monthlyData.labels,
        datasets: [{
          label: 'Pendaftaran',
          data: monthlyData.values,
          borderColor: COLORS.gold,
          backgroundColor: COLORS.goldLight,
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: COLORS.gold
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.raw} pendaftaran`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: '#E5E7EB'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  getMonthlyPendaftaran(jamaahs) {
    const months = []
    const values = []
    const now = new Date()

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = d.toISOString().slice(0, 7)
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      
      const count = jamaahs.filter(j => {
        if (j.deletedAt) return false
        return j.tanggalDaftar?.startsWith(monthKey)
      }).length

      months.push(monthLabel)
      values.push(count)
    }

    return { labels: months, values }
  }

  destroy() {
    if (this.barChart) this.barChart.destroy()
    if (this.donutChart) this.donutChart.destroy()
    if (this.lineChart) this.lineChart.destroy()
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.DashboardCharts = new DashboardCharts()
})
