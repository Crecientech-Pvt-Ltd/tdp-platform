import { useEffect, useState } from 'react';
import { FileSource } from './useDataFiles';

export const useFileData = (fileSource: FileSource | null) => {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileSource) {
      setData('');
      setLoading(false);
      setError(null);
      return;
    }

    if (fileSource.content) {
      setData(fileSource.content);
      setLoading(false);
      setError(null);
      return;
    }

    if (fileSource.url) {
      setLoading(true);
      setError(null);

      fetch(fileSource.url)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${fileSource.filename || 'file'}`);
          return res.text();
        })
        .then(text => {
          setData(text);
          setError(null);
        })
        .catch(err => {
          setError(err.message);
          setData('');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [fileSource]);

  return { data, loading, error };
};
