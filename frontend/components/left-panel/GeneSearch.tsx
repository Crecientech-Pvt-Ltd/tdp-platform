'use client';

import type React from 'react';
import { createRef, useEffect, useState } from 'react';
import { useStore } from '@/lib/hooks';
import { Events, eventEmitter } from '@/lib/utils';
import { Textarea } from '../ui/textarea';

export function GeneSearch() {
  const nodeSearchQuery = useStore(state => state.nodeSearchQuery);
  const suggestions = useStore(state => state.nodeSuggestions);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = createRef<HTMLTextAreaElement>();
  const { geneIDs } = useStore(state => state.graphConfig) ?? { geneIDs: [] };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      appendSuggestion(suggestions[selectedIndex]);
    }
  };

  const appendSuggestion = (suggestion: string) => {
    const words = nodeSearchQuery.split(/[\n,]/);
    words.pop();
    words.push(suggestion);
    useStore.setState({ nodeSearchQuery: `${words.join(', ')}, ` });
    useStore.setState({ nodeSuggestions: [] });
    textareaRef.current?.focus();
    setSelectedIndex(-1);
  };

  useEffect(() => {
    let previousGenes = ''; // ✅ Local variable to track previous genes
    const handleSeedGenesToggle = (enabled: boolean) => {
      useStore.setState(state => {
        if (enabled) {
          previousGenes = state.nodeSearchQuery; // ✅ Store existing input before updating
          return {
            ...state,
            nodeSearchQuery: state.nodeSearchQuery || geneIDs.join('\n'), // ✅ Show existing or default genes
          };
        }
        return {
          ...state,
          nodeSearchQuery: previousGenes, // ✅ Restore previous input
        };
      });
    };
    eventEmitter.on(Events.TOGGLE_SEED_GENES, handleSeedGenesToggle);
    return () => {
      eventEmitter.off(Events.TOGGLE_SEED_GENES, handleSeedGenesToggle);
    };
  }, [geneIDs]); // ✅ Dependency ensures latest values

  useEffect(() => {
    if (!nodeSearchQuery || nodeSearchQuery.split(/[\n,]/).pop()?.trim().length === 0) {
      useStore.setState({ nodeSuggestions: [] });
    }
  }, [nodeSearchQuery]);

  return (
    <div>
      <div className='relative w-full'>
        {suggestions.length > 0 && (
          <ul className='absolute z-10 mt-0.5 max-h-32 w-full overflow-auto rounded-md border border-gray-300 bg-white text-xs shadow-sm'>
            {suggestions.map((suggestion, index) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: Not possible to use key events with click events
              <li
                key={suggestion}
                className={`cursor-pointer px-2 py-1 hover:bg-gray-100 ${index === selectedIndex ? 'bg-gray-100' : ''}`}
                onClick={() => appendSuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        <Textarea
          ref={textareaRef}
          placeholder='Search Genes...'
          className='min-h-20 bg-white text-xs'
          value={nodeSearchQuery}
          onChange={e => useStore.setState({ nodeSearchQuery: e.target.value })}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
