export interface HeroContent {
  tag: string;
  title: string;
  highlightWord: string;
  description: string;
  ctaText: string;
  benefits: string[];
}

export interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface Statistic {
  value: string;
  label: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

export interface LandingPageContent {
  hero: HeroContent;
  features: {
    title: string;
    subtitle: string;
    cards: FeatureCard[];
  };
  statistics: Statistic[];
  testimonials: {
    title: string;
    items: Testimonial[];
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
}

// Business Page Types
export interface Instructor {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  rating: number;
  students: number;
  courses: number;
  expertise: string[];
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

export interface ComparisonFeature {
  name: string;
  description?: string;
  team: boolean;
  business: boolean;
  enterprise: boolean;
  notes?: string;
}

export interface ComparisonCategory {
  name: string;
  features: ComparisonFeature[];
}

export interface BusinessPageContent {
  hero: {
    tag: string;
    title: string;
    highlightWord: string;
    description: string;
    ctaText: string;
    benefits: string[];
  };
  benefits: {
    title: string;
    subtitle: string;
    cards: FeatureCard[];
  };
  instructors: {
    title: string;
    subtitle: string;
    items: Instructor[];
  };
  companies: {
    title: string;
    subtitle: string;
    cards: FeatureCard[];
    pricing: {
      title: string;
      subtitle: string;
      tiers: PricingTier[];
    };
    comparison: {
      title: string;
      subtitle: string;
      categories: ComparisonCategory[];
    };
    faq: {
      title: string;
      subtitle: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    };
    testimonials: Testimonial[];
  };
  instructorsInfo: {
    title: string;
    subtitle: string;
    cards: FeatureCard[];
    benefits: string[];
    process: {
      title: string;
      steps: Array<{
        id: string;
        title: string;
        description: string;
      }>;
    };
    faq: {
      title: string;
      subtitle: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    };
    testimonials: Testimonial[];
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
}

