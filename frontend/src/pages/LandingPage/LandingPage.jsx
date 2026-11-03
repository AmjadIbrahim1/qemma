// frontend/src/pages/LandingPage/LandingPage.jsx - UPDATED WITH CONTEST SECTION
import HeroSection from "../../components/landing/HeroSection/HeroSection";
import WhyQemmaSection from "../../components/landing/WhyQemma/WhyQemmaSection";
import CoursesSection from "../../components/landing/CoursesSection/CoursesSection";
import HowItWorksSection from "../../components/landing/HowItWorks/HowItWorks";
import TopStudentsSection from "../../components/landing/TopStudents/TopStudentsSection";
import AboutSection from "../../components/landing/AboutSection/AboutSection";
import ContestSection from "../../components/landing/ContestSection/ContestSection";
import FinalCTA from "../../components/landing/FinalCTA/FinalCTA";
import Footer from "../../components/landing/Footer/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* ✅ Hero Section with ID */}
      <div id="hero">
        <HeroSection />
      </div>

      {/* ✅ Contest Section - NEW */}
      <div id="contests">
        <ContestSection />
      </div>
      {/* ✅ Features Section with ID */}
      <div id="features">
        <WhyQemmaSection />
      </div>

      {/* ✅ Courses Section with ID */}
      <div id="courses">
        <CoursesSection />
      </div>

      {/* How It Works */}
      <HowItWorksSection />

      {/* ✅ Top Students Section with ID */}
      <div id="top-students">
        <TopStudentsSection />
      </div>

      {/* ✅ About Section with ID */}
      <div id="about">
        <AboutSection />
      </div>

      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
