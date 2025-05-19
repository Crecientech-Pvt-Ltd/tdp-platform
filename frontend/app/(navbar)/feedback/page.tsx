'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn, envURL } from '@/lib/utils';
import { CheckCircle, CircleX } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

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
          icon: <CircleX color='red' size={16} />,
        });
        setFormData({ name: '', email: '', feedback: '' });
        setLoading(false);
        setSubmitted('failed');
      }
    }
  };

  return (
    <div className='w-full max-w-5xl my-8 mx-auto'>
      <div className='flex justify-end mb-4'>
        <Link href='/feedback/view-feedback'>
          <Button variant='outline' className='font-medium'>
            View All Feedbacks
          </Button>
        </Link>
      </div>
      <Card className='border grid md:grid-cols-2'>
        <div>
          <CardHeader>
            <CardTitle className='text-lg'>We Value Your Feedback</CardTitle>
            <CardDescription>Help us improve our tools by sharing your thoughts</CardDescription>
          </CardHeader>
          <CardContent className='pt-6'>
            {submitted ? (
              submitted !== 'failed' ? (
                <div className='flex flex-col items-center justify-center py-6 text-center space-y-4'>
                  <div className='rounded-full bg-teal-100 p-3 dark:bg-teal-900/30'>
                    <CheckCircle className='h-8 w-8 text-teal-600 dark:text-teal-400' />
                  </div>
                  <h3 className='text-xl font-medium'>Thank You!</h3>
                  <p className='text-muted-foreground'>Your feedback has been submitted successfully.</p>
                  <Button
                    variant='outline'
                    className='mt-4 border hover:text-gray-600 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-900/20'
                    onClick={() => setSubmitted(false)}
                  >
                    Submit Another Response
                  </Button>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-6 text-center space-y-4'>
                  <div className='rounded-full bg-red-100 p-3 dark:bg-red-900/30'>
                    <CircleX className='h-8 w-8 text-red-600 dark:text-red-400' />
                  </div>
                  <h3 className='text-xl font-medium'>Submission Failed</h3>
                  <p>Please try submitting your feedback again later.</p>
                  <Button
                    variant='outline'
                    className='mt-4 border hover:text-gray-600 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-900/20'
                    onClick={() => setSubmitted(false)}
                  >
                    Try Again
                  </Button>
                </div>
              )
            ) : (
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>
                    Name <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='Your name'
                    className={cn(errors.name ? 'border-red-500' : '')}
                  />
                  {errors.name && <p className='text-red-500 text-xs'>Name is required</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>
                    Email <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='your.email@example.com'
                    className={cn(errors.email ? 'border-red-500' : '')}
                  />
                  {errors.email && <p className='text-red-500 text-xs'>Valid email is required</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='feedback'>
                    Feedback <span className='text-red-500'>*</span>
                  </Label>
                  <Textarea
                    id='feedback'
                    name='feedback'
                    value={formData.feedback}
                    onChange={handleChange}
                    placeholder='Please share your thoughts about our tool...'
                    className={cn('min-h-[120px]', errors.feedback ? 'border-red-500' : '')}
                  />
                  {errors.feedback && <p className='text-red-500 text-xs'>Feedback is required</p>}
                </div>
                <CardFooter>
                  <Button type='submit' className='w-full bg-teal-700 hover:bg-teal-800 text-white'>
                    {loading && <Spinner variant={1} className='text-white mr-2' size={'small'} />}
                    Submit Feedback
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
          height={500}
          priority
          className='hidden md:block object-cover rounded-r-lg w-full h-full'
        />
      </Card>
    </div>
  );
}
