import { HeroSection } from '@/components/HeroSection';
import { WelcomeSection } from '@/components/WelcomeSection';
import { Footer } from '@/components/Footer';
import {
  getCachedAboutCompanyInfo,
  getCachedContactDetails,
  getCachedMessageFromCeo,
} from '@/services/home-cache';
import ServicesSection from '@/components/ServicesSection';
import NewsAndNotices from '@/components/NewsAndNotices';
import ContactHome from '@/components/ContactHome';
import { MessageFromCeoSection } from '@/components/public/MessageFromCeoSection';
import { NoticePopup } from '@/components/public/NoticePopup';
import { CompanyStatsSection } from '@/components/CompanyStatsSection';
import { getTranslations } from "next-intl/server";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomePageProps) {
  const { locale = "en" } = await params;

  // These reads are independent. Awaited in series they stacked four MongoDB
  // round trips (three here plus HeroSection's own) in front of the first byte,
  // which also delayed discovery of the hero image URL.
  const [t, aboutCompanyInfo, messageFromCeo, rawContactDetails] = await Promise.all([
    getTranslations("Home"),
    getCachedAboutCompanyInfo(),
    getCachedMessageFromCeo(),
    getCachedContactDetails(),
  ]);

  const aboutCompanyInfoPublic = aboutCompanyInfo
    ? {
        heading: aboutCompanyInfo.heading,
        "heading-en": aboutCompanyInfo["heading-en"],
        "heading-ne": aboutCompanyInfo["heading-ne"],
        description: aboutCompanyInfo.description,
        "description-en": aboutCompanyInfo["description-en"],
        "description-ne": aboutCompanyInfo["description-ne"],
        imageUrl: aboutCompanyInfo.imageUrl,
        imagePublicId: aboutCompanyInfo.imagePublicId,
      }
    : null;

  const messageFromCeoPublic = messageFromCeo
    ? {
        heading: messageFromCeo.heading,
        "heading-en": messageFromCeo["heading-en"],
        "heading-ne": messageFromCeo["heading-ne"],
        description: messageFromCeo.description,
        "description-en": messageFromCeo["description-en"],
        "description-ne": messageFromCeo["description-ne"],
        imageUrl: messageFromCeo.imageUrl,
        imagePublicId: messageFromCeo.imagePublicId,
      }
    : null;

  const contactDetails = rawContactDetails
    ? {
        phone: {
          text: rawContactDetails.phone?.text ?? "",
          textNe: rawContactDetails.phone?.textNe ?? "",
          link: rawContactDetails.phone?.link ?? "",
        },
        email: {
          text: rawContactDetails.email?.text ?? "",
          textNe: rawContactDetails.email?.textNe ?? "",
          link: rawContactDetails.email?.link ?? "",
        },
        facebook: {
          text: rawContactDetails.facebook?.text ?? "",
          textNe: rawContactDetails.facebook?.textNe ?? "",
          link: rawContactDetails.facebook?.link ?? "",
        },
        whatsapp: {
          text: rawContactDetails.whatsapp?.text ?? "",
          textNe: rawContactDetails.whatsapp?.textNe ?? "",
          link: rawContactDetails.whatsapp?.link ?? "",
        },
        location: {
          text: rawContactDetails.location?.text ?? "",
          textNe: rawContactDetails.location?.textNe ?? "",
          link: rawContactDetails.location?.link ?? "",
        },
        isActive: rawContactDetails.isActive ?? false,
      }
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <NoticePopup />
      <HeroSection />
      <WelcomeSection aboutCompanyInfo={aboutCompanyInfoPublic} />
      <main className="flex-1 w-full pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32">
        <MessageFromCeoSection
          messageFromCeo={messageFromCeoPublic}
          buttonLabel={t("full_message")}
          buttonHref="/message-from-ceo"
        />
        <CompanyStatsSection />
        <ServicesSection />
        <NewsAndNotices locale={locale} />
        <ContactHome contactDetails={contactDetails} locale={locale} />
      </main>
      <Footer />
    </div>
  );
}