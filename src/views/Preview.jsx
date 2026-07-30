import React from 'react';
import { NavLink } from 'react-router-dom';

const features = [
  {
    path: '/dashboard',
    icon: '📊',
    title: 'Dashboard',
    description: 'Get a complete overview of your finances with account balances, net worth, and quick-add transaction forms.',
  },
  {
    path: '/transactions',
    icon: '💸',
    title: 'Transactions',
    description: 'Browse, filter, and manage all your financial transactions across journals with balance-validated postings.',
  },
  {
    path: '/accounts',
    icon: '🏦',
    description: 'Organize your finances with hierarchical accounts spanning assets, liabilities, income, expenses, and equity.',
    title: 'Accounts',
  },
  {
    path: '/journals',
    icon: '📒',
    title: 'Journals',
    description: 'Switch between and manage multiple hledger journal files with retention, diff, and duplication controls.',
  },
];

function Preview() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            hledger Finance App
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            A clean, modern interface for managing your finances with hledger. Track transactions,
            manage accounts, and gain financial clarity.
          </p>
          <div className="mt-8">
            <NavLink
              to="/dashboard"
              className="inline-flex items-center rounded-lg bg-primary-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 transition-colors"
            >
              Get Started
            </NavLink>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <NavLink
              key={feature.path}
              to={feature.path}
              className="group flex flex-col rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all"
            >
              <span className="text-3xl mb-4">{feature.icon}</span>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                {feature.description}
              </p>
              <span className="mt-4 text-sm font-medium text-primary-700 group-hover:underline">
                Explore &rarr;
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Preview;
