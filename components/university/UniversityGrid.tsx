import UniversityCard from '@/components/university/UniversityCard';
import type { UniversityData } from '@/lib/types';

interface Props {
  universities: UniversityData[];
}

export default function UniversityGrid({ universities }: Props) {
  return (
    <section id="universities" className="max-w-6xl mx-auto px-4 py-16 bg-white">
      <h2 className="section-heading text-center">Choose Your University</h2>
      <p className="section-subheading text-center">
        Live universities with verified Summer 2026 course data — click to browse
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {universities.map((uni) => (
          <UniversityCard key={uni.slug} uni={uni} />
        ))}
      </div>
    </section>
  );
}
