import Header from '@/components/header';
import Footer from '@/components/Footer';
import { SocialLink, Skill, Project, Experience, Education } from '@/types';

// Import mock data (in a real app, this would be from API)
async function getSocialLinks(locale: string): Promise<SocialLink[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/mock-data/${locale}/socials.json`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    // Fallback to reading from file system in development
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public/mock-data', locale, 'socials.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }
  return res.json();
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const [socialLinks] = await Promise.resolve(getSocialLinks(locale));

  return (
    <div>
      <Header />
      <main>
        <p>Este es el contenido principal</p>
      </main>
      <Footer socialLinks={socialLinks} />
    </div>
  );
}
