'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { envURL } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Clock, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  name: string;
  email: string;
  text: string;
  status: 'pending' | 'taken';
  createdAt: string;
}

export default function ViewFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'taken'>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        let url = `${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/api/feedback?page=${page}&pageSize=${PAGE_SIZE}`;
        if (filter !== 'all') {
          url += `&status=${filter}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch feedbacks');
        const data = await res.json();
        setFeedbacks(data.data || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
        setError('Failed to load feedbacks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    fetchFeedbacks();
  }, [filter, page, PAGE_SIZE]);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    toast('ID copied to clipboard', {
      description: id,
      duration: 3000,
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className='w-full max-w-5xl my-8 container mx-auto'>
      <div className='flex items-center justify-between mb-6 mx-8'>
        <Link href='/feedback'>
          <Button variant='outline' className='flex items-center gap-2'>
            <ArrowLeft size={16} />
            Back to Feedback Form
          </Button>
        </Link>
      </div>

      <div className='flex gap-2 mb-4 mx-8'>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => {
            setFilter('pending');
            setPage(1);
          }}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'taken' ? 'default' : 'outline'}
          onClick={() => {
            setFilter('taken');
            setPage(1);
          }}
        >
          Taken
        </Button>
      </div>

      <Card className='shadow-md mx-8'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>All Feedbacks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className='mb-4 p-4 border rounded-lg'>
                <div className='flex justify-between items-start mb-3'>
                  <Skeleton className='h-6 w-32' />
                  <Skeleton className='h-6 w-24' />
                </div>
                <Skeleton className='h-4 w-full mb-2' />
                <Skeleton className='h-4 w-3/4 mb-4' />
                <Skeleton className='h-16 w-full mb-2' />
                <div className='flex justify-end'>
                  <Skeleton className='h-9 w-24' />
                </div>
              </div>
            ))
          ) : error ? (
            <div className='text-center py-8'>
              <p className='text-red-500'>{error}</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>No feedbacks found.</p>
            </div>
          ) : (
            feedbacks.map(feedback => (
              <div key={feedback.id} className='mb-4 p-4 shadow-md border rounded-lg'>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <p className='font-medium'>
                      <b>Name:</b> {feedback.name}
                    </p>
                    <p className='font-medium'>
                      <b>Email:</b>{' '}
                      <a href={`mailto:${feedback.email}`} className='hover:underline'>
                        {feedback.email}
                      </a>
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Created: {new Date(feedback.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className='flex flex-col items-end'>
                    <Badge
                      variant={feedback.status === 'pending' ? 'outline' : 'default'}
                      className={
                        feedback.status === 'pending'
                          ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
                      }
                    >
                      {feedback.status === 'pending' ? (
                        <span className='flex items-center gap-1'>
                          <Clock size={14} />
                          Pending
                        </span>
                      ) : (
                        <span className='flex items-center gap-1'>
                          <CheckCircle size={14} />
                          Taken
                        </span>
                      )}
                    </Badge>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => copyToClipboard(feedback.id)}
                      className='flex items-center gap-1 mt-2'
                    >
                      <Copy size={14} />
                      Copy ID
                    </Button>
                  </div>
                </div>
                <div className='bg-gray-50 shadow shadow-primary dark:bg-gray-900 p-3 rounded-md mb-3 whitespace-pre-wrap'>
                  {feedback.text}
                </div>
              </div>
            ))
          )}
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className='flex justify-center items-center gap-4 mt-6'>
              <Button
                variant='outline'
                size='sm'
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className='flex items-center gap-1'
              >
                <ChevronLeft size={16} />
                Prev
              </Button>
              <span className='text-sm'>
                Page {page} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className='flex items-center gap-1'
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
