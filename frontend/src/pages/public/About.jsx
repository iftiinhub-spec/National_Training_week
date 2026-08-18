import React from 'react';
import {
  AcademicCapIcon, BookOpenIcon, BriefcaseIcon, BuildingLibraryIcon, CheckCircleIcon,
  CodeBracketIcon, EnvelopeIcon, GlobeAltIcon, HeartIcon, LightBulbIcon,
  MapPinIcon, UserGroupIcon, VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useCurrentEvent } from '../../context/EventContext';
import PublicPageHeader from '../../components/common/PublicPageHeader';

const OBJECTIVES = [
  'Expand access to learning by providing free and accessible training opportunities to people across Somalia, regardless of their location or educational background.',
  'Develop practical and relevant skills through structured sessions addressing emerging technologies, professional development, and national priorities.',
  'Connect expertise with the wider community by bringing together academics, professionals, industry experts, and learners on a shared national platform.',
  'Promote lifelong learning by encouraging students, graduates, professionals, and members of the public to continuously develop their knowledge and skills.',
  "Support national development by focusing each annual edition on a theme relevant to Somalia's current and future social, economic, and technological needs.",
  "Strengthen collaboration and knowledge sharing among universities, industry, public institutions, development partners, and communities."
];

const AUDIENCE = [
  { Icon: UserGroupIcon, role: 'General Public', text: 'Sessions in plain language for anyone curious about AI, with no background needed.' },
  { Icon: BookOpenIcon, role: 'Teachers & Educators', text: 'Practical AI tools for lesson planning, assessment, and classroom work.' },
  { Icon: AcademicCapIcon, role: 'University Students & Scholars', text: 'Skills that strengthen academic research and prepare learners for industry.' },
  { Icon: CodeBracketIcon, role: 'Developers & IT Professionals', text: 'Hands-on work with AI tools, APIs, model integration, and practical development.' },
  { Icon: BriefcaseIcon, role: 'Entrepreneurs & Business Owners', text: 'Use AI to improve operations, marketing, customer service, and business growth.' },
  { Icon: BuildingLibraryIcon, role: 'High-School Graduates', text: 'Discover university majors and career paths that will remain relevant in the future.' },
  { Icon: HeartIcon, role: 'Health & Community Organizations', text: 'Awareness, outreach, and communication tools that support frontline work.' },
];

const OUTCOMES = [
  { value: '1,000+', title: 'People trained directly', text: 'Citizens, professionals, and students trained directly, with thousands more reached online.' },
  { Icon: VideoCameraIcon, title: 'Permanent learning library', text: 'A free, permanently available recorded library of all published training sessions.' },
  { Icon: AcademicCapIcon, title: 'Informed education choices', text: 'Hundreds of secondary-school graduates guided toward informed study and career decisions.' },
  { Icon: LightBulbIcon, title: 'An annual national platform', text: 'A lasting flagship platform supporting digital-skills development across Somalia.' },
];

const COMMITTEES = ['Program and speakers', 'Registration and certification', 'Media and livestream', 'Partnerships', 'Volunteers'];

const SectionHeading = ({ eyebrow, children }) => (
  <div className="mb-12 text-center">
    <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#1da156]">{eyebrow}</p>
    <h2 className="inline-block text-3xl font-black text-black sm:text-4xl">{children}<span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-[#1da156]" /></h2>
  </div>
);

export const About = () => {
  const { event, days } = useCurrentEvent();
  const dates = event?.startDate && event?.endDate
    ? `${new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${new Date(event.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : 'Dates to be announced';

  return (
    <div className="min-h-screen bg-white">
      <PublicPageHeader eyebrow="About the initiative" title="National Training Week" description="is a national training platform established by Hormuud University and held once a year. Over the course of a single week it opens a series of structured sessions to the country at large, organised so that participation turns on interest and commitment rather than on holding a place at a university or living within reach of one." />

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <SectionHeading eyebrow="Background & Purpose">Expanding access to practical AI skills</SectionHeading>
          <div className="grid items-start gap-14 lg:grid-cols-2">
            <div className="space-y-5">
              <p className="text-sm leading-7 text-black/70">Artificial intelligence is reshaping education, business, health, agriculture, and public administration worldwide. With a young population and one of Africa&apos;s most dynamic mobile-money and telecommunications ecosystems, Somalia is well positioned to benefit when people have the awareness and practical skills to use these technologies.</p>
              <p className="text-sm leading-7 text-black/70">AI knowledge in Somalia remains concentrated within a small circle of specialists. Students, teachers, entrepreneurs, and community organizations have had limited access to structured training. Hormuud University established National Training Week to close that gap through free, accessible, expert-led learning.</p>
              <p className="text-sm leading-7 text-black/70">{event ? <>The <strong className="text-black">{event.year} edition</strong> centres on <strong className="text-[#1da156]">{event.theme}</strong>. {event.year === 2026 && <>It is the inaugural edition of National Training Week. </>}It is part of a free nationwide capacity-building initiative that returns annually with a new national theme. Over {days.length || 'several'} focused days, participants join interactive online sessions led by university faculty, industry practitioners, and subject experts.</> : <>The initiative returns annually with a new national theme and a structured program of practical online sessions led by university faculty, industry practitioners, and subject experts.</>}</p>
              <div className="flex flex-wrap gap-3 pt-2">{(event ? [dates, 'Online delivery', `${days.length || 'Multiple'} program days`] : ['Annual program', 'Online delivery', 'Open national participation']).map((tag) => <span key={tag} className="rounded-full border border-[#1da156] bg-white px-4 py-1.5 text-xs font-bold text-[#1da156]">{tag}</span>)}</div>
            </div>
            <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-[#1da156]"><AcademicCapIcon className="h-5 w-5" /> Core Objectives</h3>
              <ul className="space-y-3">{OBJECTIVES.map((objective) => <li key={objective} className="flex items-start gap-3 text-sm text-black/80"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#1da156]" /><span>{objective}</span></li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <SectionHeading eyebrow="Audience Scope">Target Participant Groups</SectionHeading>
          <div className="flex flex-wrap items-stretch justify-center gap-6">
            {AUDIENCE.map(({ Icon, role, text }) => <article key={role} className="group w-full rounded-2xl border border-black/10 bg-white p-8 text-center transition-all hover:border-[#1da156] hover:shadow-lg sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 transition-colors group-hover:bg-[#1da156]"><Icon className="h-7 w-7 text-[#1da156] transition-colors group-hover:text-white" /></div><h3 className="mb-2 text-sm font-bold text-black transition-colors group-hover:text-[#1da156]">{role}</h3><p className="text-sm leading-6 text-black/60">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <SectionHeading eyebrow="Expected Outcomes">A lasting national contribution</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OUTCOMES.map(({ value, Icon, title, text }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className={`flex h-12 items-center justify-center rounded-xl bg-[#1da156]/10 text-[#1da156] ${value ? 'min-w-12 w-fit px-3' : 'w-12'}`}>{value ? <span className="whitespace-nowrap text-base font-black tabular-nums">{value}</span> : <Icon className="h-6 w-6" />}</div><h3 className="mt-5 text-sm font-black text-slate-950">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-600">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#1da156] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mb-10 text-center"><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-white/70">About the Organizer</p><h2 className="inline-block text-3xl font-black text-white sm:text-4xl">Hormuud University<span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-white" /></h2></div>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm leading-7 text-white/90">Hormuud University is a leading national institution of higher learning advancing workforce development and capacity building across engineering, technology, computer science, and digital management—connecting Somali youth, professionals, and scholars to the global knowledge economy.</p>
            <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-6 text-left"><h3 className="text-sm font-black text-white">Organizing Committee</h3><p className="mt-2 text-xs leading-6 text-white/80">An Organizing Committee under the Office of the Rector coordinates the event through dedicated teams.</p><ul className="mt-4 flex flex-wrap gap-2">{COMMITTEES.map((committee) => <li key={committee} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">{committee}</li>)}</ul></div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3"><div className="flex items-center gap-2 text-sm font-medium text-white/80"><MapPinIcon className="h-4 w-4 shrink-0 text-white" /><span>Daru Shura Campus, Villa Baidoa, Wadajir, Mogadishu, Somalia</span></div><div className="flex items-center gap-2 text-sm font-medium text-white/80"><EnvelopeIcon className="h-4 w-4 shrink-0 text-white" /><a href="mailto:info@ntw.hu.edu.so" className="hover:text-white hover:underline">info@ntw.hu.edu.so</a></div><div className="flex items-center gap-2 text-sm font-medium text-white/80"><GlobeAltIcon className="h-4 w-4 shrink-0 text-white" /><a href="https://www.ntw.hu.edu.so" className="hover:text-white hover:underline">www.ntw.hu.edu.so</a></div></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
