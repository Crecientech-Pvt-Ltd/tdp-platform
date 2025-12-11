'use client';
import { ArrowLeftIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { envURL } from '@/lib/utils';

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
  }, [filter, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className='container mx-auto my-8 w-full max-w-5xl'>
      <div className='mx-8 mb-6 flex items-center justify-between'>
        <Link href='/feedback'>
          <Button variant='outline' className='flex items-center gap-2'>
            <ArrowLeftIcon size={16} />
            Back to Feedback Form
          </Button>
        </Link>
      </div>

      <div className='mx-8 mb-4 flex gap-2'>
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

      <Card className='mx-8 shadow-md'>
        <CardHeader>
          <CardTitle className='font-bold text-2xl'>All Feedbacks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: had to use for skeleton
              <div key={index} className='mb-4 rounded-lg border p-4'>
                <div className='mb-3 flex items-start justify-between'>
                  <Skeleton className='h-6 w-32' />
                  <Skeleton className='h-6 w-24' />
                </div>
                <Skeleton className='mb-2 h-4 w-full' />
                <Skeleton className='mb-4 h-4 w-3/4' />
                <Skeleton className='mb-2 h-16 w-full' />
                <div className='flex justify-end'>
                  <Skeleton className='h-9 w-24' />
                </div>
              </div>
            ))
          ) : error ? (
            <div className='py-8 text-center'>
              <p className='text-red-500'>{error}</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-muted-foreground'>No feedbacks found.</p>
            </div>
          ) : (
            feedbacks.map(feedback => (
              <div key={feedback.id} className='mb-4 rounded-lg border p-4 shadow-md'>
                <div className='mb-3 flex items-start justify-between'>
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
                    <p className='text-muted-foreground text-xs'>
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
                          <ClockIcon size={14} />
                          Pending
                        </span>
                      ) : (
                        <span className='flex items-center gap-1'>
                          <CheckCircleIcon size={14} />
                          Taken
                        </span>
                      )}
                    </Badge>
                    <span className='mt-2 text-muted-foreground text-xs'>
                      <b>ID:</b> {feedback.id}
                    </span>
                  </div>
                </div>
                <div className='mb-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 shadow shadow-primary dark:bg-gray-900'>
                  {feedback.text}
                </div>
              </div>
            ))
          )}
          {totalPages > 1 && (
            <div className='mt-6 flex items-center justify-center gap-4'>
              <Button
                variant='outline'
                size='sm'
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className='flex items-center gap-1'
              >
                <ChevronLeftIcon size={16} />
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
                <ChevronRightIcon size={16} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
