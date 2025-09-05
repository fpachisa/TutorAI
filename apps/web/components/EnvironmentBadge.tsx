'use client';

import React from 'react';
import { clsx } from 'clsx';

interface EnvironmentBadgeProps {
  environment?: string;
  gitSha?: string;
  className?: string;
}

const EnvironmentBadge: React.FC<EnvironmentBadgeProps> = ({ 
  environment = process.env.NEXT_PUBLIC_ENV || 'development',
  gitSha = process.env.GIT_SHA || 'dev-build',
  className
}) => {
  const getBadgeClasses = (env: string) => {
    switch (env.toLowerCase()) {
      case 'production':
        return 'badge-production';
      case 'staging':
        return 'badge-staging';
      default:
        return 'badge-development';
    }
  };

  return (
    <div className={clsx('flex items-center space-x-2', className)}>
      <span className={getBadgeClasses(environment)}>
        {environment.toUpperCase()}
      </span>
      <span className="badge badge-development">
        {gitSha.substring(0, 7)}
      </span>
    </div>
  );
};

export default EnvironmentBadge;