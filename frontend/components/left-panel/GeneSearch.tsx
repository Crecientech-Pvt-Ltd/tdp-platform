'use client';

import { useStore } from '@/lib/hooks';
import { Events, eventEmitter } from '@/lib/utils';
import type React from 'react';
import { createRef, useEffect, useState } from 'react';
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
      {/* <div className='flex justify-between my-1'> */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      {/* <span
         className='text-xs underline cursor-pointer text-zinc-500'
         onClick={() => useStore.setState({ nodeSearchQuery: geneIDs.join('\n') })}
       >
         #Seed Genes
       </span> */}
      {/* <button
         type='button'
         className='inline-flex text-xs underline cursor-pointer text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed'
         disabled={nodeSearchQuery.length === 0}
         onClick={() => eventEmitter.emit(Events.EXPORT, { format: 'csv' })}
       >
         Export <SquareArrowOutUpRight size={10} className='mt-1 ml-0.5' />
       </button>
     </div> */}
      <div className='relative w-full'>
        {suggestions.length > 0 && (
          <ul className='absolute z-10 w-full mt-0.5 bg-white border border-gray-300 rounded-md shadow-sm max-h-32 overflow-auto text-xs'>
            {suggestions.map((suggestion, index) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
              <li
                key={suggestion}
                className={`px-2 py-1 cursor-pointer hover:bg-gray-100 ${index === selectedIndex ? 'bg-gray-100' : ''}`}
                onClick={() => appendSuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        <Textarea
          ref={textareaRef}
          id='nodeSearchQuery'
          placeholder='Search Genes...'
          className='min-h-20 text-xs bg-white'
          value={nodeSearchQuery}
          onChange={e => useStore.setState({ nodeSearchQuery: e.target.value })}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
