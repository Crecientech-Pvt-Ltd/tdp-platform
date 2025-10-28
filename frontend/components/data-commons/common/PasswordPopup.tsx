'use client';

import { AlertCircle, Eye, EyeOff, Lock, X } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface PasswordPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedGroup: string;
  selectedProgram: string;
  selectedProject: string;
}

export default function PasswordPopup({
  isOpen,
  onClose,
  onSuccess,
  selectedGroup,
  selectedProgram,
  selectedProject,
}: PasswordPopupProps) {
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/password`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        },
      );

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Incorrect password');
      }
    } catch (err) {
      console.error('Password check failed:', err);
      setError('Failed to verify password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const passwordId = React.useId();

  return (
    <Dialog open={isOpen}>
      <DialogContent className='w-[90vw] max-w-md'>
        <DialogTitle className='flex items-center gap-2 font-semibold text-lg'>
          <Lock className='size-5' />
          Project Access Required
        </DialogTitle>

        <div className='space-y-4'>
          <div className='text-muted-foreground text-sm'>
            This project is password protected. Please enter the password to access the data analysis tools.
          </div>

          {error && (
            <div className='flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/15 p-3 text-destructive text-sm'>
              <AlertCircle className='size-4 shrink-0' />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <Label htmlFor={passwordId}>Password</Label>
              <div className='relative'>
                <Input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Enter project password'
                  disabled={loading}
                  className='mt-1 pr-10'
                  autoFocus
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='absolute top-1 right-0 size-8 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className='size-4 text-muted-foreground' />
                  ) : (
                    <Eye className='size-4 text-muted-foreground' />
                  )}
                  <span className='sr-only'>{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className='flex-col gap-2 sm:flex-row'>
          <Button variant='outline' onClick={onClose} disabled={loading} className='flex items-center gap-2'>
            <X className='size-4' />
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={loading || !password.trim()}
            className='flex items-center gap-2 bg-primary text-white hover:bg-primary/90'
          >
            {loading ? (
              <>
                <Spinner className='size-4' />
                Verifying...
              </>
            ) : (
              <>
                <Lock className='size-4' />
                Access Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
