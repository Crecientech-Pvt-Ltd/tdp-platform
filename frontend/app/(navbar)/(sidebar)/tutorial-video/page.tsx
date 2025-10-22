import tutorialVideos from '@/lib/data/tutorial-video.json';

export default function TutorialVideoPage() {
  return (
    <div className='rounded-md p-4 shadow-md'>
      <div className='space-y-8'>
        {tutorialVideos.map(video => (
          <div key={video.title} className='flex flex-col gap-4 lg:flex-row'>
            <div>
              <h3 className='mb-2 font-semibold text-xl'>{video.title}</h3>
              <p className='mb-4'>{video.description}</p>
            </div>
            <video width={400} controls preload='metadata' className='aspect-video rounded-md border shadow-md'>
              <source src={video.videoSrc} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
}
