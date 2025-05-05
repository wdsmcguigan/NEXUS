import React from 'react';
import { DependencyProvider } from '../context/DependencyContext';
import EmailDependencyDemo from '../components/EmailDependencyDemo';

const EmailPage: React.FC = () => {
  return (
    <DependencyProvider>
      <EmailDependencyDemo />
    </DependencyProvider>
  );
};

export default EmailPage;