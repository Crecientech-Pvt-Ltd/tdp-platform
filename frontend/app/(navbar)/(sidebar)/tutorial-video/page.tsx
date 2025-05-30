import tutorialVideos from '@/lib/data/tutorial-video.json';

export default function TutorialVideoPage() {
  return (
    <div className='rounded-md shadow-md p-4'>
      <div className='space-y-8'>
        {tutorialVideos.map(video => (
          <div key={video.title} className='flex flex-col lg:flex-row gap-4'>
            <div>
              <h3 className='text-xl font-semibold mb-2'>{video.title}</h3>
              <p className='mb-4'>{video.description}</p>
            </div>
            <video width={400} controls preload='metadata' className='aspect-video rounded-md shadow-md border'>
              <source src={video.videoSrc} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
}
