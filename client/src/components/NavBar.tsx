import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from './ui/button';
import { Mail, PanelLeftOpen, PanelRightOpen, LayoutGrid, Link2 } from 'lucide-react';

export const NavBar: React.FC = () => {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Flexible Email', icon: <Mail className="h-4 w-4 mr-1.5" /> },
    { path: '/simple', label: 'Simple Layout', icon: <PanelLeftOpen className="h-4 w-4 mr-1.5" /> },
    { path: '/tabbed', label: 'Tabbed Layout', icon: <PanelRightOpen className="h-4 w-4 mr-1.5" /> },
    { path: '/advanced', label: 'Advanced Layout', icon: <LayoutGrid className="h-4 w-4 mr-1.5" /> },
    { path: '/dependency-demo', label: 'Dependency Demo', icon: <Link2 className="h-4 w-4 mr-1.5" /> },
    { path: '/dependency-system', label: 'Email Dependencies', icon: <Link2 className="h-4 w-4 mr-1.5" /> },
  ];

  return (
    <div className="bg-background border-b flex justify-center py-2 px-4 sticky top-0 z-10">
      <div className="flex space-x-1">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <Button 
              variant={location === item.path ? "secondary" : "ghost"} 
              size="sm"
              className="text-xs"
            >
              {item.icon}
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NavBar;