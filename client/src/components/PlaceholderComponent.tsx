import React from 'react';
import { MessageSquare } from 'lucide-react';

interface PlaceholderComponentProps {
  name?: string;
  [key: string]: any;
}

export function PlaceholderComponent({ name = 'Component', ...props }: PlaceholderComponentProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-neutral-900 text-neutral-400">
      <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center">
        <div className="bg-neutral-800 p-4 rounded-full mb-4">
          <MessageSquare size={32} className="text-blue-400" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">{name}</h3>
        <p className="mb-4">
          This is a placeholder for the {name} component. The actual component will be implemented in the future.
        </p>
        {Object.keys(props).length > 0 && (
          <div className="w-full mt-4 p-4 bg-neutral-800 rounded-md text-left overflow-auto max-h-48">
            <p className="text-sm mb-2 text-neutral-300">Component props:</p>
            <pre className="text-xs text-neutral-400 whitespace-pre-wrap">
              {JSON.stringify(props, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaceholderComponent;