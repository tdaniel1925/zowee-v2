import Header from '@/components/layout/Header'
import Hero from '@/components/landing/Hero'
import AppReplacement from '@/components/landing/AppReplacement'
import HowItWorks from '@/components/landing/HowItWorks'
import RealExamples from '@/components/landing/RealExamples'
import Pricing from '@/components/landing/Pricing'
import Testimonials from '@/components/landing/Testimonials'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import SalesWidgetLoader from '@/components/SalesWidgetLoader'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <AppReplacement />
        <HowItWorks />
        <RealExamples />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
      <SalesWidgetLoader />
    </>
  )
}
