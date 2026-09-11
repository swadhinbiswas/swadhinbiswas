import { useEffect, useState } from 'react';
import { GitHubCalendar } from 'react-github-calendar';

export default function GithubGraph({ username }: { username: string }) {
  // Monochrome commit graph — greyscale ramp matching the ink & paper system
  const monoTheme = {
    light: ['#ebedf0', '#c7c7cc', '#9a9aa2', '#5c5c63', '#1a1a1c'],
    dark: ['#17171a', '#3a3a40', '#5e5e66', '#94949c', '#f0f0f2'],
  };

  const [scheme, setScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const resolve = () => {
      const explicit = document.documentElement.getAttribute('data-theme');
      if (explicit === 'light' || explicit === 'dark') return explicit;
      return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    };
    const update = () => setScheme(resolve());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full overflow-hidden flex justify-center py-2">
      <div className="max-w-full overflow-x-auto no-scrollbar scroll-smooth">
        <div className="min-w-[750px] pr-4">
          <GitHubCalendar
            username={username}
            colorScheme={scheme}
            theme={monoTheme}
            fontSize={12}
            blockSize={12}
            blockMargin={4}
            blockRadius={3}
            hideColorLegend={true}
          />
        </div>
      </div>
    </div>
  );
}
