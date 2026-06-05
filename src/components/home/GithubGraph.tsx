import { GitHubCalendar } from 'react-github-calendar';

export default function GithubGraph({ username }: { username: string }) {
  // Theme using the site's Emerald accent for contributions
  const emeraldTheme = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#1e1e1e', '#064e3b', '#047857', '#10b981', '#34d399'],
  };

  return (
    <div className="w-full overflow-hidden flex justify-center py-2">
      <div className="max-w-full overflow-x-auto no-scrollbar scroll-smooth">
        <div className="min-w-[750px] pr-4">
          <GitHubCalendar
            username={username}
            colorScheme="dark"
            theme={emeraldTheme}
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