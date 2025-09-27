import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, Users, PieChart, Filter } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdminReports: React.FC = () => {
  const { contributions, expenses, users, loading } = useData();
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [reportType, setReportType] = useState('overview');

  // Generate past 5 years for dropdown
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, []);

  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i.toString(),
      label: new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })
    }));
  }, []);

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    let filteredContributions = contributions;
    let filteredExpenses = expenses;

    // Filter by year
    if (selectedYear !== 'all') {
      filteredContributions = contributions.filter(c => 
        new Date(c.date).getFullYear().toString() === selectedYear
      );
      filteredExpenses = expenses.filter(e => 
        new Date(e.date).getFullYear().toString() === selectedYear
      );
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      filteredContributions = filteredContributions.filter(c => 
        new Date(c.date).getMonth().toString() === selectedMonth
      );
      filteredExpenses = filteredExpenses.filter(e => 
        new Date(e.date).getMonth().toString() === selectedMonth
      );
    }

    return { filteredContributions, filteredExpenses };
  }, [contributions, expenses, selectedYear, selectedMonth]);

  // Calculate report data based on report type and filters
  const reportData = useMemo(() => {
    const { filteredContributions, filteredExpenses } = filteredData;

    // Overview metrics
    const totalContributions = filteredContributions.reduce((sum, c) => sum + c.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalContributions - totalExpenses;
    const contributorCount = new Set(filteredContributions.map(c => c.user_id)).size;
    const expenseCount = filteredExpenses.length;
    const avgContribution = contributorCount > 0 ? totalContributions / contributorCount : 0;

    // Monthly trends (always show 12 months for the selected year)
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const monthName = new Date(2024, index).toLocaleDateString('en-US', { month: 'short' });
      
      const yearToUse = selectedYear === 'all' ? new Date().getFullYear() : parseInt(selectedYear);
      
      const monthContributions = contributions
        .filter(c => {
          const date = new Date(c.date);
          return date.getMonth() === index && 
                 (selectedYear === 'all' || date.getFullYear() === yearToUse);
        })
        .reduce((sum, c) => sum + c.amount, 0);
      
      const monthExpenses = expenses
        .filter(e => {
          const date = new Date(e.date);
          return date.getMonth() === index && 
                 (selectedYear === 'all' || date.getFullYear() === yearToUse);
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month: monthName,
        contributions: monthContributions,
        expenses: monthExpenses
      };
    });

    // Expense categories
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top contributors
    const contributorTotals = filteredContributions.reduce((acc, contribution) => {
      const userId = contribution.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          amount: 0,
          contributions: 0,
          user: contribution.user
        };
      }
      acc[userId].amount += contribution.amount;
      acc[userId].contributions += 1;
      return acc;
    }, {} as Record<string, { amount: number; contributions: number; user?: any }>);

    const topContributors = Object.values(contributorTotals)
      .map(data => ({
        name: data.user?.full_name || 'Unknown User',
        amount: data.amount,
        contributions: data.contributions
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      overview: {
        totalContributions,
        totalExpenses,
        netBalance,
        contributorCount,
        expenseCount,
        avgContribution
      },
      monthly: monthlyData,
      categories,
      topContributors,
      contributions: filteredContributions,
      expenses: filteredExpenses
    };
  }, [filteredData, contributions, expenses, selectedYear]);

  // Export to PDF with proper autoTable usage
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Generate timestamp for filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    // Title
    doc.setFontSize(20);
    doc.text('Alumni Network Financial Report', pageWidth / 2, 20, { align: 'center' });
    
    // Period info
    doc.setFontSize(12);
    const periodText = `Period: ${selectedYear === 'all' ? 'All Time' : selectedYear}${selectedMonth !== 'all' ? ` - ${availableMonths[parseInt(selectedMonth)].label}` : ''}`;
    doc.text(periodText, pageWidth / 2, 30, { align: 'center' });
    
    // Report type
    doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, pageWidth / 2, 40, { align: 'center' });
    
    let yPosition = 50;

    // Financial Overview
    doc.setFontSize(14);
    doc.text('Financial Overview', 20, yPosition);
    yPosition += 10;

    const overviewData = [
      ['Total Contributions', `$${reportData.overview.totalContributions.toLocaleString()}`],
      ['Total Expenses', `$${reportData.overview.totalExpenses.toLocaleString()}`],
      ['Net Balance', `$${reportData.overview.netBalance.toLocaleString()}`],
      ['Contributors', reportData.overview.contributorCount.toString()],
      ['Average Contribution', `$${reportData.overview.avgContribution.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Top Contributors
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Top Contributors', 20, yPosition);
    yPosition += 10;

    const contributorsData = reportData.topContributors.map((contributor, index) => [
      (index + 1).toString(),
      contributor.name,
      `$${contributor.amount.toLocaleString()}`,
      contributor.contributions.toString(),
      `$${Math.round(contributor.amount / contributor.contributions).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Rank', 'Name', 'Total Amount', 'Contributions', 'Average']],
      body: contributorsData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Expense Categories
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Expense Categories', 20, yPosition);
    yPosition += 10;

    const categoriesData = reportData.categories.map(category => [
      category.category,
      `$${category.amount.toLocaleString()}`,
      `${category.percentage.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Amount', 'Percentage']],
      body: categoriesData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }
    });

    // Save the PDF with timestamp
    const fileName = `Finance_Report_${timestamp}.pdf`;
    doc.save(fileName);
  };

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    // Overview sheet
    const overviewData = [
      ['Metric', 'Value'],
      ['Total Contributions', reportData.overview.totalContributions],
      ['Total Expenses', reportData.overview.totalExpenses],
      ['Net Balance', reportData.overview.netBalance],
      ['Contributors', reportData.overview.contributorCount],
      ['Average Contribution', reportData.overview.avgContribution]
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

    // Contributions sheet
    if (reportType === 'overview' || reportType === 'contributions') {
      const contributionsData = [
        ['Date', 'Contributor', 'Amount', 'Notes', 'Tags'],
        ...reportData.contributions.map(c => [
          c.date,
          c.user?.full_name || 'Unknown',
          c.amount,
          c.notes || '',
          c.tags || ''
        ])
      ];
      const contributionsSheet = XLSX.utils.aoa_to_sheet(contributionsData);
      XLSX.utils.book_append_sheet(workbook, contributionsSheet, 'Contributions');
    }

    // Expenses sheet
    if (reportType === 'overview' || reportType === 'expenses') {
      const expensesData = [
        ['Date', 'Purpose', 'Amount', 'Category', 'Description'],
        ...reportData.expenses.map(e => [
          e.date,
          e.purpose,
          e.amount,
          e.category || '',
          e.description || ''
        ])
      ];
      const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
    }

    // Monthly trends sheet
    if (reportType === 'overview' || reportType === 'trends') {
      const monthlyData = [
        ['Month', 'Contributions', 'Expenses', 'Net'],
        ...reportData.monthly.map(m => [
          m.month,
          m.contributions,
          m.expenses,
          m.contributions - m.expenses
        ])
      ];
      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Trends');
    }

    // Save the Excel file with timestamp
    const fileName = `Finance_Report_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive financial reports and insights</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Months</option>
              {availableMonths.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="contributions">Contributions Focus</option>
              <option value="expenses">Expenses Focus</option>
              <option value="trends">Trends Analysis</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selectedYear === 'all' ? 'All Time' : selectedYear}
              {selectedMonth !== 'all' && ` - ${availableMonths[parseInt(selectedMonth)].label}`}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">Total Contributions</p>
              <p className="text-2xl font-bold text-emerald-900">
                ${reportData.overview.totalContributions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">
                ${reportData.overview.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Net Balance</p>
              <p className="text-2xl font-bold text-blue-900">
                ${reportData.overview.netBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-700">Contributors</p>
              <p className="text-2xl font-bold text-purple-900">
                {reportData.overview.contributorCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on Report Type */}
      {(reportType === 'overview' || reportType === 'trends') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Trends {selectedYear !== 'all' && `(${selectedYear})`}
            </h3>
            {reportData.monthly.some(m => m.contributions > 0 || m.expenses > 0) ? (
              <div className="space-y-4">
                {reportData.monthly.map((month, index) => {
                  const maxAmount = Math.max(
                    ...reportData.monthly.map(m => Math.max(m.contributions, m.expenses))
                  );
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 w-12">{month.month}</span>
                      <div className="flex-1 mx-4">
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: maxAmount > 0 ? `${(month.contributions / maxAmount) * 100}%` : '0%' }}
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: maxAmount > 0 ? `${(month.expenses / maxAmount) * 100}%` : '0%' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-emerald-600">
                          +${month.contributions.toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-red-600">
                          -${month.expenses.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                <p className="mt-1 text-sm text-gray-500">No financial activity for the selected period</p>
              </div>
            )}
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600">Contributions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Expenses</span>
              </div>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
            {reportData.categories.length > 0 ? (
              <div className="space-y-4">
                {reportData.categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-emerald-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${category.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No expense categories</h3>
                <p className="mt-1 text-sm text-gray-500">No expenses recorded for the selected period</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Contributors */}
      {(reportType === 'overview' || reportType === 'contributions') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
          {reportData.topContributors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contributions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.topContributors.map((contributor, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-600 text-sm font-semibold">
                              {contributor.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{contributor.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-600">
                          ${contributor.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {contributor.contributions}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ${Math.round(contributor.amount / contributor.contributions).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contributors</h3>
              <p className="mt-1 text-sm text-gray-500">No contributions recorded for the selected period</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Tables for Specific Report Types */}
      {reportType === 'contributions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Contributions</h3>
          {reportData.contributions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contributor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.contributions.map((contribution) => (
                    <tr key={contribution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(contribution.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {contribution.user?.full_name || 'Unknown User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-600">
                          ${contribution.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {contribution.notes || 'No notes'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contributions</h3>
              <p className="mt-1 text-sm text-gray-500">No contributions recorded for the selected period</p>
            </div>
          )}
        </div>
      )}

      {reportType === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Expenses</h3>
          {reportData.expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Purpose</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{expense.purpose}</span>
                        {expense.description && (
                          <p className="text-sm text-gray-500 mt-1">{expense.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-red-600">
                          ${expense.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {expense.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {expense.category}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
              <p className="mt-1 text-sm text-gray-500">No expenses recorded for the selected period</p>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">
              ${reportData.overview.avgContribution.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Average Contribution</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {reportData.overview.totalContributions > 0 
                ? Math.round((reportData.overview.netBalance / reportData.overview.totalContributions) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600">Funds Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${reportData.overview.expenseCount > 0 
                ? Math.round(reportData.overview.totalExpenses / reportData.overview.expenseCount).toLocaleString()
                : '0'}
            </p>
            <p className="text-sm text-gray-600">Average Expense</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;