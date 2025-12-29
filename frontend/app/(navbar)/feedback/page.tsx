'use client';
import { CheckCircleIcon, CircleXIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn, envURL } from '@/lib/utils';

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback: '',
  });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    feedback: false,
  });
  const [submitted, setSubmitted] = useState<boolean | 'failed'>(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (value) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = {
      name: !formData.name,
      email: !formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      feedback: !formData.feedback,
    };
    setErrors(newErrors);
    if (!newErrors.name && !newErrors.email && !newErrors.feedback) {
      setLoading(true);
      try {
        const res = await fetch(`${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to submit feedback');
        setFormData({ name: '', email: '', feedback: '' });
        setLoading(false);
        setSubmitted(true);
      } catch (error) {
        console.error('Error:', error);
        toast('Message failed to send', {
          cancel: { label: 'Close', onClick() {} },
          description: 'Please try again later',
          icon: <CircleXIcon color='red' size={16} />,
        });
        setFormData({ name: '', email: '', feedback: '' });
        setLoading(false);
        setSubmitted('failed');
      }
    }
  };

  const nameId = useId();
  const emailId = useId();
  const feedbackId = useId();

  return (
    <div className='mx-auto my-8 w-full max-w-5xl'>
      <div className='mb-4 flex justify-end'>
        <Link href='/view-feedback'>
          <Button variant='outline' className='font-medium'>
            View All Feedbacks
          </Button>
        </Link>
      </div>
      <Card className='grid border py-0 md:grid-cols-2'>
        <div className='py-6'>
          <CardHeader>
            <CardTitle className='text-lg'>Please Share Your Feedback</CardTitle>
            <CardDescription>
              We value your input! Please let us know your thoughts, suggestions, or any issues you've encountered while
              using our tool.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              submitted !== 'failed' ? (
                <div className='flex flex-col items-center justify-center space-y-4 py-6 text-center'>
                  <div className='rounded-full bg-teal-100 p-3 dark:bg-teal-900/30'>
                    <CheckCircleIcon className='size-8 text-teal-600 dark:text-teal-400' />
                  </div>
                  <h3 className='font-medium text-xl'>Thank You!</h3>
                  <p className='text-muted-foreground'>Your feedback has been submitted successfully.</p>
                  <Button
                    variant='outline'
                    className='mt-4 border text-teal-700 hover:bg-teal-50 hover:text-gray-600 dark:text-teal-300 dark:hover:bg-teal-900/20'
                    onClick={() => setSubmitted(false)}
                  >
                    Submit Another Response
                  </Button>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center space-y-4 py-6 text-center'>
                  <div className='rounded-full bg-red-100 p-3 dark:bg-red-900/30'>
                    <CircleXIcon className='size-8 text-red-600 dark:text-red-400' />
                  </div>
                  <h3 className='font-medium text-xl'>Submission Failed</h3>
                  <p>Please try submitting your feedback again later.</p>
                  <Button
                    variant='outline'
                    className='mt-4 border text-teal-700 hover:bg-teal-50 hover:text-gray-600 dark:text-teal-300 dark:hover:bg-teal-900/20'
                    onClick={() => setSubmitted(false)}
                  >
                    Try Again
                  </Button>
                </div>
              )
            ) : (
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor={nameId}>
                    Name <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id={nameId}
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='Your name'
                    className={cn(errors.name ? 'border-red-500' : '')}
                  />
                  {errors.name && <p className='text-red-500 text-xs'>Name is required</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={emailId}>
                    Email <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id={emailId}
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='your.email@alexion.com'
                    className={cn(errors.email ? 'border-red-500' : '')}
                  />
                  {errors.email && <p className='text-red-500 text-xs'>Valid email is required</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={feedbackId}>
                    Feedback <span className='text-red-500'>*</span>
                  </Label>
                  <Textarea
                    id={feedbackId}
                    name='feedback'
                    value={formData.feedback}
                    onChange={handleChange}
                    placeholder='Your feedback...'
                    className={cn('min-h-[120px]', errors.feedback ? 'border-red-500' : '')}
                  />
                  {errors.feedback && <p className='text-red-500 text-xs'>Feedback is required</p>}
                </div>
                <CardFooter>
                  <Button type='submit' className='w-full bg-teal-700 text-white hover:bg-teal-800'>
                    {loading && <Spinner variant={1} className='mr-2 text-white' size={'small'} />}
                    Submit
                  </Button>
                </CardFooter>
              </form>
            )}
          </CardContent>
        </div>
        <Image
          src='/image/feedback.png'
          alt='Feedback'
          width={500}
          height={300}
          priority
          className='hidden h-full w-full rounded-r-lg object-cover md:block'
        />
      </Card>
    </div>
  );
}
